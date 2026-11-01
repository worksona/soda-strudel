// Writing help inside the editor:
//   – autocomplete for every Strudel + soda function, with docs and an example
//   – inside strings: sound names in s("…"), banks in .bank("…"), media in img/vid,
//     visual plugins, fx and blend modes – all from what is actually loaded
//   – hints on hover: function docs, names in strings, mini-notation (hints.js)
// It replaces Strudel's own autocomplete/tooltip extensions in the same editor
// compartments, so the Settings › Editor toggles keep working.
import { autocompletion } from '@codemirror/autocomplete';
import { hoverTooltip, tooltips } from '@codemirror/view';
import { codemirrorSettings, compartments, extensions } from '@strudel/codemirror';
import { sodaEditorKeys } from './keys.js';
import { soundMap } from '@strudel/webaudio';
import { listMedia } from '../soda/mediaRegistry.js';
import { BLENDS, FX, VISUALS } from '../soda/catalog.js';
import { hintAt } from './hints.js';

let docs = [];
const byName = new Map();

export async function loadDocs() {
  if (docs.length) return docs;
  docs = await fetch('/strudel-docs.json').then((r) => r.json());
  for (const doc of docs) {
    byName.set(doc.name, doc);
    for (const syn of doc.synonyms ?? []) if (!byName.has(syn)) byName.set(syn, { ...doc, name: syn, synonymOf: doc.name });
  }
  return docs;
}
export const getDocs = () => docs;
export const findDoc = (name) => byName.get(name);

/** Plain text from Strudel's doc HTML (never inject it as HTML). */
export function docText(html = '') {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent.replace(/\s+/g, ' ').trim();
}

export function renderDoc(doc, { compact = false, examples = true } = {}) {
  const el = document.createElement('div');
  el.className = 'doc';
  const title = document.createElement('strong');
  title.textContent = doc.synonymOf ? `${doc.name} → ${doc.synonymOf}` : doc.name;
  const desc = document.createElement('p');
  desc.textContent = docText(doc.description);
  el.append(title, desc);
  if (doc.params?.length && !compact) {
    const ul = document.createElement('ul');
    for (const p of doc.params) {
      const li = document.createElement('li');
      li.textContent = `${p.name}${p.type?.names ? ` (${p.type.names.join(' | ')})` : ''}${p.description ? ` – ${docText(p.description)}` : ''}`;
      ul.append(li);
    }
    el.append(ul);
  }
  if (examples && doc.examples?.[0]) {
    const pre = document.createElement('pre');
    pre.textContent = doc.examples[0];
    el.append(pre);
  }
  return el;
}

// ---------- what's loaded ----------
const soundNames = () => Object.keys(soundMap.get()).sort();
function bankNames() {
  const banks = new Set();
  for (const name of Object.keys(soundMap.get())) {
    const i = name.lastIndexOf('_');
    if (i > 0) banks.add(name.slice(0, i));
  }
  return [...banks].sort();
}

const STRING_SOURCES = {
  s: () => soundNames().map((label) => ({ label, type: 'constant', detail: 'sound' })),
  sound: () => STRING_SOURCES.s(),
  bank: () => bankNames().map((label) => ({ label, type: 'namespace', detail: 'bank' })),
  img: () => listMedia().filter((m) => m.type !== 'video').map((m) => ({ label: m.name, type: 'constant', detail: m.local ? 'your image' : 'image' })),
  vid: () => listMedia().filter((m) => m.type === 'video').map((m) => ({ label: m.name, type: 'constant', detail: m.local ? 'your video' : 'video' })),
  visual: () => Object.entries(VISUALS).map(([label, v]) => ({ label, type: 'enum', detail: 'visual', info: v.description })),
  fx: () => FX.map((label) => ({ label, type: 'enum', detail: 'fx' })),
  blend: () => BLENDS.map((label) => ({ label, type: 'enum', detail: 'blend' })),
};

function completions(context) {
  const line = context.state.doc.lineAt(context.pos);
  const before = line.text.slice(0, context.pos - line.from);

  // inside the first string argument of a known function: s("bd sd …|")
  const inString = before.match(/\b([a-zA-Z_]\w*)\(\s*"([^"]*)$/);
  if (inString && STRING_SOURCES[inString[1]]) {
    const word = context.matchBefore(/[\w#.-]*$/);
    return { from: word.from, options: STRING_SOURCES[inString[1]](), validFor: /^[\w#.-]*$/ };
  }
  if (/"[^"]*$/.test(before.replace(/"[^"]*"/g, ''))) return null; // other mini-notation strings

  const word = context.matchBefore(/\w+$/);
  if (!word || (word.from === word.to && !context.explicit) || (word.to - word.from < 2 && !context.explicit)) return null;
  return {
    from: word.from,
    validFor: /^\w*$/,
    options: [...byName.values()].map((doc) => ({
      label: doc.name,
      type: doc.tags?.includes('soda') ? 'class' : 'function',
      detail: doc.synonymOf ? `→ ${doc.synonymOf}` : doc.tags?.includes('soda') ? 'soda' : '',
      info: () => renderDoc(doc),
    })),
  };
}

export const assistCompletion = autocompletion({ override: [completions], closeOnBlur: true, activateOnTyping: true, maxRenderedOptions: 80 });

// Point at anything in the code for a hint: a function's doc, what a name in a
// string is (an effector, a visual, a sound, a note…), or what a mini-notation
// symbol does. No modifier key needed – see hints.js.
function hintContext() {
  const sounds = soundMap.get();
  return {
    findDoc: (name) => byName.get(name),
    sounds,
    banks: new Set(bankNames()),
    media: new Map(listMedia().map((m) => [m.name, m.local ? `your ${m.type === 'video' ? 'video' : 'image'}` : m.type === 'video' ? 'a video in the media pack' : 'an image in the media pack'])),
  };
}

function renderHint({ title, body }) {
  const el = document.createElement('div');
  el.className = 'doc hint';
  const t = document.createElement('strong');
  t.textContent = title;
  const p = document.createElement('p');
  p.textContent = body;
  el.append(t, p);
  return el;
}

const hintHover = hoverTooltip(
  (view, pos, side) => {
    const line = view.state.doc.lineAt(pos);
    const hint = hintAt(line.text, pos - line.from, side, hintContext());
    if (!hint) return null;
    return {
      pos: line.from + hint.from,
      end: line.from + hint.to,
      create: () => ({ dom: hint.doc ? renderDoc(hint.doc, { compact: true }) : renderHint(hint) }),
    };
  },
  { hoverTime: 350 },
);

// hints sit below the word, and flip above only if there's room under the
// toolbar – the toolbar covers the top of the editor
const belowToolbar = tooltips({
  tooltipSpace: () => ({ top: document.getElementById('toolbar')?.getBoundingClientRect().bottom ?? 0, left: 0, bottom: innerHeight, right: innerWidth }),
});
export const assistHover = [hintHover, belowToolbar];

// ---------- editor settings (Strudel's own persisted atom) ----------
export const EDITOR_DEFAULTS = {
  isAutoCompletionEnabled: true,
  isTooltipEnabled: true,
  isBracketMatchingEnabled: true,
  isLineNumbersDisplayed: true,
  isPatternHighlightingEnabled: true,
  isFlashEnabled: true,
  fontSize: 15,
};

export const getEditorSettings = () => codemirrorSettings.get();

/** Applies Strudel's editor settings, then swaps in our completion, hover and keys. */
// Phones always wrap code to the screen and use at least 16px text (iOS zooms
// into anything smaller). Applied on top of the saved settings, never saved, so
// a desktop preference for long lines is kept.
export const phoneViewport = matchMedia('(max-width: 680px)');
const PHONE_MIN_FONT = 16;

export function applyEditorSettings(mirror, patch = {}) {
  const settings = { ...codemirrorSettings.get(), ...patch };
  mirror.updateSettings(settings);
  if (phoneViewport.matches) {
    mirror.reconfigureExtension('isLineWrappingEnabled', true);
    if (Number(settings.fontSize) < PHONE_MIN_FONT) mirror.setFontSize(PHONE_MIN_FONT);
  }
  mirror.editor.dispatch({
    effects: [
      compartments.isAutoCompletionEnabled.reconfigure(settings.isAutoCompletionEnabled ? assistCompletion : []),
      compartments.isTooltipEnabled.reconfigure(settings.isTooltipEnabled ? assistHover : []),
      // our play / stop / find keys first, then the chosen Keys mode
      compartments.keybindings.reconfigure([sodaEditorKeys, extensions.keybindings(settings.keybindings)]),
    ],
  });
  return settings;
}

/** First visit: turn the writing help on (Strudel ships it off). */
export function initEditorSettings(mirror) {
  let first = true;
  try {
    first = !localStorage.getItem('soda.editorInit');
    localStorage.setItem('soda.editorInit', '1');
  } catch {
    // private mode – just apply defaults every time
  }
  // crossing the phone breakpoint (rotation, resizing) re-applies wrapping
  phoneViewport.addEventListener('change', () => applyEditorSettings(mirror));
  return applyEditorSettings(mirror, first ? EDITOR_DEFAULTS : {});
}
