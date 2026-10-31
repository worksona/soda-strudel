import './styles.css';
import { StrudelMirror } from '@strudel/codemirror';
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, initAudio, webaudioOutput } from '@strudel/webaudio';
import { prebake } from './strudel/setup.js';
import { Stage } from './stage/stage.js';
import { isMediaOnly } from './soda/catalog.js';
import { decodeSketch } from './share/sketch.js';
import { readSodaFile } from './share/sodafile.js';
import { importFiles, registerLibrary, libraryChanged, saveTake } from './media/library.js';
import { cameraOn, disableCamera, enableCamera, flipCamera, onCameraChange } from './media/camera.js';
import { isRecording, startTake, stopTake } from './media/mic.js';
import { saveSketch as storeSketch } from './storage/db.js';
import { getSettings, onSettings } from './settings.js';
import { initEditorSettings } from './editor/assist.js';
import { aboutView, editorThemeChoice, examplesView, onLog, referenceView } from './ui/learn.js';
import { applyAppearance, EDITOR_THEME_FOR, onThemeChange } from './theme.js';
import { applyEditorSettings } from './editor/assist.js';
import { repl } from '@strudel/core';
import { clearHydra } from '@strudel/hydra';
import { createLibrary } from './ui/library.js';
import { createSketches } from './ui/sketches.js';
import { createSettings } from './ui/settings.js';
import { createShare } from './ui/share.js';
import { createExport, slug } from './ui/export.js';
import { createFileMenu } from './ui/fileMenu.js';
import { buildSodaFile } from './share/sodafile.js';
import { download } from './export/record.js';
import { copyForClaude } from './ui/claude.js';
import { hydrateIcons, icon, setIcon } from './ui/icons.js';
import { $, h, lsGet, lsSet, toast } from './ui/dom.js';
import { DEFAULT_CODE } from './default-code.js';

applyAppearance();
hydrateIcons();

// ---------- state ----------
const fromLink = await decodeSketch(location.hash).catch((e) => {
  toast(`Could not open that link: ${e.message}`, { error: true });
  return null;
});
const saved = lsGet('soda.sketch', null);
// a shared link is never "your" saved sketch, so it starts without an id
const sketch = { title: '', aspect: 'free', ...(fromLink ? { ...fromLink, id: undefined } : saved ?? { code: DEFAULT_CODE, title: 'First light' }) };
let lastSavedCode = sketch.id ? sketch.code : null;
let lastError = null;
let playing = false;
// viewing someone's link must not overwrite your own autosaved sketch – until you Remix
let viewing = !!fromLink;

// ---------- layout: everything sits below the toolbar ----------
new ResizeObserver(([entry]) =>
  document.documentElement.style.setProperty('--bar', `${Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight)}px`),
).observe($('#toolbar'));

// ---------- stage + editor ----------
const stage = new Stage($('#stage'));
stage.setAspect(sketch.aspect);

const mirror = new StrudelMirror({
  root: $('#editor'),
  initialCode: sketch.code,
  drawContext: stage.painterContext,
  drawTime: [-2, 2],
  prebake,
  transpiler,
  solo: false,
  bgFill: false,
  getTime: () => getAudioContext().currentTime,
  // media / caption / visual events are for the stage, not the speakers
  defaultOutput: (hap, ...rest) => output(hap, ...rest),
  onDraw: (haps, time, painters) => stage.update(haps, time, painters, mirror.drawTime),
  onToggle: (started) => setPlaying(started),
  onEvalError: (err) => showError(err),
  // Hydra keeps painting until cleared – drop it when the new code doesn't use it
  beforeEval: () => dropHydraUnlessUsed(mirror.code),
  afterEval: ({ code }) => {
    showError(null);
    sketch.code = code;
    persist();
  },
});
initEditorSettings(mirror);

function dropHydraUnlessUsed(code) {
  if (!/\binitHydra\s*\(/.test(code ?? '')) clearHydra();
}

// media / caption / visual events are for the stage, not the speakers
const output = (hap, ...rest) => (isMediaOnly(hap.value) ? undefined : webaudioOutput(hap, ...rest));

// "Listen" in Examples / Reference plays code on a separate repl, leaving the editor alone
let previewRepl;
let previewing = false;
async function previewCode(code) {
  await ensureAudio();
  await mirror.stop();
  previewRepl ??= repl({
    defaultOutput: output,
    getTime: () => getAudioContext().currentTime,
    transpiler,
    beforeEval: ({ code }) => dropHydraUnlessUsed(code),
    onEvalError: (e) => toast(e.message, { error: true }),
  });
  await previewRepl.evaluate(code);
  previewing = true;
  setPlaying(true);
  toast('Listening to the example – Stop ends it, Play goes back to your code.');
}
function stopPreview() {
  if (!previewing) return;
  previewRepl?.stop();
  previewing = false;
}

let audioReady;
async function ensureAudio() {
  audioReady ??= initAudio();
  await getAudioContext().resume();
  await audioReady;
}

function setPlaying(next) {
  playing = next && !previewing;
  stage.setPlaying(next);
  document.body.classList.toggle('playing', next);
  const btn = $('#play');
  setIcon(btn, next ? 'stop' : 'play');
  btn.querySelector('.cap').textContent = next ? 'Stop' : 'Play';
  btn.setAttribute('aria-label', next ? 'Stop' : 'Play');
  btn.setAttribute('aria-pressed', String(next));
}

function showError(err) {
  lastError = err ? err.message ?? String(err) : null;
  const bar = $('#error');
  bar.textContent = lastError ?? '';
  bar.hidden = !lastError;
}

let persistTimer;
function persist() {
  if (viewing) return;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    lsSet('soda.sketch', { id: sketch.id, title: sketch.title, aspect: sketch.aspect, media: sketch.media, code: mirror.code });
    document.body.classList.toggle('unsaved', !!sketch.id && mirror.code !== lastSavedCode);
  }, 300);
}
mirror.editor.dom.addEventListener('keyup', persist);

async function play() {
  stopPreview();
  await ensureAudio();
  await mirror.evaluate();
}
async function stop() {
  if (previewing) {
    stopPreview();
    return setPlaying(false);
  }
  await mirror.stop();
}

/** Puts a line at the very top of the code (e.g. a samples() call), once. */
function prepend(line) {
  if (mirror.code.includes(line)) return toast('Already in this sketch.');
  mirror.editor.dispatch({ changes: { from: 0, insert: `${line}\n` } });
  persist();
  toast('Added to the top of the sketch.');
}

function insert(text) {
  const view = mirror.editor;
  const { from, to } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  // block snippets go on their own line
  const atLineStart = text.startsWith('$:') && from !== line.from;
  const insertAt = atLineStart ? line.to : from;
  const content = atLineStart ? `\n${text.replace(/\n$/, '')}` : text;
  view.dispatch({ changes: { from: insertAt, to: atLineStart ? insertAt : to, insert: content }, selection: { anchor: insertAt + content.length } });
  view.focus();
  setMode('code');
}

// ---------- modes: Code · Stage · Full screen ----------
function setMode(mode) {
  document.body.dataset.mode = mode;
  document.querySelectorAll('#modes [data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
}
const fullscreen = () => $('#stage').requestFullscreen?.().catch(() => toast('Full screen is not available here.'));
$('#modes').addEventListener('click', async (e) => {
  const mode = e.target.closest('[data-mode]')?.dataset.mode;
  if (!mode) return;
  if (mode === 'full') {
    setMode('stage');
    await fullscreen();
  } else setMode(mode);
});
setMode('code');

// ---------- toolbar: play + inputs ----------
$('#play').addEventListener('click', () => (playing || previewing ? stop() : play()).catch((e) => toast(e.message, { error: true })));

$('#mic').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  try {
    if (isRecording()) {
      btn.classList.remove('live');
      const wav = await stopTake();
      if (!wav) return toast('Nothing recorded.');
      const name = await saveTake(wav);
      toast(`Saved take "${name}" – use s("${name}")`);
      openPage('sounds', true);
    } else {
      await ensureAudio();
      await startTake();
      btn.classList.add('live');
      toast('Recording a take – tap the mic again to stop.');
    }
  } catch (err) {
    btn.classList.remove('live');
    toast(`Microphone: ${err.message}`, { error: true });
  }
});

$('#camera').addEventListener('click', async () => {
  try {
    cameraOn() ? disableCamera() : await enableCamera();
  } catch (err) {
    toast(`Camera: ${err.message}`, { error: true });
  }
});
$('#flip').addEventListener('click', () => flipCamera().catch((err) => toast(err.message, { error: true })));
onCameraChange((on) => {
  $('#camera').classList.toggle('live', on);
  $('#camera').setAttribute('aria-pressed', String(on));
  $('#flip').hidden = !on;
});

// ---------- sketches: save / open / new ----------
function thumbnail() {
  const src = stage.canvas;
  if (!src.width) return undefined;
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = Math.round((160 * src.height) / src.width);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.7);
}

async function saveCurrent({ asNew = false } = {}) {
  const rec = await storeSketch({
    id: asNew ? undefined : sketch.id,
    created: asNew ? undefined : sketch.created,
    title: sketch.title || 'Untitled',
    aspect: sketch.aspect,
    media: sketch.media,
    code: mirror.code,
    thumb: thumbnail(),
  });
  Object.assign(sketch, { id: rec.id, created: rec.created, title: rec.title });
  lastSavedCode = rec.code;
  document.body.classList.remove('unsaved');
  persist();
  toast(`Saved “${rec.title}”.`);
  return rec;
}

function loadSketch(s) {
  Object.assign(sketch, { id: undefined, created: undefined, title: '', aspect: 'free', media: undefined }, s);
  delete sketch.thumb;
  mirror.setCode(s.code);
  stage.setAspect(sketch.aspect);
  if (s.media) import('./soda/patterns.js').then(({ media }) => media(s.media));
  lastSavedCode = s.id ? s.code : null;
  document.body.classList.remove('unsaved');
  persist();
}

const isDirty = () => mirror.code !== (lastSavedCode ?? DEFAULT_CODE) && mirror.code.trim() !== '';

const app = {
  stage,
  mirror,
  ensureAudio,
  insert,
  prepend,
  previewCode,
  loadExample(ex) {
    if (isDirty() && !confirm(`Open the “${ex.title}” example? Unsaved changes to this sketch will be lost.`)) return;
    stopPreview();
    loadSketch({ title: ex.title, code: ex.code, aspect: ex.aspect ?? 'free' });
    if (innerWidth < 700) openPage(page, false); // phones: get out of the way
    play().catch((e) => toast(e.message, { error: true }));
  },
  getSketch: () => ({ ...sketch, code: mirror.code, by: getSettings().name || undefined }),
  setTitle: (t) => ((sketch.title = t), persist()),
  setAspect: (a) => {
    sketch.aspect = a;
    stage.setAspect(a);
    persist();
  },
  getPattern: () => mirror.repl.state.pattern,
  /** The evaluated pattern – evaluates the code first (without playing) if it never ran. */
  async ensurePattern() {
    if (!mirror.repl.state.pattern) {
      await ensureAudio();
      await mirror.repl.evaluate(mirror.code, false);
    }
    const pattern = mirror.repl.state.pattern;
    if (!pattern) throw new Error(lastError ?? 'the code has an error – fix it, then export');
    return pattern;
  },
  getCps: () => mirror.repl.scheduler.cps,
  isPlaying: () => playing,
  play,
  stop,
  openFile: () => $('#file-open').click(),
  saveSketch: saveCurrent,
  async openSketch(s) {
    if (isDirty() && s.id !== sketch.id && !confirm('Open another sketch? Unsaved changes to this one will be lost.')) return;
    loadSketch(s);
    toast(`Opened “${s.title || 'Untitled'}”.`);
  },
  newSketch() {
    if (isDirty() && !confirm('Start a new sketch? Unsaved changes to this one will be lost.')) return false;
    loadSketch({ code: '// new sketch – ctrl+enter to play\nsetcps(.5)\n$: s("kick*4").bank("soda")\n', title: '' });
    return true;
  },
  forgetSketchId: () => {
    sketch.id = undefined;
    lastSavedCode = null;
    persist();
  },
};

// ---------- pages: one level, opened from icon buttons in the toolbar ----------
// Every page has its own button; the panel opens on the right, under them.
// On phones the page buttons fold into one "pages" button that shows a grid.
const panel = $('#panel');
const panelBody = $('#panel .drawer-body');
const PAGES = {
  sketches: 'Open sketch',
  examples: 'Examples',
  sounds: 'Sounds',
  media: 'Media',
  reference: 'Reference',
  export: 'Export',
  share: 'Share',
  about: 'About',
  settings: 'Settings',
  more: 'Pages',
};
let page = null;
const pageOpen = (p) => !panel.hidden && (!p || page === p);

const library = createLibrary({ root: panelBody, app, isVisible: () => (pageOpen('sounds') || pageOpen('media') ? page : null) });
const sketchesPage = createSketches({ root: panelBody, app });
const settingsPage = createSettings({ root: panelBody, app });
const exportPage = createExport({ root: panelBody, app });
const sharePage = createShare({ root: panelBody, app });

// phones: every page plus Export / Share / Claude as a grid of big icons
function morePage() {
  const action = (id, iconName, label) => h('button', { onclick: () => (openPage(page, false), $(`#${id}`).click()) }, icon(iconName, 22), label);
  return h(
    'div.page-grid',
    {},
    Object.entries(PAGES)
      .filter(([k]) => k !== 'more' && k !== 'sketches') // sketches live in the File menu
      .map(([k, title]) => h('button', { onclick: () => openPage(k, true) }, icon({ export: 'download' }[k] ?? k, 22), title)),
    action('claude', 'claude', 'Claude'),
  );
}

async function renderPage({ focus } = {}) {
  const views = {
    sketches: () => sketchesPage.render(),
    examples: () => panelBody.replaceChildren(examplesView(app, renderPage)),
    sounds: () => library.render('sounds', { focus }),
    media: () => library.render('media'),
    reference: () => panelBody.replaceChildren(referenceView(app, renderPage)),
    export: () => exportPage.render(),
    share: () => sharePage.render(),
    about: () => panelBody.replaceChildren(aboutView(renderPage)),
    settings: () => settingsPage.render(),
    more: () => panelBody.replaceChildren(morePage()),
  };
  await views[page]();
  if (focus && page !== 'sounds') {
    const el = panelBody.querySelector(focus);
    el?.focus();
    el?.setSelectionRange?.(el.value.length, el.value.length);
  }
}

/** Open a page; clicking the open page's button again closes the panel. */
function openPage(next, force) {
  const open = force ?? !(pageOpen() && next === page);
  if (open && next !== page) panelBody.scrollTop = 0;
  page = next;
  panel.hidden = !open;
  $('#panel-title').textContent = PAGES[next];
  document.querySelectorAll('#toolbar [data-page]').forEach((b) => b.setAttribute('aria-pressed', String(open && b.dataset.page === next && b.id !== 'brand')));
  if (open) renderPage();
}
app.openPage = (p) => openPage(p, true);
app.downloadSoda = async () => {
  const sketch = app.getSketch();
  const { blob, manifest } = await buildSodaFile(sketch);
  download(blob, `${slug(sketch.title)}.soda`);
  toast(`Downloaded .soda file with ${manifest.sounds.length} of your sounds and ${manifest.media.length} media file(s).`);
};
createFileMenu({ button: $('#file'), menu: $('#file-menu'), app });

// tiny captions under the toolbar icons (a test – Settings › Appearance)
const applyNavLabels = ({ navLabels }) => document.body.classList.toggle('nav-labels', navLabels !== false);
applyNavLabels(getSettings());
onSettings(applyNavLabels);

document.querySelectorAll('#toolbar [data-page]').forEach((b) => b.addEventListener('click', () => openPage(b.dataset.page)));
$('#panel-close').addEventListener('click', () => openPage(page, false));
onLog(() => pageOpen('about') && renderPage());

// ---------- appearance: light / dark / system ----------
onThemeChange((theme) => {
  if (editorThemeChoice() === 'auto') applyEditorSettings(mirror, { theme: EDITOR_THEME_FOR[theme] });
});
if (editorThemeChoice() === 'auto') applyEditorSettings(mirror, { theme: EDITOR_THEME_FOR[document.documentElement.dataset.theme] });

// ---------- export / share / claude ----------

$('#claude').addEventListener('click', async () => {
  try {
    await copyForClaude(app.getSketch(), lastError);
    toast('Copied for Claude – paste it into a chat. The strudel-vibe skill is under Settings › About.', { ms: 5000 });
  } catch (e) {
    toast(`Could not copy: ${e.message}`, { error: true });
  }
});

// ---------- files: drag & drop anywhere, .soda open ----------
async function openFiles(files) {
  const soda = files.filter((f) => f.name.endsWith('.soda'));
  const rest = files.filter((f) => !f.name.endsWith('.soda'));
  for (const f of soda) {
    try {
      const s = await readSodaFile(f);
      await registerLibrary();
      libraryChanged();
      loadSketch(s);
      toast(`Opened ${s.title || f.name} – save it to keep it in Sketches.`);
    } catch (e) {
      toast(`${f.name}: ${e.message}`, { error: true });
    }
  }
  if (rest.length) {
    const added = await importFiles(rest);
    if (added.length) {
      toast(`Added ${added.map((a) => `${a.kind} "${a.name}"`).join(', ')}`);
      openPage(added[0].kind === 'media' ? 'media' : 'sounds', true);
    }
  }
}
$('#file-open').addEventListener('change', (e) => openFiles([...e.target.files]).finally(() => (e.target.value = '')));
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  document.body.classList.add('dragging');
});
window.addEventListener('dragleave', (e) => e.relatedTarget === null && document.body.classList.remove('dragging'));
window.addEventListener('drop', (e) => {
  e.preventDefault();
  document.body.classList.remove('dragging');
  openFiles([...(e.dataTransfer?.files ?? [])]);
});

// ---------- viewer mode for shared links ----------
if (fromLink) {
  if (fromLink.media) import('./soda/patterns.js').then(({ media }) => media(fromLink.media));
  document.body.classList.add('viewer');
  setMode('stage');
  const card = $('#title-card');
  const start = async (withCamera) => {
    card.hidden = true;
    try {
      if (withCamera) await enableCamera().catch(() => toast('Camera unavailable – playing without it.'));
      await play();
    } catch (e) {
      toast(e.message, { error: true });
    }
  };
  card.replaceChildren(
    h(
      'div.card',
      {},
      h('h1', {}, fromLink.title || 'Untitled sketch'),
      fromLink.by ? h('p.by', {}, `by ${fromLink.by}`) : null,
      fromLink.camera
        ? h(
            'div.choices',
            {},
            h('p', {}, 'This piece uses your camera. Nothing leaves your device.'),
            h('button.primary', { onclick: () => start(true) }, icon('camera'), ' Play with camera'),
            h('button', { onclick: () => start(false) }, icon('play'), ' Play without'),
          )
        : h('button.primary.huge', { onclick: () => start(false) }, icon('play', 22), ' Tap to play'),
      h('p.muted', {}, 'Made with soda.strudel · runs entirely in your browser'),
    ),
  );
  card.hidden = false;
  $('#viewer-full').addEventListener('click', fullscreen);
  $('#remix').addEventListener('click', () => {
    viewing = false;
    persist();
    document.body.classList.remove('viewer');
    setMode('code');
    history.replaceState(null, '', location.pathname);
  });
}

// a sketch link opened in an already-open tab only changes the hash – start fresh
window.addEventListener('hashchange', () => location.hash.includes('z=') && location.reload());

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !panel.hidden) openPage(page, false);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && !viewing) {
    e.preventDefault();
    saveCurrent().catch((err) => toast(err.message, { error: true }));
  }
});

window.soda = { mirror, stage, app };
