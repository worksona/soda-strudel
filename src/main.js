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
import { aboutView, editorThemeChoice, examplesView, onLog, referenceView, vibeView } from './ui/learn.js';
import { applyAppearance, EDITOR_THEME_FOR, onThemeChange } from './theme.js';
import { applyEditorSettings } from './editor/assist.js';
import { repl } from '@strudel/core';
import { clearHydra } from '@strudel/hydra';
import { createLibrary } from './ui/library.js';
import { createSettings } from './ui/settings.js';
import { createShare } from './ui/share.js';
import { createExport, slug } from './ui/export.js';
import { createFileMenu } from './ui/fileMenu.js';
import { createDropdown, menuItem, menuSeparator } from './ui/menu.js';
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
// what was last opened or saved – only edits beyond this count as "unsaved"
let baselineCode = lastSavedCode ?? (fromLink ? fromLink.code : DEFAULT_CODE);
let lastError = null;
let playing = false;
let evaluatedCode = null; // what is playing now – edits beyond it turn Play into Update
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
    evaluatedCode = code;
    syncPlayButton();
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
  unlockMobileAudio();
  audioReady ??= initAudio();
  await getAudioContext().resume();
  await audioReady;
}

// iPhone: Web Audio is muted by the ring/silent switch unless the page is a
// "playback" session. Newer Safari has navigator.audioSession; older ones switch
// once any <audio> element plays, so play a tiny silent clip on the first tap.
let unlocked = false;
// 0.1 s of 8-bit silence
const SILENT_WAV = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
function unlockMobileAudio() {
  if (unlocked) return;
  unlocked = true;
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch {
    // not supported – the silent clip below covers older Safari
  }
  const silence = new Audio(SILENT_WAV);
  silence.setAttribute('playsinline', '');
  silence.play().catch(() => {});
}

function setPlaying(next) {
  playing = next && !previewing;
  stage.setPlaying(next);
  document.body.classList.toggle('playing', next);
  $('#play').setAttribute('aria-pressed', String(next));
  syncPlayButton();
}

/** Play · Stop · Update (playing, with edits not yet applied – the touch-screen ctrl+enter). */
const needsUpdate = () => playing && evaluatedCode !== null && mirror.code !== evaluatedCode;
function syncPlayButton() {
  const btn = $('#play');
  const state = needsUpdate() ? 'update' : playing || previewing ? 'stop' : 'play';
  if (btn.dataset.state === state) return;
  btn.dataset.state = state;
  setIcon(btn, state);
  const label = { play: 'Play', stop: 'Stop', update: 'Update' }[state];
  btn.querySelector('.cap').textContent = label;
  btn.setAttribute('aria-label', label);
  btn.title = { play: 'Play (ctrl+enter)', stop: 'Stop (ctrl+.)', update: 'Apply your changes (ctrl+enter)' }[state];
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
for (const ev of ['input', 'keyup', 'paste', 'cut']) mirror.editor.dom.addEventListener(ev, () => queueMicrotask(syncPlayButton));

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
  // on touch screens focusing the editor pops the keyboard over everything
  if (touchScreen) toast(playing ? 'Inserted – tap Update to hear it.' : 'Inserted – tap Play to hear it.');
  else view.focus();
  setMode('code');
  syncPlayButton();
}
const touchScreen = matchMedia('(hover: none) and (pointer: coarse)').matches;

// ---------- View: Code · Stage · Full screen (a pulldown) ----------
function setMode(mode) {
  document.body.dataset.mode = mode;
  setIcon($('#view'), mode === 'stage' ? 'stage' : 'code'); // the View button shows the current view
}
// iPhone Safari has no Fullscreen API for anything but video – fall back to an
// in-page full screen (toolbar hidden, stage edge to edge, an exit button).
function fullscreen() {
  const stageEl = $('#stage');
  if (document.fullscreenEnabled && stageEl.requestFullscreen) return stageEl.requestFullscreen().catch(() => pseudoFull(true));
  return pseudoFull(true);
}
function pseudoFull(on) {
  document.body.classList.toggle('pseudo-full', on);
  $('#exit-full').hidden = !on;
  stage.resize();
}
$('#exit-full').addEventListener('click', () => pseudoFull(false));
setMode('code');
createDropdown({
  button: $('#view'),
  menu: $('#view-menu'),
  build: ({ close }) => {
    const mode = document.body.dataset.mode;
    return [
      menuItem('code', 'Code over the stage', () => setMode('code'), { checked: mode === 'code', close }),
      menuItem('stage', 'Stage only', () => setMode('stage'), { checked: mode === 'stage', close }),
      menuSeparator(),
      menuItem('full', 'Full screen', () => (setMode('stage'), fullscreen()), { close }),
    ];
  },
});

// ---------- toolbar: play + inputs ----------
$('#play').addEventListener('click', () => (needsUpdate() ? play() : playing || previewing ? stop() : play()).catch((e) => toast(e.message, { error: true })));

// ---------- Input: microphone takes and the camera (a pulldown) ----------
async function toggleTake() {
  try {
    if (isRecording()) {
      const wav = await stopTake();
      syncInput();
      if (!wav) return toast('Nothing recorded.');
      const name = await saveTake(wav);
      toast(`Saved take "${name}" – use s("${name}")`);
      openPage('sounds', true);
    } else {
      await ensureAudio();
      await startTake();
      syncInput();
      toast('Recording a take – Input › Stop recording when you are done.');
    }
  } catch (err) {
    syncInput();
    toast(`Microphone: ${err.message}`, { error: true });
  }
}
async function toggleCamera() {
  try {
    cameraOn() ? disableCamera() : await enableCamera();
  } catch (err) {
    toast(`Camera: ${err.message}`, { error: true });
  }
}
/** The Input button glows while the mic records or the camera is on. */
function syncInput() {
  const btn = $('#input');
  const rec = isRecording();
  btn.classList.toggle('live', rec || cameraOn());
  setIcon(btn, rec || !cameraOn() ? 'mic' : 'camera');
  btn.querySelector('.cap').textContent = rec ? 'Rec' : cameraOn() ? 'Cam on' : 'Input';
  btn.setAttribute('aria-label', rec ? 'Input – recording' : cameraOn() ? 'Input – camera on' : 'Input');
}
createDropdown({
  button: $('#input'),
  menu: $('#input-menu'),
  build: ({ close }) => [
    menuItem('mic', isRecording() ? 'Stop recording' : 'Record a take', toggleTake, { close }),
    menuItem('camera', 'Camera', toggleCamera, { checked: cameraOn(), close }),
    menuItem('flip', 'Switch camera', () => flipCamera().catch((err) => toast(err.message, { error: true })), { disabled: !cameraOn(), close }),
    h('p.menu-empty', {}, 'Takes become sounds in your library. The camera stays on this device.'),
  ],
});
onCameraChange(syncInput);

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
  baselineCode = rec.code;
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
  baselineCode = s.code;
  document.body.classList.remove('unsaved');
  persist();
}

const isDirty = () => mirror.code !== baselineCode && mirror.code.trim() !== '';

/**
 * Replace what's in the editor without asking first. If there were edits,
 * the toast offers Undo, which puts the previous sketch and code back.
 */
function replaceSketch(next, message) {
  const previous = isDirty() ? { sketch: { ...sketch, code: mirror.code }, baseline: baselineCode, saved: lastSavedCode } : null;
  loadSketch(next);
  toast(previous ? `${message} – your edits were replaced.` : message, {
    ms: previous ? 8000 : 3200,
    action: previous && {
      label: 'Undo',
      run: () => {
        loadSketch(previous.sketch);
        baselineCode = previous.baseline;
        lastSavedCode = previous.saved;
        persist();
        toast('Your edits are back.');
      },
    },
  });
}

const app = {
  stage,
  toast,
  mirror,
  ensureAudio,
  insert,
  prepend,
  previewCode,
  loadExample(ex) {
    stopPreview();
    replaceSketch({ title: ex.title, code: ex.code, aspect: ex.aspect ?? 'free' }, `Opened “${ex.title}”`);
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
    replaceSketch(s, `Opened “${s.title || 'Untitled'}”`);
  },
  newSketch() {
    replaceSketch({ code: '// new sketch – ctrl+enter to play\nsetcps(.5)\n$: s("kick*4").bank("soda")\n', title: '' }, 'New sketch');
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
  examples: 'Examples',
  sounds: 'Sounds',
  media: 'Media',
  reference: 'Reference',
  export: 'Export',
  share: 'Share',
  vibe: 'Vibe with Claude',
  about: 'About',
  settings: 'Settings',
  more: 'Pages',
};
let page = null;
const pageOpen = (p) => !panel.hidden && (!p || page === p);

const library = createLibrary({ root: panelBody, app, isVisible: () => (pageOpen('sounds') || pageOpen('media') ? page : null) });
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
      .filter(([k]) => k !== 'more')
      .map(([k, title]) => h('button', { onclick: () => openPage(k, true) }, icon({ export: 'download' }[k] ?? k, 22), k === 'vibe' ? 'Vibe' : title)),
    action('claude', 'claude', 'Claude'),
  );
}

async function renderPage({ focus } = {}) {
  const views = {
    examples: () => panelBody.replaceChildren(examplesView(app, renderPage)),
    sounds: () => library.render('sounds', { focus }),
    media: () => library.render('media'),
    reference: () => panelBody.replaceChildren(referenceView(app, renderPage)),
    export: () => exportPage.render(),
    share: () => sharePage.render(),
    vibe: () => panelBody.replaceChildren(vibeView(app)),
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
    toast('Copied for Claude – paste it into a chat. Get the strudel-vibe skill from the Vibe page.', { ms: 5000 });
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
      toast(`Opened ${s.title || f.name} – File › Save keeps it in this browser.`);
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
  if (e.key === 'Escape' && document.body.classList.contains('pseudo-full')) pseudoFull(false);
  else if (e.key === 'Escape' && !panel.hidden) openPage(page, false);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && !viewing) {
    e.preventDefault();
    saveCurrent().catch((err) => toast(err.message, { error: true }));
  }
});

// installable app + quick reopen (production builds only – it would fight the dev server)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('[soda] service worker', e)));
}

window.soda = { mirror, stage, app };
