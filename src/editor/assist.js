// Writing help inside the editor:
//   – autocomplete for every Strudel + soda function, with docs and an example
//   – inside strings: sound names in s("…"), banks in .bank("…"), media in img/vid,
//     visual plugins, fx and blend modes – all from what is actually loaded
//   – hints on hover: function docs, names in strings, mini-notation (hints.js)
//   – examples on the cards are live: Add as a layer, Replace the line, Copy.
//     The hover card stays up while the pointer travels to it.
// It replaces Strudel's own autocomplete/tooltip extensions in the same editor
// compartments, so the Settings › Editor toggles keep working.
import { autocompletion, closeCompletion } from '@codemirror/autocomplete';
import { closeHoverTooltips, hoverTooltip, tooltips, ViewPlugin } from '@codemirror/view';
import { codemirrorSettings, compartments, extensions } from '@strudel/codemirror';
import { sodaEditorKeys } from './keys.js';
import { soundMap } from '@strudel/webaudio';
import { listMedia } from '../soda/mediaRegistry.js';
import { BLENDS, FX, VISUALS } from '../soda/catalog.js';
import { hintAt } from './hints.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/dom.js';

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

/**
 * A function's card. With `view`, its examples get Add / Replace line / Copy
 * buttons; `line()` says which line of the code they act on.
 */
export function renderDoc(doc, { compact = false, examples = true, view = null, line = () => view?.state.selection.main.head ?? 0 } = {}) {
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
    if (view) for (const ex of doc.examples.slice(0, 3)) el.append(exampleBlock(ex, view, line));
    else {
      const pre = document.createElement('pre');
      pre.textContent = doc.examples[0];
      el.append(pre);
    }
  }
  return el;
}

// ---------- examples you can use from a card ----------
let hovered = null; // { from, to } of the word the hover card is for
/** As a layer of its own: a single expression gets `$: `; whole programs go in as they are. */
export function asLayer(example) {
  const code = example.trim();
  if (/^\s*\$:/m.test(code)) return code;
  // another top-level line (not a chained .method or an indented argument) = a program
  const topLevel = code.split('\n').slice(1).filter((l) => l.trim() && !/^\s/.test(l) && !/^[.)\]}]/.test(l));
  return topLevel.length ? code : `$: ${code.replace(/\n/g, '\n  ')}`;
}

/** The last line of the block the line at `pos` belongs to (its chained / indented lines). */
function blockEnd(doc, pos) {
  let line = doc.lineAt(pos);
  while (line.number < doc.lines) {
    const next = doc.line(line.number + 1);
    if (!/^\s+\S|^\s*\./.test(next.text)) break;
    line = next;
  }
  return line;
}

function useExample(view, line, how, example) {
  const { state } = view;
  const at = state.doc.lineAt(Math.min(line(), state.doc.length));
  if (how === 'replace') {
    const end = blockEnd(state.doc, at.from);
    const insert = asLayer(example);
    view.dispatch({ changes: { from: at.from, to: end.to, insert }, selection: { anchor: at.from + insert.length }, userEvent: 'input.example', scrollIntoView: true });
  } else {
    const end = blockEnd(state.doc, at.from);
    const insert = `\n${asLayer(example)}`;
    view.dispatch({ changes: { from: end.to, insert }, selection: { anchor: end.to + insert.length }, userEvent: 'input.example', scrollIntoView: true });
  }
  closeCompletion(view);
  view.dispatch({ effects: closeHoverTooltips });
  hovered = null;
  view.focus();
  toast(how === 'replace' ? 'Line replaced – ctrl+enter to hear it.' : 'Added as a layer – ctrl+enter to hear it.');
}

function exampleBlock(example, view, line) {
  const box = document.createElement('div');
  box.className = 'doc-example';
  const pre = document.createElement('pre');
  pre.textContent = example;
  const row = document.createElement('div');
  row.className = 'doc-actions';
  const button = (name, label, title, run) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = title;
    b.append(icon(name, 14), ` ${label}`);
    // keep the editor focused, so the suggestion card isn't closed by the click
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      run();
    });
    return b;
  };
  row.append(
    button('plus', 'Add', 'Add this example as a new layer below', () => useExample(view, line, 'add', example)),
    button('rename', 'Replace line', 'Replace this line with the example', () => useExample(view, line, 'replace', example)),
    button('copy', 'Copy', 'Copy the example', () =>
      navigator.clipboard.writeText(example).then(
        () => toast('Example copied.'),
        () => toast('Could not copy.', { error: true }),
      ),
    ),
  );
  box.append(pre, row);
  return box;
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
      info: () => renderDoc(doc, { view: context.view }),
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
    const range = { from: line.from + hint.from, to: line.from + hint.to };
    return {
      pos: range.from,
      end: range.to,
      create: () => {
        hovered = range;
        return { dom: hint.doc ? renderDoc(hint.doc, { view, line: () => range.from }) : renderHint(hint) };
      },
    };
  },
  { hoverTime: 350 },
);

// CodeMirror closes a hover card as soon as the pointer leaves the word. Going
// from the word to its card, the pointer crosses other code – so while it is in
// the corridor between the two, that mousemove never reaches CodeMirror.
const stickyHover = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.view = view;
      this.onMove = (e) => {
        const card = document.querySelector('.cm-tooltip-hover');
        if (!card || !hovered || e.buttons) return;
        const a = view.coordsAtPos(hovered.from);
        const b = view.coordsAtPos(hovered.to);
        if (!a || !b) return;
        const box = card.getBoundingClientRect();
        const above = box.top < a.top;
        const left = Math.min(a.left, box.left) - 8;
        const right = Math.max(b.right, box.right) + 8;
        const top = above ? box.bottom - 4 : Math.min(a.top, b.top);
        const bottom = above ? Math.max(a.bottom, b.bottom) : box.top + 4;
        if (e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom) e.stopPropagation();
      };
      view.dom.addEventListener('mousemove', this.onMove, true);
    }
    destroy() {
      this.view.dom.removeEventListener('mousemove', this.onMove, true);
    }
  },
);

// hints sit below the word, and flip above only if there's room under the
// toolbar – the toolbar covers the top of the editor
// They live on <body>: the editor sits in a fixed layer that would trap them
// under an open side panel.
const belowToolbar = tooltips({
  parent: document.body,
  tooltipSpace: () => ({ top: document.getElementById('toolbar')?.getBoundingClientRect().bottom ?? 0, left: 0, bottom: innerHeight, right: innerWidth }),
});
export const assistHover = [hintHover, stickyHover, belowToolbar];

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
