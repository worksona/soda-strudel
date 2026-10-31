// Export page: Video · Audio · .soda file, with shape, size and length.
// The stage always fills the screen; the shape here is the export frame (and
// the crop guide in View). A sketch without one follows the device.
// Everything renders on this device; results are kept under Settings › Exports.
import { h, toast } from './dom.js';
import { icon } from './icons.js';
import { buildSodaFile } from '../share/sodafile.js';
import { recordStage, extensionFor, pickVideoMime, shareOrDownload, download } from '../export/record.js';
import { renderWav } from '../export/audio.js';
import { addRender } from '../storage/db.js';
import { EXPORT_SIZES, getSettings, updateSettings } from '../settings.js';

export const slug = (s) => (s || 'soda-sketch').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'soda-sketch';

/** Export frame picker. `suggested` is the device's shape, shown as the choice when the sketch has none. */
export function shapePicker(current, onPick, suggested) {
  const value = current ?? 'free';
  return h(
    'div.segmented',
    { role: 'radiogroup', 'aria-label': 'Export shape' },
    [
      ['free', suggested ? `Auto (${suggested})` : 'Free'],
      ['9:16', '9:16'],
      ['1:1', '1:1'],
      ['16:9', '16:9'],
    ].map(([v, label]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(value === v), onclick: () => onPick(v) }, label)),
  );
}

export function sizePicker(current, onPick) {
  return h(
    'div.segmented',
    { role: 'radiogroup', 'aria-label': 'Size' },
    EXPORT_SIZES.map((px) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(current === px), onclick: () => onPick(px) }, `${px}p`)),
  );
}

export function createExport({ root, app }) {
  let busy = false;
  let cycles = 8;

  // one status line that survives re-renders and leaving the page mid-export
  const statusEl = h('p.status', { 'aria-live': 'polite' });
  const status = () => statusEl;

  async function exportVideo() {
    if (busy) return;
    busy = true;
    const progress = h('progress', { max: 1, value: 0 });
    status().replaceChildren('Recording – keep this tab in front. ', progress);
    try {
      if (!app.isPlaying()) await app.play();
      const sketch = app.getSketch();
      const blob = await recordStage(app.stage, { seconds: cycles / app.getCps(), size: getSettings().exportSize, onProgress: (p) => (progress.value = p) });
      const frame = app.stage.frame;
      const filename = `${slug(sketch.title)}-${frame.replace(':', 'x')}.${extensionFor(blob.type)}`;
      await addRender(blob, { kind: 'video', title: sketch.title, filename, aspect: frame }).catch(() => {});
      const how = await shareOrDownload(blob, filename, sketch.title);
      status().textContent = how === 'shared' ? 'Shared. Also kept in Settings › Exports.' : `Saved ${filename}. Also kept in Settings › Exports.`;
    } catch (e) {
      status().textContent = '';
      toast(`Video export failed: ${e.message}`, { error: true });
    } finally {
      busy = false;
    }
  }

  async function exportAudio() {
    if (busy) return;
    busy = true;
    status().textContent = 'Rendering audio…';
    try {
      await app.stop();
      const sketch = app.getSketch();
      const pattern = await app.ensurePattern();
      const blob = await renderWav({ pattern, cps: app.getCps(), cycles });
      const filename = `${slug(sketch.title)}.wav`;
      await addRender(blob, { kind: 'audio', title: sketch.title, filename }).catch(() => {});
      download(blob, filename);
      status().textContent = `Saved ${filename}. Also kept in Settings › Exports.`;
    } catch (e) {
      status().textContent = '';
      toast(`Audio export failed: ${e.message}`, { error: true });
    } finally {
      busy = false;
    }
  }

  async function exportFile() {
    const sketch = app.getSketch();
    const { blob, manifest } = await buildSodaFile(sketch);
    download(blob, `${slug(sketch.title)}.soda`);
    status().textContent = `Saved .soda file with ${manifest.sounds.length} of your sounds and ${manifest.media.length} media file(s).`;
  }

  function render() {
    const sketch = app.getSketch();
    const length = h(
      'select',
      { 'aria-label': 'Length', onchange: (e) => (cycles = Number(e.target.value)) },
      [4, 8, 16, 32, 64].map((n) => h('option', { value: n, selected: n === cycles }, `${n} cycles · ${(n / app.getCps()).toFixed(1)} s`)),
    );
    root.replaceChildren(
      h('div.field', {}, h('span', {}, 'Shape'), shapePicker(sketch.aspect, (a) => (app.setAspect(a), render()), app.stage.frame)),
      h('p.muted', {}, 'The stage fills your screen; this is the frame the video is cut to. View › Show export frame previews the crop.'),
      h('div.field', {}, h('span', {}, 'Size (short side)'), sizePicker(getSettings().exportSize, (px) => (updateSettings({ exportSize: px }), render()))),
      h('label.field', {}, 'Length', length),
      h(
        'section.actions',
        {},
        h(
          'button.big',
          { type: 'button', disabled: pickVideoMime() === null, onclick: exportVideo },
          h('strong', {}, icon('film'), ' Video'),
          h('small', {}, 'The stage with sound, recorded in real time on this device.'),
        ),
        h('button.big', { type: 'button', onclick: exportAudio }, h('strong', {}, icon('audio'), ' Audio (WAV)'), h('small', {}, 'Rendered faster than real time.')),
        h('button.big', { type: 'button', onclick: exportFile }, h('strong', {}, icon('package'), ' .soda file'), h('small', {}, 'The sketch plus your own sounds and media, to send or back up.')),
      ),
      statusEl,
      h('p.muted', {}, 'Past exports are kept in Settings › Exports.'),
    );
  }

  return { render };
}
