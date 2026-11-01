// Share page: a link that plays in any browser. Files and video live on the Export page.
import { h, toast, lsGet, lsSet } from './dom.js';
import { icon } from './icons.js';
import { LONG_LINK_WARNING, sketchUrl } from '../share/sketch.js';
import { listMediaItems, listSounds } from '../storage/db.js';
import { setShortLinksWanted, shortLinksAvailable, shortLinksWanted, shortenUrl } from '../share/shorten.js';

export function createShare({ root, app }) {
  const statusEl = h('p.status', { 'aria-live': 'polite' });
  // how the link opens for the person you send it to – the View menu's choices
  let opens = { view: 'stage', guide: false, ...lsGet('soda.shareView', {}) };
  const setOpens = (patch) => {
    opens = { ...opens, ...patch };
    lsSet('soda.shareView', opens);
    render();
  };
  async function localNamesUsed(code) {
    const names = [...(await listSounds()), ...(await listMediaItems())].map((r) => r.name);
    return names.filter((n) => new RegExp(`["'\\s]${n}["'\\s:]`).test(code));
  }

  async function copyLink() {
    const sketch = app.getSketch();
    const long = await sketchUrl({ ...sketch, view: opens.view, guide: opens.guide || undefined }, location.origin);
    let url = long;
    let shortNote = '';
    if (shortLinksWanted() && (await shortLinksAvailable())) {
      statusEl.textContent = 'Making a short link…';
      try {
        url = await shortenUrl(long, { title: sketch.title || 'Untitled' });
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

  function opensAs() {
    const views = [
      ['stage', 'Stage only', 'The piece fills the screen; tap to play or stop.'],
      ['code', 'Code over the stage', 'They see the code playing, like strudel.cc, and can edit it.'],
      ['full', 'Full screen', 'Play goes straight to full screen.'],
    ];
    return h(
      'div.field',
      {},
      h('span', {}, 'Opens as'),
      h(
        'div.segmented',
        { role: 'radiogroup', 'aria-label': 'Opens as' },
        views.map(([v, label]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(opens.view === v), onclick: () => setOpens({ view: v }) }, label)),
      ),
      h('p.muted', {}, views.find(([v]) => v === opens.view)?.[2]),
      h('label.toggle', {}, h('input', { type: 'checkbox', checked: opens.guide, onchange: (e) => setOpens({ guide: e.target.checked }) }), `Show the export frame (${app.stage.frame})`),
    );
  }

  /** “Short link” checkbox – enabled once the site says short links are set up. */
  function shortOption() {
    const box = h('input', { type: 'checkbox', checked: shortLinksWanted(), disabled: true, onchange: (e) => setShortLinksWanted(e.target.checked) });
    const note = h('small.muted', {}, ' checking…');
    shortLinksAvailable().then((ok) => {
      box.disabled = !ok;
      note.textContent = ok ? ' a47l.com – short, easy to paste anywhere' : ' not set up on this site';
      if (!ok) box.checked = false;
    });
    return h('label.toggle', {}, box, 'Short link', note);
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
      opensAs(),
      shortOption(),
      statusEl,
      h('p.muted', {}, 'Want a video or a file instead? Use the Export page.'),
    );
  }

  return { render };
}
