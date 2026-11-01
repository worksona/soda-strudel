// The recorder: Export in the top bar opens a dock over the stage.
//   idle      – Video / Audio, ● Start, and a gear for frame, size, length and
//               "start on the next cycle"
//   recording – ■ Stop, a running timer (with progress when the length is
//               set), a level meter and the size so far; the Export button in
//               the top bar turns into the timer and stops with one tap
//   done      – a player with the result: Download, Share, Record again, Discard
// Everything is captured on this device. Results are also kept in
// Settings › Exports. The full Export page (WAV faster than real time, .soda
// file) is one link away.
import { h, toast, formatBytes, lsGet, lsSet } from './dom.js';
import { icon, setIcon } from './icons.js';
import { shapePicker, sizePicker, slug } from './export.js';
import { extensionFor, pickVideoMime, startAudioCapture, startVideoCapture } from '../export/capture.js';
import { download, shareOrDownload } from '../export/record.js';
import { readMaster } from '../media/master.js';
import { micOn } from '../media/micInput.js';
import { addRender, deleteRender } from '../storage/db.js';
import { getSettings, updateSettings } from '../settings.js';

const LENGTHS = [0, 4, 8, 16, 32, 64]; // cycles; 0 = until you stop
const PREFS = 'soda.capture';

const clock = (s) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};
const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

export function createRecorder({ dock, button, app, closePanel }) {
  const canVideo = pickVideoMime() !== null;
  let prefs = { mode: canVideo ? 'video' : 'audio', length: 0, align: true, gear: false, ...lsGet(PREFS, {}) };
  if (!canVideo) prefs.mode = 'audio';
  const save = (patch) => {
    prefs = { ...prefs, ...patch };
    lsSet(PREFS, prefs);
  };

  let state = 'idle'; // idle · arming · recording · saving · done
  let cap = null;
  let timer = 0;
  let result = null; // { blob, url, filename, seconds, id, mode }
  const live = {}; // elements updated while recording

  const cps = () => app.getCps() || 0.5;
  const lengthSeconds = () => (prefs.length ? prefs.length / cps() : 0);
  const frame = () => app.stage.frame;

  function summary() {
    const len = prefs.length ? `${prefs.length} cycles (${clock(lengthSeconds())})` : 'until you stop';
    const start = prefs.align && app.isPlaying() && state === 'idle' ? ' · starts on the next cycle' : '';
    return prefs.mode === 'video' ? `${frame()} · ${getSettings().exportSize}p · ${len}${start}` : `WAV, lossless stereo · ${len}${start}`;
  }

  // ---------- toolbar button ----------
  function syncButton() {
    const recording = state === 'recording' || state === 'arming';
    button.classList.toggle('live', recording);
    button.setAttribute('aria-pressed', String(!dock.hidden));
    setIcon(button, recording ? 'stop' : 'rec');
    button.querySelector('.cap').textContent = state === 'recording' ? clock(cap?.elapsed() ?? 0) : state === 'arming' ? '…' : 'Export';
    button.setAttribute('aria-label', recording ? 'Stop recording' : 'Export – record video or audio');
    button.title = recording ? 'Stop recording' : 'Record the stage as video, or the sound as WAV';
  }

  // ---------- flow ----------
  async function start() {
    if (state === 'recording' || state === 'arming') return;
    revokeResult();
    state = 'arming';
    render();
    try {
      await app.ensureAudio();
      if (!app.isPlaying()) {
        await app.play();
      } else if (prefs.align) {
        // begin on the downbeat so the clip loops cleanly
        const now = app.getCycle();
        const wait = ((Math.floor(now) + 1 - now) / cps()) * 1000;
        if (wait > 30) await new Promise((r) => setTimeout(r, wait));
      }
      cap = prefs.mode === 'video' ? await startVideoCapture(app.stage, { size: getSettings().exportSize }) : await startAudioCapture();
      state = 'recording';
      render();
      tick();
    } catch (e) {
      state = 'idle';
      cap = null;
      render();
      toast(`Recording failed: ${e.message}`, { error: true });
    }
  }

  function tick() {
    clearTimeout(timer);
    if (state !== 'recording') return;
    const t = cap.elapsed();
    const total = lengthSeconds();
    if (live.time) live.time.textContent = total ? `${clock(t)} / ${clock(total)}` : clock(t);
    if (live.progress) live.progress.value = total ? Math.min(1, t / total) : 0;
    if (live.level) live.level.style.setProperty('--level', String(Math.min(1, readMaster().level * 1.4)));
    // MP4 recorders in Chrome hold data until the end – show the size once there is some
    const bytes = cap.bytes();
    if (live.bytes) live.bytes.textContent = bytes ? ` · ${formatBytes(bytes)}` : '';
    syncButton();
    if (total && t >= total) return stop();
    timer = setTimeout(tick, 100);
  }

  async function stop() {
    if (state === 'arming') return;
    if (state !== 'recording') return;
    clearTimeout(timer);
    state = 'saving';
    const seconds = cap.elapsed();
    show();
    render();
    try {
      const blob = await cap.stop();
      const sketch = app.getSketch();
      const filename =
        prefs.mode === 'video' ? `${slug(sketch.title)}-${frame().replace(':', 'x')}-${stamp()}.${extensionFor(blob.type)}` : `${slug(sketch.title)}-${stamp()}.wav`;
      const id = await addRender(blob, { kind: prefs.mode, title: sketch.title, filename, aspect: prefs.mode === 'video' ? frame() : undefined }).catch(() => null);
      result = { blob, url: URL.createObjectURL(blob), filename, seconds, id, mode: prefs.mode };
      state = 'done';
      toast(`Recorded ${clock(seconds)} – play it back in the recorder.`);
    } catch (e) {
      state = 'idle';
      toast(`Recording failed: ${e.message}`, { error: true });
    }
    cap = null;
    render();
  }

  function revokeResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    result = null;
  }

  async function discard() {
    if (result?.id != null) await deleteRender(result.id).catch(() => {});
    revokeResult();
    state = 'idle';
    render();
  }

  // ---------- dock ----------
  function show() {
    if (!dock.hidden) return;
    dock.hidden = false;
    // on phones the side panel would cover the stage you're recording
    if (matchMedia('(max-width: 640px)').matches) closePanel();
    syncButton();
  }
  function hide() {
    dock.hidden = true;
    syncButton();
  }

  /** The toolbar button: opens the recorder, or stops a recording in one tap. */
  function onButton() {
    if (state === 'recording') return stop();
    if (state === 'arming') return;
    dock.hidden ? (show(), render()) : hide();
  }

  const segmented = (label, items, current, onPick) =>
    h(
      'div.segmented',
      { role: 'radiogroup', 'aria-label': label },
      items.map(([v, text, disabled]) => h('button', { type: 'button', role: 'radio', disabled, 'aria-checked': String(current === v), onclick: () => onPick(v) }, text)),
    );

  function gearPanel() {
    const sketch = app.getSketch();
    return h(
      'div.rec-gear',
      {},
      prefs.mode === 'video'
        ? [
            h('div.field', {}, h('span', {}, 'Frame'), shapePicker(sketch.aspect, (a) => (app.setAspect(a), render()), frame())),
            h('div.field', {}, h('span', {}, 'Size'), sizePicker(getSettings().exportSize, (px) => (updateSettings({ exportSize: px }), render()))),
          ]
        : null,
      h(
        'label.field',
        {},
        'Length',
        h(
          'select',
          { onchange: (e) => (save({ length: Number(e.target.value) }), render()) },
          LENGTHS.map((n) => h('option', { value: n, selected: n === prefs.length }, n ? `${n} cycles · ${clock(n / cps())}` : 'Until I stop')),
        ),
      ),
      h('label.toggle', {}, h('input', { type: 'checkbox', checked: prefs.align, onchange: (e) => (save({ align: e.target.checked }), render()) }), 'Start on the next cycle, so the clip loops cleanly'),
      h(
        'p.muted',
        {},
        micOn() ? 'The microphone is on, so it is in the recording. ' : 'Input › Microphone adds your voice to the recording. ',
        h('a', { href: '#', onclick: (e) => (e.preventDefault(), hide(), app.openPage('export')) }, 'More: WAV faster than real time, .soda file'),
      ),
    );
  }

  function render() {
    syncButton();
    if (dock.hidden) return;
    const head = (title) =>
      h(
        'div.rec-head',
        {},
        h('strong', {}, title),
        state === 'idle'
          ? h('button.icon', { type: 'button', title: 'Recording settings', 'aria-label': 'Recording settings', 'aria-expanded': String(prefs.gear), onclick: () => (save({ gear: !prefs.gear }), render()) }, icon('settings'))
          : null,
        h('button.icon', { type: 'button', title: state === 'recording' ? 'Hide – keeps recording' : 'Close', 'aria-label': 'Close the recorder', onclick: hide }, icon('close')),
      );

    for (const k of Object.keys(live)) delete live[k];
    let body;
    if (state === 'idle' || state === 'arming') {
      body = [
        head('Record'),
        segmented('What to record', [['video', 'Video + sound', !canVideo], ['audio', 'Sound only (WAV)']], prefs.mode, (m) => (save({ mode: m }), render())),
        h(
          'button.rec-start',
          { type: 'button', disabled: state === 'arming', onclick: start },
          h('span.rec-dot', { 'aria-hidden': 'true' }),
          state === 'arming' ? (app.isPlaying() && prefs.align ? ' Starting on the next cycle…' : ' Starting…') : ' Start recording',
        ),
        h('p.rec-summary', {}, summary()),
        prefs.gear ? gearPanel() : null,
      ];
    } else if (state === 'recording') {
      live.time = h('span.rec-time', {}, '0:00');
      live.progress = lengthSeconds() ? h('progress', { max: 1, value: 0 }) : null;
      live.level = h('span.rec-level', { 'aria-hidden': 'true' });
      live.bytes = h('span', {}, '');
      body = [
        head('Recording'),
        h('div.rec-live', {}, h('span.rec-dot.on', { 'aria-hidden': 'true' }), live.time, live.level),
        live.progress,
        h('p.rec-summary', {}, summary(), live.bytes),
        h('button.rec-stop', { type: 'button', onclick: stop }, icon('stop', 18), ' Stop'),
        h('p.muted', {}, 'Keep this tab in front – browsers slow down hidden tabs.'),
      ];
    } else if (state === 'saving') {
      body = [head('Finishing…'), h('p.rec-summary', {}, 'Putting the file together on this device.')];
    } else {
      const player =
        result.mode === 'video'
          ? h('video.rec-player', { src: result.url, controls: true, playsInline: true, preload: 'metadata' })
          : h('audio.rec-player', { src: result.url, controls: true, preload: 'metadata' });
      const canShare = navigator.canShare?.({ files: [new File([result.blob], result.filename, { type: result.blob.type })] });
      body = [
        head('Your recording'),
        player,
        h('p.rec-summary', {}, `${result.filename} · ${clock(result.seconds)} · ${formatBytes(result.blob.size)} · kept in Settings › Exports`),
        h(
          'div.rec-actions',
          {},
          h('button.primary', { type: 'button', onclick: () => download(result.blob, result.filename) }, icon('download', 16), ' Download'),
          canShare ? h('button', { type: 'button', onclick: () => shareOrDownload(result.blob, result.filename, app.getSketch().title) }, icon('share', 16), ' Share') : null,
          h('button', { type: 'button', onclick: start }, h('span.rec-dot', { 'aria-hidden': 'true' }), ' Record again'),
          h('button', { type: 'button', onclick: discard }, icon('trash', 16), ' Discard'),
        ),
      ];
    }
    dock.replaceChildren(...body.flat().filter(Boolean));
  }

  button.addEventListener('click', onButton);
  syncButton();
  return { open: () => (show(), render()), stop, isRecording: () => state === 'recording' };
}
