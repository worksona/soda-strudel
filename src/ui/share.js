// Share page: a link that plays in any browser. Files and video live on the Export page.
import { h, toast } from './dom.js';
import { icon } from './icons.js';
import { LONG_LINK_WARNING, sketchUrl } from '../share/sketch.js';
import { listMediaItems, listSounds } from '../storage/db.js';
import { getShortener, setShortener, shortenerReady, shortenUrl } from '../share/shorten.js';

export function createShare({ root, app }) {
  const statusEl = h('p.status', { 'aria-live': 'polite' });
  async function localNamesUsed(code) {
    const names = [...(await listSounds()), ...(await listMediaItems())].map((r) => r.name);
    return names.filter((n) => new RegExp(`["'\\s]${n}["'\\s:]`).test(code));
  }

  async function copyLink() {
    const sketch = app.getSketch();
    const long = await sketchUrl(sketch, location.origin);
    let url = long;
    let shortNote = '';
    const shortener = getShortener();
    if (shortener.enabled && shortenerReady(shortener)) {
      statusEl.textContent = 'Making a short link…';
      try {
        url = await shortenUrl(long, { notes: `soda.strudel: ${sketch.title || 'Untitled'}` });
        shortNote = ` Short link ${url}.`;
      } catch (err) {
        shortNote = ` Short link failed (${err.message}) – copied the full link instead.`;
      }
    }
    await navigator.clipboard.writeText(url).catch(() => prompt('Copy this link', url));
    const local = await localNamesUsed(sketch.code);
    statusEl.textContent =
      (local.length
        ? `Copied. It uses your own ${local.join(', ')} – others will hear gaps. The Export page’s .soda file includes them.`
        : url === long && url.length > LONG_LINK_WARNING
          ? `Copied (${url.length} characters – some apps cut long links).`
          : 'Copied.') + shortNote;
    toast(url === long ? 'Link copied.' : 'Short link copied.');
  }

  function shortOption() {
    const s = getShortener();
    const ready = shortenerReady(s);
    const host = (() => {
      try {
        return new URL(s.url).host;
      } catch {
        return s.url;
      }
    })();
    return h(
      'div.field',
      {},
      h(
        'label.toggle',
        {},
        h('input', { type: 'checkbox', checked: ready && s.enabled, disabled: !ready, onchange: (e) => setShortener({ enabled: e.target.checked }) }),
        `Short link with ${host}`,
      ),
      ready
        ? null
        : h('p.muted', {}, 'Add the shortener’s token in ', h('a', { href: '#', onclick: (e) => (e.preventDefault(), app.openPage('settings', true)) }, 'Settings › Short links'), ' to turn this on.'),
    );
  }

  function render() {
    const sketch = app.getSketch();
    root.replaceChildren(
      h('label.field', {}, 'Title', h('input', { value: sketch.title ?? '', placeholder: 'Untitled', oninput: (e) => app.setTitle(e.target.value) })),
      h('p.muted', {}, sketch.by ? `Signed “${sketch.by}”.` : 'Add your name in Settings to sign your links.'),
      h(
        'section.actions',
        {},
        h('button.big', { type: 'button', onclick: copyLink }, h('strong', {}, icon('link'), ' Copy link'), h('small', {}, 'Plays in any browser. The sketch is inside the link – a short link only stores that link on the shortener.')),
      ),
      shortOption(),
      statusEl,
      h('p.muted', {}, 'Want a video or a file instead? Use the Export page.'),
    );
  }

  return { render };
}
