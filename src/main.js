import './styles.css';
import { StrudelMirror } from '@strudel/codemirror';
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, initAudio, webaudioOutput } from '@strudel/webaudio';
import { prebake } from './strudel/setup.js';
import { Stage } from './stage/stage.js';
import { isMediaOnly } from './soda/catalog.js';
import { decodeSketch } from './share/sketch.js';
import { readSodaFile } from './share/sodafile.js';
import { importFiles, registerLibrary, libraryChanged } from './media/library.js';
import { cameraOn, disableCamera, enableCamera, flipCamera, onCameraChange } from './media/camera.js';
import { isRecording, startTake, stopTake } from './media/mic.js';
import { saveTake } from './media/library.js';
import { createLibrary } from './ui/library.js';
import { createShare } from './ui/share.js';
import { copyForClaude } from './ui/claude.js';
import { $, h, lsGet, lsSet, toast } from './ui/dom.js';
import { DEFAULT_CODE } from './default-code.js';

// ---------- state ----------
const fromLink = await decodeSketch(location.hash).catch((e) => {
  toast(`Could not open that link: ${e.message}`, { error: true });
  return null;
});
const saved = lsGet('soda.sketch', null);
const sketch = { title: '', aspect: 'free', ...(fromLink ?? saved ?? { code: DEFAULT_CODE, title: 'First light' }) };
let lastError = null;
let playing = false;
// viewing someone's link must not overwrite your own autosaved sketch – until you Remix
let viewing = !!fromLink;

// ---------- layout: everything sits below the (possibly wrapped) toolbar ----------
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
  defaultOutput: (hap, ...rest) => (isMediaOnly(hap.value) ? undefined : webaudioOutput(hap, ...rest)),
  onDraw: (haps, time, painters) => stage.update(haps, time, painters, mirror.drawTime),
  onToggle: (started) => setPlaying(started),
  onEvalError: (err) => showError(err),
  afterEval: ({ code }) => {
    showError(null);
    sketch.code = code;
    persist();
  },
});

let audioReady;
async function ensureAudio() {
  audioReady ??= initAudio();
  await getAudioContext().resume();
  await audioReady;
}

function setPlaying(next) {
  playing = next;
  stage.setPlaying(next);
  document.body.classList.toggle('playing', next);
  $('#play').textContent = next ? '■ Stop' : '▶ Play';
  $('#play').setAttribute('aria-pressed', String(next));
}

function showError(err) {
  lastError = err ? err.message ?? String(err) : null;
  const bar = $('#error');
  bar.textContent = lastError ? `⚠ ${lastError}` : '';
  bar.hidden = !lastError;
}

let persistTimer;
function persist() {
  if (viewing) return;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => lsSet('soda.sketch', { title: sketch.title, aspect: sketch.aspect, code: mirror.code }), 300);
}
mirror.editor.dom.addEventListener('keyup', persist);

async function play() {
  await ensureAudio();
  await mirror.evaluate();
}
async function stop() {
  await mirror.stop();
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
$('#modes').addEventListener('click', async (e) => {
  const mode = e.target.closest('[data-mode]')?.dataset.mode;
  if (!mode) return;
  if (mode === 'full') {
    setMode('stage');
    await $('#stage').requestFullscreen?.().catch(() => toast('Full screen is not available here.'));
  } else setMode(mode);
});
setMode('code');

// ---------- toolbar ----------
$('#play').addEventListener('click', () => (playing ? stop() : play()).catch((e) => toast(e.message, { error: true })));

$('#mic').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  try {
    if (isRecording()) {
      btn.classList.remove('live');
      const wav = await stopTake();
      if (!wav) return toast('Nothing recorded.');
      const name = await saveTake(wav);
      toast(`Saved take "${name}" – use s("${name}")`);
      library.show('takes');
      openDrawer(true);
    } else {
      await ensureAudio();
      await startTake();
      btn.classList.add('live');
      toast('Recording a take… tap 🎙 again to stop.');
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

const drawer = $('#drawer');
const library = createLibrary({ root: $('#drawer .drawer-body'), insert });
function openDrawer(open = drawer.hidden) {
  drawer.hidden = !open;
  $('#library').setAttribute('aria-expanded', String(open));
  if (open) library.render();
}
$('#library').addEventListener('click', () => openDrawer());
$('#drawer-close').addEventListener('click', () => openDrawer(false));

const app = {
  stage,
  getSketch: () => ({ ...sketch, code: mirror.code }),
  setTitle: (t) => ((sketch.title = t), persist()),
  setAspect: (a) => {
    sketch.aspect = a;
    stage.setAspect(a);
    persist();
  },
  getPattern: () => mirror.repl.state.pattern,
  getCps: () => mirror.repl.scheduler.cps,
  isPlaying: () => playing,
  play,
  stop,
  openFile: () => $('#file-open').click(),
};
const share = createShare({ dialog: $('#share-dialog'), app });
$('#share').addEventListener('click', () => share.open());

$('#claude').addEventListener('click', async () => {
  try {
    await copyForClaude(app.getSketch(), lastError);
    toast('Copied for Claude – paste it into a chat. Install the strudel-vibe skill for best results.', { ms: 5000 });
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
      toast(`Opened ${s.title || f.name}`);
    } catch (e) {
      toast(`${f.name}: ${e.message}`, { error: true });
    }
  }
  if (rest.length) {
    const added = await importFiles(rest);
    if (added.length) {
      toast(`Added ${added.map((a) => `${a.kind} "${a.name}"`).join(', ')}`);
      openDrawer(true);
      library.show(added[0].kind === 'media' ? 'media' : 'sounds');
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

function loadSketch(s) {
  Object.assign(sketch, { title: '', aspect: 'free', media: undefined }, s);
  mirror.setCode(s.code);
  stage.setAspect(sketch.aspect);
  if (s.media) import('./soda/patterns.js').then(({ media }) => media(s.media));
  persist();
}

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
            h('button.primary', { onclick: () => start(true) }, '▶ Play with camera'),
            h('button', { onclick: () => start(false) }, 'Play without'),
          )
        : h('button.primary.huge', { onclick: () => start(false) }, '▶ Tap to play'),
      h('p.muted', {}, 'Made with soda-strudel · runs entirely in your browser'),
    ),
  );
  card.hidden = false;
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

// keyboard: Escape closes the drawer
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !drawer.hidden) openDrawer(false);
});

window.soda = { mirror, stage, app };
