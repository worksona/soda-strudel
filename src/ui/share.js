// Share sheet: Link · Video · File (+ audio under More). One place for everything
// that leaves the browser.
import { h, toast } from './dom.js';
import { LONG_LINK_WARNING, sketchUrl } from '../share/sketch.js';
import { buildSodaFile } from '../share/sodafile.js';
import { recordStage, extensionFor, pickVideoMime, shareOrDownload, download } from '../export/record.js';
import { exportWav } from '../export/audio.js';
import { addRender, listMediaItems, listSounds } from '../storage/db.js';

const slug = (s) => (s || 'soda-sketch').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'soda-sketch';

export function createShare({ dialog, app }) {
  let busy = false;

  async function localNamesUsed(code) {
    const names = [...(await listSounds()), ...(await listMediaItems())].map((r) => r.name);
    return names.filter((n) => new RegExp(`["'\\s]${n}["'\\s:]`).test(code));
  }

  async function copyLink() {
    const sketch = app.getSketch();
    const url = await sketchUrl(sketch, location.origin);
    await navigator.clipboard.writeText(url).catch(() => prompt('Copy this link', url));
    const local = await localNamesUsed(sketch.code);
    history.replaceState(null, '', url);
    toast(
      local.length
        ? `Link copied. It uses your own ${local.join(', ')} – others will hear gaps. Use “Save .soda file” to include them.`
        : url.length > LONG_LINK_WARNING
          ? `Link copied (${url.length} characters – some apps may cut long links).`
          : 'Link copied.',
      { ms: 6000 },
    );
  }

  async function recordVideo(bars) {
    if (busy) return;
    busy = true;
    const progress = h('progress', { max: 1, value: 0 });
    const status = dialog.querySelector('.status');
    status.replaceChildren('Recording… keep this tab in front. ', progress);
    try {
      if (!app.isPlaying()) await app.play();
      const seconds = bars / app.getCps();
      const blob = await recordStage(app.stage, { seconds, onProgress: (p) => (progress.value = p) });
      const sketch = app.getSketch();
      const filename = `${slug(sketch.title)}-${sketch.aspect ?? 'free'}.${extensionFor(blob.type)}`;
      addRender(blob, { kind: 'video', title: sketch.title, aspect: sketch.aspect }).catch(() => {});
      const how = await shareOrDownload(blob, filename, sketch.title);
      status.textContent = how === 'shared' ? 'Shared.' : how === 'downloaded' ? `Saved ${filename}.` : '';
    } catch (e) {
      status.textContent = '';
      toast(`Video export failed: ${e.message}`, { error: true });
    } finally {
      busy = false;
    }
  }

  async function exportAudio(bars) {
    if (busy) return;
    busy = true;
    const status = dialog.querySelector('.status');
    status.textContent = 'Rendering audio…';
    try {
      await app.stop();
      await exportWav({ pattern: app.getPattern(), cps: app.getCps(), cycles: bars, name: slug(app.getSketch().title) });
      status.textContent = 'WAV saved.';
    } catch (e) {
      status.textContent = '';
      toast(`Audio export failed: ${e.message}`, { error: true });
    } finally {
      busy = false;
    }
  }

  async function saveFile() {
    const sketch = app.getSketch();
    const { blob, manifest } = await buildSodaFile(sketch);
    download(blob, `${slug(sketch.title)}.soda`);
    toast(`Saved .soda file with ${manifest.sounds.length} sound(s) and ${manifest.media.length} media file(s).`);
  }

  function render() {
    const sketch = app.getSketch();
    const bars = h('select', { 'aria-label': 'Length' }, [4, 8, 16, 32].map((n) => h('option', { value: n, selected: n === 8 }, `${n} cycles`)));
    const shape = h(
      'div.segmented',
      { role: 'radiogroup', 'aria-label': 'Shape' },
      [
        ['free', 'Free'],
        ['9:16', '9:16'],
        ['1:1', '1:1'],
        ['16:9', '16:9'],
      ].map(([value, label]) =>
        h(
          'button',
          {
            role: 'radio',
            'aria-checked': String((sketch.aspect ?? 'free') === value),
            onclick: () => {
              app.setAspect(value);
              render();
            },
          },
          label,
        ),
      ),
    );
    dialog.replaceChildren(
      h(
        'form',
        { method: 'dialog' },
        h('header', {}, h('h2', {}, 'Share'), h('button.icon', { value: 'close', 'aria-label': 'Close' }, '✕')),
        h('label.field', {}, 'Title', h('input', { value: sketch.title ?? '', placeholder: 'Untitled', oninput: (e) => app.setTitle(e.target.value) })),
        h('div.field', {}, h('span', {}, 'Shape'), shape),
        h(
          'section.actions',
          {},
          h('button.big', { type: 'button', onclick: copyLink }, h('strong', {}, '🔗 Link'), h('small', {}, 'Plays in any browser. Nothing is uploaded.')),
          h(
            'button.big',
            { type: 'button', disabled: pickVideoMime() === null, onclick: () => recordVideo(Number(bars.value)) },
            h('strong', {}, '🎬 Video'),
            h('small', {}, 'Records the stage with sound, on this device.'),
          ),
          h('button.big', { type: 'button', onclick: saveFile }, h('strong', {}, '📦 File'), h('small', {}, '.soda file with your own sounds and media.')),
        ),
        h(
          'details.more',
          {},
          h('summary', {}, 'More'),
          h('div.field', {}, h('span', {}, 'Length'), bars),
          h('button', { type: 'button', onclick: () => exportAudio(Number(bars.value)) }, '🎧 Export audio (WAV, faster than real time)'),
          h('button', { type: 'button', onclick: () => app.openFile() }, '📂 Open a .soda file'),
        ),
        h('p.status', { 'aria-live': 'polite' }),
      ),
    );
  }

  return {
    open() {
      render();
      dialog.showModal();
    },
  };
}
