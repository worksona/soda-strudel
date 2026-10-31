// Page views: About (with the log), Examples, Reference, and the Editor section
// of Settings. Each returns an element; `rerender` redraws the page.
import { $, h } from './dom.js';
import { icon } from './icons.js';
import { CATEGORIES, EXAMPLES } from '../examples.js';
import { WORKSHOP } from '../workshop.js';
import { docText, findDoc, getDocs, loadDocs, renderDoc, applyEditorSettings, getEditorSettings } from '../editor/assist.js';
import { themes } from '@strudel/codemirror';
import { EDITOR_THEME_FOR, resolvedTheme } from '../theme.js';
import { lsGet, lsSet } from './dom.js';

// ---------- console: collect Strudel's log from the start ----------
const logs = [];
const logListeners = new Set();
document.addEventListener('strudel.log', (e) => {
  const { message, type } = e.detail ?? {};
  logs.push({ time: new Date(), message: String(message), type: type ?? 'info' });
  if (logs.length > 400) logs.shift();
  logListeners.forEach((fn) => fn());
});
export const onLog = (fn) => (logListeners.add(fn), () => logListeners.delete(fn));

const link = (href, text) => h('a', { href, target: '_blank', rel: 'noopener' }, text);
const kbd = (k) => h('kbd', {}, k);
const table = (rows, code = false) =>
  h('table.keys', {}, rows.map(([k, v]) => h('tr', {}, h('td', {}, code ? h('code', {}, k) : kbd(k)), h('td', {}, v))));

// ---------- About ----------
const VERSION = '0.0.1';
let logOpen = false;
export function aboutView(rerender) {
  return h(
    'div.about',
    {},
    h('p.lead', {}, h('strong', {}, 'soda.strudel'), ' – live-code music, pictures, camera and story in your browser, built on ', link('https://strudel.cc', 'Strudel'), '. Everything runs on your device; sketches share as links.'),
    h(
      'p.credit',
      {},
      'A personal project by David · ',
      h('a', { href: 'mailto:david@atomic47.co' }, 'david@atomic47.co'),
      ' · ',
      link('https://sodanovels.com', 'sodanovels.com'),
    ),
    h('h4', {}, 'How it works'),
    h(
      'ol.steps',
      {},
      h('li', {}, h('strong', {}, 'Write or open a sketch. '), 'Start from an Example, or type in the editor. Each ', h('code', {}, '$:'), ' line is a layer.'),
      h('li', {}, h('strong', {}, 'Press Play. '), 'ctrl+enter plays your changes in time; ctrl+. stops.'),
      h('li', {}, h('strong', {}, 'Add pictures and words. '), h('code', {}, 'img()'), ', ', h('code', {}, 'cam()'), ', ', h('code', {}, 'visual()'), ' and ', h('code', {}, 'captions()'), ' are patterns too – they change with the music.'),
      h('li', {}, h('strong', {}, 'Save, share, export. '), 'File › Save keeps your work in this browser (your sketches are listed in the File menu), Share copies a link, Export makes a video, a WAV or a .soda file.'),
    ),
    h('h4', {}, 'Keys'),
    table([
      ['ctrl+enter', 'play / update'],
      ['ctrl+.', 'stop'],
      ['ctrl+s', 'save the sketch'],
      ['ctrl+space', 'show completions'],
      ['hold ctrl / cmd + point', 'docs for a function'],
      ['ctrl+/', 'comment a line'],
    ]),
    h('h4', {}, 'Mini-notation (inside double quotes)'),
    table(
      [
        ['"a b c"', 'a sequence in one cycle'],
        ['"[a b]"', 'squeeze into one step'],
        ['"<a b>"', 'one per cycle'],
        ['"a*4" / "a/2"', 'faster / slower'],
        ['"~"', 'rest'],
        ['"a, b"', 'together'],
        ['"a(3,8)"', 'Euclidean rhythm'],
        ['"a:2"', 'sample variation'],
        ['"a?"  "a|b"', 'maybe / random choice'],
      ],
      true,
    ),
    h('h4', {}, 'Picture'),
    h('pre', {}, `$: img("<night sea>").slow(4).fade(.3)
$: cam().mirror(1).fx("posterize")
$: visual("particles").hue(200)
$: captions(['line one', '', 'line two'])`),
    h('h4', {}, 'Links'),
    h(
      'ul.links',
      {},
      h('li', {}, link('https://strudel.cc/workshop/getting-started/', 'Strudel workshop')),
      h('li', {}, link('https://strudel.cc/learn/mini-notation/', 'Mini-notation in depth')),
      h('li', {}, link('https://github.com/worksona/soda-strudel', 'Source code (AGPL-3.0)')),
      h('li', {}, h('a', { href: '/strudel-vibe.zip', download: 'strudel-vibe.zip' }, 'Claude skill (strudel-vibe.zip)')),
    ),
    h(
      'details.log-section',
      { open: logOpen, ontoggle: (e) => (logOpen = e.target.open) },
      h('summary', {}, `Log (${logs.length})`),
      consoleView(rerender),
    ),
    h('p.muted.version', {}, `soda.strudel ${VERSION}`),
  );
}

// ---------- Vibe: the strudel-vibe Claude skill ----------
const SKILL_REPO = 'https://github.com/worksona/strudel-vibe';
export function vibeView(app) {
  const step = (n, title, ...body) => h('li', {}, h('strong', {}, title), ' ', ...body);
  const prompt = (text) => h('li', {}, h('button.prompt', { title: 'Copy this prompt', onclick: () => navigator.clipboard?.writeText(text).then(() => app.toast('Prompt copied – paste it into Claude.')) }, `“${text}”`));
  return h(
    'div.vibe',
    {},
    h(
      'p.lead',
      {},
      h('strong', {}, 'Vibe it with Claude.'),
      ' Describe a mood, a story or a picture – the ',
      h('strong', {}, 'strudel-vibe'),
      ' skill writes the music, pictures and words as a soda.strudel sketch, checks it with Strudel’s real engine, and hands you a link that plays here.',
    ),
    h(
      'div.vibe-actions',
      {},
      h('a.button.primary', { href: '/strudel-vibe.zip', download: 'strudel-vibe.zip' }, icon('download', 16), ' Download the skill'),
      h('a.button', { href: SKILL_REPO, target: '_blank', rel: 'noopener' }, icon('external', 16), ' Skill on GitHub'),
      h('button', { onclick: () => $('#claude').click() }, icon('claude', 16), ' Copy this sketch for Claude'),
    ),
    h('h4', {}, 'Install'),
    h(
      'ol.steps',
      {},
      step(1, 'claude.ai –', 'download the skill above, then Settings › Capabilities › Skills › Upload.'),
      step(2, 'Claude Code –', h('code', {}, '/plugin marketplace add worksona/strudel-vibe'), ' then ', h('code', {}, '/plugin install strudel-vibe@strudel-vibe'), '.'),
      step(3, 'By hand –', 'unzip into ', h('code', {}, '~/.claude/skills/'), '.'),
    ),
    h('h4', {}, 'Ask for'),
    h(
      'ul.prompts',
      {},
      prompt('A 9:16 lo-fi piece about the last bus home, with captions.'),
      prompt('Something like a sunrise over the sea – ambient, no drums.'),
      prompt('Set this poem to music with pictures: …'),
      prompt('Make it darker, and add a breakbeat from clean-breaks.'),
    ),
    h('h4', {}, 'How it works'),
    h(
      'ol.steps',
      {},
      h('li', {}, 'Claude reads the vibe and picks tempo, sounds, pictures and shape.'),
      h('li', {}, 'It writes the sketch and validates it – syntax, sounds (including GitHub libraries), visuals, captions.'),
      h('li', {}, 'You get a link: open it, tap play, Remix to change it.'),
      h('li', {}, 'To keep going, press ', h('strong', {}, 'Claude'), ' in the toolbar – it copies your code, any error and your own sound names – and paste it into the chat.'),
    ),
    h('h4', {}, 'Links'),
    h(
      'ul.links',
      {},
      h('li', {}, link(SKILL_REPO, 'strudel-vibe on GitHub')),
      h('li', {}, link(`${SKILL_REPO}#readme`, 'Skill README – install, use, configure')),
      h('li', {}, link('https://strudel.cc/workshop/getting-started/', 'Strudel workshop')),
      h('li', {}, link('https://github.com/worksona/soda-strudel', 'soda.strudel source (AGPL-3.0)')),
    ),
  );
}

// ---------- Examples (two tabs: ours · Strudel's workshop) ----------
let examplesTab = 'examples';
const tabs = (current, items, onPick) =>
  h(
    'div.subtabs.segmented',
    { role: 'tablist' },
    items.map(([key, label]) => h('button', { role: 'tab', 'aria-selected': String(key === current), onclick: () => onPick(key) }, label)),
  );

const exampleActions = (app, code, ex) =>
  h(
    'div.ex-actions',
    {},
    h('button', { title: 'Hear it without changing your code', onclick: () => app.previewCode(code) }, icon('listen'), ' Listen'),
    h('button', { title: 'Replace the editor with this example', onclick: () => app.loadExample(ex) }, icon('code'), ' Open'),
  );

function ourExamples(app) {
  return [
    h('p.muted', {}, 'Pieces that show what soda.strudel can do – music with pictures, words and story. Listen leaves your code alone; Open loads it.'),
    ...CATEGORIES.map((category) => {
      const list = EXAMPLES.filter((ex) => ex.category === category);
      if (!list.length) return null;
      return h(
        'section',
        {},
        h('h4', {}, category),
        h(
          'ul.examples',
          {},
          list.map((ex) =>
            h('li', {}, h('div.meta', {}, h('strong', {}, ex.title), h('small', {}, ex.about), h('small.shape', {}, ex.aspect === 'free' ? 'any shape' : ex.aspect)), exampleActions(app, ex.code, ex)),
          ),
        ),
      );
    }),
  ];
}

function workshop(app) {
  return [
    h(
      'p.muted',
      {},
      'Every example from the ',
      link('https://strudel.cc/workshop/getting-started/', 'Strudel workshop'),
      ', in order – the best way to learn Strudel step by step. Read along on the workshop pages; play and change the code here. (Strudel contributors, AGPL-3.0.)',
    ),
    ...WORKSHOP.map((chapter, ci) => {
      const details = h('details.chapter', { open: ci === 0 }, h('summary', {}, `${chapter.title} (${chapter.items.length})`));
      // chapters fill in when opened – there are ~150 examples
      const fill = () => {
        if (details.dataset.filled) return;
        details.dataset.filled = '1';
        let lastHeading = '';
        const list = h('ul.workshop', {});
        chapter.items.forEach((item, i) => {
          if (item.heading !== lastHeading) list.append(h('li.ws-heading', {}, item.heading));
          lastHeading = item.heading;
          const ex = { title: `${chapter.title} · ${item.heading}`, code: item.code, aspect: 'free' };
          list.append(h('li.ws-item', {}, h('pre', {}, item.code), exampleActions(app, item.code, ex)));
        });
        details.append(h('p', {}, link(chapter.url, `Read “${chapter.title}” on strudel.cc`)), list);
      };
      if (details.open) fill();
      else details.addEventListener('toggle', fill, { once: true });
      return details;
    }),
  ];
}

export function examplesView(app, rerender) {
  return h(
    'div.examples-wrap',
    {},
    tabs(examplesTab, [
      ['examples', 'Examples'],
      ['workshop', 'Workshop'],
    ], (t) => ((examplesTab = t), rerender())),
    ...(examplesTab === 'workshop' ? workshop(app) : ourExamples(app)).filter(Boolean),
  );
}

// ---------- Reference ----------
const ref = { query: '', selected: 'note' };
export function referenceView(app, rerender) {
  const all = getDocs();
  if (!all.length) {
    loadDocs().then(rerender);
    return h('p.muted', {}, 'Loading reference…');
  }
  const q = ref.query.toLowerCase();
  const matches = all.filter(
    (d) => !q || d.name.toLowerCase().includes(q) || d.synonyms?.some((s) => s.toLowerCase().includes(q)) || (q.length > 3 && docText(d.description).toLowerCase().includes(q)),
  );
  // keep the selection while it still matches the search, otherwise show the first match
  const selected = matches.some((d) => d.name === ref.selected) ? findDoc(ref.selected) : matches[0];
  const search = h('input', {
    type: 'search',
    value: ref.query,
    placeholder: `Search ${all.length} functions`,
    'aria-label': 'Search functions',
    oninput: (e) => {
      ref.query = e.target.value;
      rerender({ focus: 'input[type=search]' });
    },
  });
  return h(
    'div.reference',
    {},
    h('label.search', {}, icon('search'), search),
    h(
      'div.ref-split',
      {},
      h(
        'ul.ref-list',
        {},
        matches.slice(0, 300).map((d) =>
          h('li', {}, h('button', { className: d.name === selected?.name ? 'current' : '', onclick: () => ((ref.selected = d.name), rerender()) }, d.name, d.tags?.includes('soda') ? h('small', {}, ' soda') : null)),
        ),
      ),
      selected
        ? h(
            'div.ref-doc',
            {},
            renderDoc(selected, { examples: false }),
            selected.synonyms?.length ? h('p.muted', {}, `Also: ${selected.synonyms.join(', ')}`) : null,
            ...(selected.examples ?? []).map((ex) =>
              h(
                'div.example',
                {},
                h('pre', {}, ex),
                h(
                  'div.row',
                  {},
                  h('button', { onclick: () => app.previewCode(ex) }, icon('listen'), ' Listen'),
                  h('button', { onclick: () => app.insert(`\n$: ${ex.replace(/\n/g, '\n  ')}\n`) }, icon('plus'), ' Insert'),
                ),
              ),
            ),
          )
        : h('p.muted', {}, 'No match.'),
    ),
  );
}

// ---------- Console ----------
export function consoleView(rerender) {
  // shown inside About › Log
  return h(
    'div.console',
    {},
    h('div.row', {}, h('button', { onclick: () => ((logs.length = 0), rerender()) }, icon('trash'), ' Clear')),
    logs.length
      ? h('ol.log', {}, [...logs].reverse().map((l) => h('li', { className: l.type }, h('time', {}, l.time.toLocaleTimeString()), ' ', l.message)))
      : h('p.muted', {}, 'Strudel messages (loading, evaluation, errors) appear here.'),
  );
}

// ---------- Editor (a section of Settings) ----------
/** 'auto' follows the app's light / dark theme; anything else is a fixed Strudel theme. */
export const editorThemeChoice = () => lsGet('soda.editorTheme', 'auto');

export function editorView(app, rerender) {
  const s = getEditorSettings();
  const set = (patch) => {
    applyEditorSettings(app.mirror, patch);
    rerender();
  };
  const toggle = (key, label) => h('label.toggle', {}, h('input', { type: 'checkbox', checked: !!s[key], onchange: (e) => set({ [key]: e.target.checked }) }), label);
  return h(
    'div.editor-settings',
    {},
    h(
      'label.field',
      {},
      'Editor theme',
      h(
        'select',
        {
          onchange: (e) => {
            const choice = e.target.value;
            lsSet('soda.editorTheme', choice);
            set({ theme: choice === 'auto' ? EDITOR_THEME_FOR[resolvedTheme()] : choice });
          },
        },
        h('option', { value: 'auto', selected: editorThemeChoice() === 'auto' }, 'Match the app (light / dark)'),
        Object.keys(themes).map((t) => h('option', { value: t, selected: editorThemeChoice() === t }, t)),
      ),
    ),
    h('label.field', {}, 'Keys', h('select', { onchange: (e) => set({ keybindings: e.target.value }) }, ['codemirror', 'vim', 'emacs', 'vscode'].map((k) => h('option', { value: k, selected: k === s.keybindings }, k)))),
    h('label.field', {}, `Font size (${s.fontSize}px)`, h('input', { type: 'range', min: 10, max: 32, value: s.fontSize, onchange: (e) => set({ fontSize: Number(e.target.value) }) })),
    h(
      'label.field',
      {},
      'Font',
      h(
        'select',
        { onchange: (e) => set({ fontFamily: e.target.value }) },
        ['monospace', 'ui-monospace, SFMono-Regular, Menlo, monospace', 'Courier New, monospace', 'Consolas, monospace'].map((f) => h('option', { value: f, selected: f === s.fontFamily }, f.split(',')[0])),
      ),
    ),
    toggle('isAutoCompletionEnabled', 'Autocomplete functions, sounds and media'),
    toggle('isTooltipEnabled', 'Docs on hover (hold ctrl / cmd)'),
    toggle('isBracketClosingEnabled', 'Close brackets'),
    toggle('isBracketMatchingEnabled', 'Match brackets'),
    toggle('isLineNumbersDisplayed', 'Line numbers'),
    toggle('isLineWrappingEnabled', 'Wrap long lines (always on for phones)'),
    toggle('isActiveLineHighlighted', 'Highlight the current line'),
    toggle('isPatternHighlightingEnabled', 'Highlight events as they play'),
    toggle('isFlashEnabled', 'Flash on evaluate'),
    toggle('isTabIndentationEnabled', 'Tab key indents'),
    toggle('isMultiCursorEnabled', 'Multiple cursors (ctrl/cmd + click)'),
  );
}
