// Share page: a link that plays in any browser. Files and video live on the Export page.
import { h, toast } from './dom.js';
import { icon } from './icons.js';
import { LONG_LINK_WARNING, sketchUrl } from '../share/sketch.js';
import { listMediaItems, listSounds } from '../storage/db.js';

export function createShare({ root, app }) {
  const statusEl = h('p.status', { 'aria-live': 'polite' });
  async function localNamesUsed(code) {
    const names = [...(await listSounds()), ...(await listMediaItems())].map((r) => r.name);
    return names.filter((n) => new RegExp(`["'\\s]${n}["'\\s:]`).test(code));
  }

  async function copyLink() {
    const sketch = app.getSketch();
    const url = await sketchUrl(sketch, location.origin);
    await navigator.clipboard.writeText(url).catch(() => prompt('Copy this link', url));
    const local = await localNamesUsed(sketch.code);
    statusEl.textContent = local.length
      ? `Copied. It uses your own ${local.join(', ')} – others will hear gaps. The Export page’s .soda file includes them.`
      : url.length > LONG_LINK_WARNING
        ? `Copied (${url.length} characters – some apps cut long links).`
        : 'Copied.';
    toast('Link copied.');
  }

  function render() {
    const sketch = app.getSketch();
    root.replaceChildren(
      h('label.field', {}, 'Title', h('input', { value: sketch.title ?? '', placeholder: 'Untitled', oninput: (e) => app.setTitle(e.target.value) })),
      h('p.muted', {}, sketch.by ? `Signed “${sketch.by}”.` : 'Add your name in Settings to sign your links.'),
      h(
        'section.actions',
        {},
        h('button.big', { type: 'button', onclick: copyLink }, h('strong', {}, icon('link'), ' Copy link'), h('small', {}, 'Plays in any browser. Nothing is uploaded – the sketch is inside the link.')),
      ),
      statusEl,
      h('p.muted', {}, 'Want a video or a file instead? Use the Export page.'),
    );
  }

  return { render };
}
