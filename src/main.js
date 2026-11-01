import './styles.css';
import { StrudelMirror } from '@strudel/codemirror';
import './editor/widgets.js'; // one canvas per inline visual – before any widget is drawn
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, initAudio, webaudioOutput } from '@strudel/webaudio';
import { prebake } from './strudel/setup.js';
import { Stage } from './stage/stage.js';
import { isMediaOnly, TIMELINE_VISUALS } from './soda/catalog.js';
import { decodeCollection, decodeSketch } from './share/sketch.js';
import { creditHeader, fetchPiece } from './share/pieces.js';
import { readSodaFile } from './share/sodafile.js';
import { importFiles, registerLibrary, libraryChanged, saveTake } from './media/library.js';
import { cameraOn, disableCamera, enableCamera, flipCamera, onCameraChange } from './media/camera.js';
import { isRecording, startTake, stopTake } from './media/mic.js';
import { disableMic, enableMic, micOn, onMicChange } from './media/micInput.js';
import { saveSketch as storeSketch } from './storage/db.js';
import { getSettings, onSettings } from './settings.js';
import { initEditorSettings } from './editor/assist.js';
import { fromPointer, installPageKeys } from './editor/keys.js';
import { aboutView, editorThemeChoice, examplesView, onLog, referenceView, showCollection, vibeView } from './ui/learn.js';
import { applyAppearance, EDITOR_THEME_FOR, onThemeChange } from './theme.js';
import { applyEditorSettings } from './editor/assist.js';
import { repl } from '@strudel/core';
import { clearHydra } from '@strudel/hydra';
import { getDefaultValue, getSuperdoughAudioController, multiChannelOrbits } from 'superdough';
import { createLibrary } from './ui/library.js';
import { codeVisible, createCodeLayer } from './export/codeLayer.js';
import { createRecorder } from './ui/recorder.js';
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
import { EXAMPLES } from './examples.js';

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
stage.overlay = createCodeLayer($('#editor')); // video exports include the code when it is showing
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
  beforeEval: () => {
    stage.resetDrawState();
    keepDrawWindow = timelineVisual.test(mirror.code ?? '');
    dropHydraUnlessUsed(mirror.code);
  },
  afterEval: ({ code }) => {
    showError(null);
    evaluatedCode = code;
    syncPlayButton();
    sketch.code = code;
    persist();
  },
});
initEditorSettings(mirror);

// Strudel narrows the drawer to the present moment unless a painter is chained
// on the pattern. visual("punchcard") & co. are visuals, not chained painters,
// so keep the window open whenever the code names one of them.
const timelineVisual = new RegExp(`visual\\s*\\([^)]*\\b(${TIMELINE_VISUALS.join('|')})\\b`);
let keepDrawWindow = false;
const setDrawTime = mirror.drawer.setDrawTime.bind(mirror.drawer);
mirror.drawer.setDrawTime = (drawTime) => setDrawTime(keepDrawWindow ? mirror.drawTime : drawTime);

function dropHydraUnlessUsed(code) {
  if (!/\binitHydra\s*\(/.test(code ?? '')) clearHydra();
}

// media / caption / visual events are for the stage, not the speakers
const output = (hap, ...rest) => {
  if (isMediaOnly(hap.value)) return undefined;
  readyDuckTargets(hap.value);
  return webaudioOutput(hap, ...rest);
};

// A sidechain kick (duckorbit) on the first beat often lands before the pad it
// ducks has made its orbit – its synth is still loading – and superdough logs
// "duck target orbit N does not exist" for every such beat. Make the orbit first.
function readyDuckTargets(value) {
  const target = value?.duckorbit;
  if (target == null) return;
  const mixer = getSuperdoughAudioController();
  for (const orbit of [target].flat()) {
    const channels = multiChannelOrbits && orbit > 0 ? [orbit * 2 - 1, orbit * 2] : getDefaultValue('channels');
    mixer.getOrbit(orbit, [channels].flat().map((c) => c - 1));
  }
}

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
  // the viewer's own play / stop button (shared links)
  const vp = $('#viewer-play');
  setIcon(vp, next ? 'stop' : 'play');
  vp.setAttribute('aria-label', next ? 'Stop' : 'Play');
  syncPlayButton();
}

/** Play ⇄ Stop, and Update beside it – lit when edits made while playing aren't applied yet. */
const needsUpdate = () => playing && evaluatedCode !== null && mirror.code !== evaluatedCode;
function syncPlayButton() {
  const btn = $('#play');
  const state = playing || previewing ? 'stop' : 'play';
  if (btn.dataset.state !== state) {
    btn.dataset.state = state;
    setIcon(btn, state);
    const label = state === 'stop' ? 'Stop' : 'Play';
    btn.querySelector('.cap').textContent = label;
    btn.setAttribute('aria-label', label);
    btn.title = state === 'stop' ? 'Stop (ctrl+.)' : 'Play (ctrl+enter)';
  }
  const update = $('#update');
  const pending = needsUpdate();
  update.disabled = !playing;
  update.classList.toggle('pending', pending);
  update.title = !playing ? 'Update applies your changes while playing – press Play first' : pending ? 'Apply your changes (ctrl+enter)' : 'Nothing to update yet – change the code, then Update (ctrl+enter)';
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
const editorUsable = () => !viewing && document.body.dataset.mode === 'code' && !document.body.classList.contains('pseudo-full');
/** Puts the cursor back in the code – not on touch screens, where it pops the keyboard. */
function focusCode() {
  if (!touchScreen && editorUsable()) requestAnimationFrame(() => mirror.editor.focus());
}
installPageKeys({ mirror, play, stop, editorUsable });

// ---------- View: Code · Stage · Full screen (a pulldown) ----------
// The stage is the default view – the piece fills the window and the code is
// one tap away (View › Code over the stage, Insert, Remix). A view chosen in
// the View menu is remembered; the switches that need the editor are not.
function setMode(mode, { remember = false } = {}) {
  document.body.dataset.mode = mode;
  setIcon($('#view'), mode === 'stage' ? 'stage' : 'code'); // the View button shows the current view
  if (remember) lsSet('soda.view', mode);
}
// iPhone Safari has no Fullscreen API for anything but video – fall back to an
// in-page full screen (toolbar hidden, stage edge to edge, an exit button).
// Some in-app browsers (inside social apps, embedded views) neither grant nor
// refuse – the request just hangs – so fall back after a moment there too.
function fullscreen() {
  const stageEl = $('#stage');
  if (!document.fullscreenEnabled || !stageEl.requestFullscreen) return pseudoFull(true);
  const fallback = setTimeout(() => !document.fullscreenElement && pseudoFull(true), 900);
  return stageEl
    .requestFullscreen()
    .then(() => clearTimeout(fallback))
    .catch(() => (clearTimeout(fallback), pseudoFull(true)));
}
function pseudoFull(on) {
  document.body.classList.toggle('pseudo-full', on);
  $('#exit-full').hidden = !on;
  stage.resize();
}
$('#exit-full').addEventListener('click', () => pseudoFull(false));
setMode(lsGet('soda.view', 'stage') === 'code' ? 'code' : 'stage');
// crop guide: the export frame outlined over the free stage, remembered
function setGuide(on) {
  stage.setGuide(on);
  lsSet('soda.guide', !!on);
}
setGuide(lsGet('soda.guide', false));
createDropdown({
  button: $('#view'),
  menu: $('#view-menu'),
  build: ({ close }) => {
    const mode = document.body.dataset.mode;
    return [
      menuItem('code', 'Code over the stage', () => (setMode('code', { remember: true }), focusCode()), { checked: mode === 'code', close }),
      menuItem('stage', 'Stage only', () => setMode('stage', { remember: true }), { checked: mode === 'stage', close }),
      menuSeparator(),
      menuItem('full', 'Full screen', () => (setMode('stage'), fullscreen()), { close }),
      menuSeparator(),
      menuItem('crop', `Show export frame (${stage.frame})`, () => setGuide(!stage.guide), { checked: stage.guide, close }),
    ];
  },
});

// ---------- toolbar: play + inputs ----------
// a click on Play / Update hands the keys back to the code, so ctrl+. stops
// and cmd+z undoes right after (a keyboard press keeps focus on the button)
$('#play').addEventListener('click', (e) => {
  (playing || previewing ? stop() : play()).catch((err) => toast(err.message, { error: true }));
  if (fromPointer(e)) focusCode();
});
$('#update').addEventListener('click', (e) => {
  play().catch((err) => toast(err.message, { error: true }));
  if (fromPointer(e)) focusCode();
});

// ---------- Record: a take from the microphone becomes a sound ----------
async function toggleTake() {
  try {
    if (isRecording()) {
      const wav = await stopTake();
      syncRecord();
      if (!wav) return toast('Nothing recorded.');
      const name = await saveTake(wav);
      toast(`Saved take "${name}" – use s("${name}")`);
      library.showMySounds();
      openPage('sounds', true);
    } else {
      await ensureAudio();
      await startTake();
      syncRecord();
      toast('Recording a take – tap Record again to stop.');
    }
  } catch (err) {
    syncRecord();
    toast(`Microphone: ${err.message}`, { error: true });
  }
}
/** Record glows and turns into Stop while a take is recording. */
function syncRecord() {
  const btn = $('#record');
  const rec = isRecording();
  btn.classList.toggle('live', rec);
  btn.setAttribute('aria-pressed', String(rec));
  setIcon(btn, rec ? 'stop' : 'mic');
  btn.querySelector('.cap').textContent = rec ? 'Stop' : 'Record';
  btn.setAttribute('aria-label', rec ? 'Stop recording' : 'Record');
  btn.title = rec ? 'Stop and keep the take as a sound' : 'Record a take with the microphone – it becomes a sound';
}
$('#record').addEventListener('click', toggleTake);

// ---------- Input: the microphone and camera as live sources (a pulldown) ----------
async function toggleMic() {
  try {
    if (micOn()) return disableMic();
    await ensureAudio();
    await enableMic();
    toast('Microphone on – micLevel follows it, and video exports record it.');
  } catch (err) {
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
/** The Input button glows while the microphone or the camera is on. */
function syncInput() {
  const btn = $('#input');
  const on = [micOn() && 'mic', cameraOn() && 'cam'].filter(Boolean);
  btn.classList.toggle('live', on.length > 0);
  btn.querySelector('.cap').textContent = on.length === 2 ? 'Mic+cam' : on[0] === 'mic' ? 'Mic on' : on[0] === 'cam' ? 'Cam on' : 'Input';
  btn.setAttribute('aria-label', on.length ? `Input – ${on.join(' and ').replace('cam', 'camera').replace('mic', 'microphone')} on` : 'Input');
}
createDropdown({
  button: $('#input'),
  menu: $('#input-menu'),
  build: ({ close }) => [
    menuItem('mic', 'Microphone', toggleMic, { checked: micOn(), close }),
    menuItem('camera', 'Camera', toggleCamera, { checked: cameraOn(), close }),
    menuItem('flip', 'Switch camera', () => flipCamera().catch((err) => toast(err.message, { error: true })), { disabled: !cameraOn(), close }),
    h('p.menu-empty', {}, 'Live sources for your sketch: micLevel and camMotion follow them, cam() shows the camera, and video exports record the microphone. Nothing leaves this device. To sample your voice, use Record.'),
  ],
});
onCameraChange(syncInput);
onMicChange(syncInput);

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
  /** Opens a Repertoire piece with an open licence: fetched from its source, credit on top. */
  async openPiece(item) {
    toast(`Fetching “${item.title}” from its source…`);
    try {
      const code = await fetchPiece(item.load, { dev: import.meta.env.DEV });
      if (!code.trim()) throw new Error('the source returned no code');
      app.loadExample({ title: item.title, code: creditHeader(item) + code.replace(/^\s+/, ''), aspect: 'free' });
    } catch (e) {
      toast(`Could not open “${item.title}”: ${e.message}`, { error: true });
    }
  },
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
  getCycle: () => mirror.repl.scheduler.now(),
  /** True when the code is over the stage – a video export then includes it. */
  codeShowing: () => codeVisible($('#editor')),
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
// Export in the top bar: the recorder dock (start / stop, gear, player)
createRecorder({ dock: $('#recorder'), button: $('#export'), app, closePanel: () => openPage(page, false) });
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
    about: () => panelBody.replaceChildren(aboutView(renderPage, app)),
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
      if (added.some((a) => a.kind !== 'media')) library.showMySounds();
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

// ---------- first visit: a welcome that gets you playing in one tap ----------
function showWelcome() {
  const el = $('#welcome');
  const done = (then) => {
    lsSet('soda.welcomed', true);
    el.hidden = true;
    then?.();
  };
  const playFirstLight = async () => {
    done();
    const first = EXAMPLES.find((ex) => ex.title === 'First light');
    if (first && mirror.code !== first.code) loadSketch({ title: first.title, code: first.code, aspect: first.aspect });
    setMode('code');
    try {
      await play();
      setTimeout(() => toast('That’s live coding: drag a slider in the code to mix it, or change any number and tap Update (next to Play).', { ms: 9000 }), 2500);
    } catch (e) {
      toast(e.message, { error: true });
    }
  };
  el.replaceChildren(
    h(
      'div.welcome-card',
      {},
      h('p.welcome-brand', {}, 'soda.strudel'),
      h('h1', { id: 'welcome-title' }, 'Make music you can see.'),
      h('p.welcome-lead', {}, 'Write a few lines – get sound, pictures and words that move together. It all runs in your browser.'),
      h('button.primary.huge', { onclick: playFirstLight }, icon('play', 22), ' Play “First light”'),
      h(
        'div.welcome-more',
        {},
        h('button', { onclick: () => done(() => openPage('examples', true)) }, icon('examples', 16), ' Browse examples'),
        h('button', { onclick: () => done(() => openPage('vibe', true)) }, icon('vibe', 16), ' Vibe with Claude'),
        h('button', { onclick: () => done(() => (setMode('code'), mirror.editor.focus())) }, icon('code', 16), ' Just let me code'),
      ),
      h('p.welcome-tip', {}, 'Built on Strudel · sound needs a tap to start · nothing leaves your device'),
    ),
  );
  el.hidden = false;
  el.querySelector('button.primary')?.focus();
}
app.showWelcome = showWelcome;
if (!fromLink && !lsGet('soda.welcomed', false)) showWelcome();
else focusCode();

// ---------- viewer mode for shared links ----------
if (fromLink) {
  if (fromLink.media) import('./soda/patterns.js').then(({ media }) => media(fromLink.media));
  document.body.classList.add('viewer');
  // the sender chose how it opens (Share › Opens as): stage only, code over the stage, full screen
  const linkView = fromLink.view ?? 'stage';
  setMode(linkView === 'code' ? 'code' : 'stage');
  document.body.classList.toggle('viewer-code', linkView === 'code');
  stage.setGuide(!!fromLink.guide); // as the sender chose – for this visit only, not saved
  const card = $('#title-card');
  const inputsWord = [fromLink.camera && 'camera', fromLink.mic && 'microphone'].filter(Boolean).join(' and ');
  const start = async (withInputs) => {
    card.hidden = true;
    // must happen inside the tap, before anything is awaited
    if (linkView === 'full') fullscreen();
    try {
      if (withInputs && fromLink.camera) await enableCamera().catch(() => toast('Camera unavailable – playing without it.'));
      if (withInputs && fromLink.mic) await enableMic().catch(() => toast('Microphone unavailable – playing without it.'));
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
      fromLink.camera || fromLink.mic
        ? h(
            'div.choices',
            {},
            h('p', {}, `This piece uses your ${inputsWord}. Nothing leaves your device.`),
            h('button.primary', { onclick: () => start(true) }, icon(fromLink.camera ? 'camera' : 'mic'), ` Play with ${inputsWord}`),
            h('button', { onclick: () => start(false) }, icon('play'), ' Play without'),
          )
        : h('button.primary.huge', { onclick: () => start(false) }, icon('play', 22), ' Tap to play'),
      h('p.muted', {}, 'Made with soda.strudel · runs entirely in your browser'),
    ),
  );
  card.hidden = false;
  $('#viewer-full').addEventListener('click', fullscreen);

  // like a video player: tap the stage, the small button or space to play / stop,
  // with a brief icon in the middle so the tap is acknowledged
  const flash = $('#viewer-flash');
  const toggle = async () => {
    if (!document.body.classList.contains('viewer') || !card.hidden) return;
    const next = !playing;
    flash.replaceChildren(icon(next ? 'play' : 'stop', 44));
    flash.classList.remove('show');
    void flash.offsetWidth; // restart the animation
    flash.classList.add('show');
    try {
      next ? await play() : await stop();
    } catch (e) {
      toast(e.message, { error: true });
    }
  };
  $('#viewer-play').addEventListener('click', toggle);
  $('#stage').addEventListener('click', toggle);
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest?.('input, textarea, select, button, [contenteditable="true"]')) return;
    if (!document.body.classList.contains('viewer') || !card.hidden) return;
    e.preventDefault();
    toggle();
  });
  $('#remix').addEventListener('click', () => {
    viewing = false;
    persist();
    document.body.classList.remove('viewer', 'viewer-code');
    setMode('code');
    history.replaceState(null, '', location.pathname);
  });
}

// a sketch link opened in an already-open tab only changes the hash – start fresh
window.addEventListener('hashchange', () => {
  if (/[#&]z=/.test(location.hash)) return location.reload();
  openCollectionFromLink();
});

// #collection=<id> or #col=<shared collection>: open it in Examples › Repertoire
async function openCollectionFromLink() {
  const c = await decodeCollection(location.hash).catch(() => (toast('That collection link could not be read.', { error: true }), null));
  if (!c) return;
  showCollection(c);
  openPage('examples', true);
  history.replaceState(null, '', location.pathname + location.search);
}
if (!fromLink) openCollectionFromLink();

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('pseudo-full')) pseudoFull(false);
  else if (e.key === 'Escape' && !panel.hidden) openPage(page, false);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && !viewing) {
    e.preventDefault();
    saveCurrent().catch((err) => toast(err.message, { error: true }));
  }
});

// Tooltips on buttons (Settings › Tooltips). Native titles can't be hidden
// with CSS, so while they're off a title is parked in data-title the moment
// the pointer arrives, and put back when they're on again. Icon-only controls
// without a title show their aria-label.
document.addEventListener('pointerover', (e) => {
  const el = e.target.closest?.('[title], [data-title], button[aria-label], a[aria-label], [role="button"][aria-label]');
  if (!el || el.closest('.cm-editor')) return;
  if (getSettings().tooltips === false) {
    if (el.title) (el.dataset.title = el.title), el.removeAttribute('title');
    return;
  }
  if (!el.title && el.dataset.title) el.title = el.dataset.title;
  else if (!el.title && !el.textContent.trim() && el.getAttribute('aria-label')) el.title = el.getAttribute('aria-label');
});

// installable app + quick reopen (production builds only – it would fight the dev server)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('[soda] service worker', e)));
}

window.soda = { mirror, stage, app };
