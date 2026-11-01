// Watch here: a YouTube tutorial or performance plays in a panel docked over
// the stage, so you can code along without leaving soda.strudel (decision
// 2026-11-01-open-public-songs-in-soda). Privacy-enhanced embed
// (youtube-nocookie.com); the panel credits the video and links to YouTube.
import { h } from './dom.js';
import { icon } from './icons.js';

/** { id, start } from a YouTube watch / youtu.be / shorts / live / embed URL, or null. */
export function youTubeId(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|live|embed)\/([\w-]{6,})/)?.[1] ?? null;
  }
  if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
  const t = u.searchParams.get('t') ?? u.searchParams.get('start');
  const start = t ? (/^\d+$/.test(t) ? Number(t) : (Number(t.match(/(\d+)h/)?.[1] ?? 0) * 3600 + Number(t.match(/(\d+)m/)?.[1] ?? 0) * 60 + Number(t.match(/(\d+)s/)?.[1] ?? 0))) : 0;
  return { id, start };
}

export function createWatch(host) {
  const dock = h('div', { id: 'watch', hidden: true, role: 'dialog', 'aria-label': 'Video' });
  host.append(dock);
  let large = false;

  function close() {
    dock.hidden = true;
    dock.replaceChildren(); // stops the video
  }

  /** Plays item.url (a YouTube link) in the panel. Returns false when it isn't one. */
  function watch(item) {
    const yt = youTubeId(item.url);
    if (!yt) return false;
    const src = `https://www.youtube-nocookie.com/embed/${yt.id}?autoplay=1&rel=0&modestbranding=1${yt.start ? `&start=${yt.start}` : ''}`;
    const size = h('button.icon', { type: 'button', title: 'Bigger / smaller', 'aria-label': 'Change the video size', onclick: () => ((large = !large), dock.classList.toggle('large', large)) }, icon('full', 15));
    dock.replaceChildren(
      h(
        'div.watch-head',
        {},
        h('div.watch-title', {}, h('strong', {}, item.title), item.by ? h('small', {}, `by ${item.by}`) : null),
        size,
        h('a.icon', { href: item.url, target: '_blank', rel: 'noopener', title: 'Open on YouTube', 'aria-label': 'Open on YouTube' }, icon('external', 15)),
        h('button.icon', { type: 'button', title: 'Close', 'aria-label': 'Close the video', onclick: close }, icon('close', 15)),
      ),
      h('div.watch-frame', {}, h('iframe', { src, title: item.title, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin', loading: 'eager' })),
    );
    dock.classList.toggle('large', large);
    dock.hidden = false;
    return true;
  }

  addEventListener('keydown', (e) => e.key === 'Escape' && !dock.hidden && document.activeElement?.closest?.('#watch') && close());
  return { watch, close };
}
