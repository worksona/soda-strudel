// Optional short links (Share › “Short link”). The browser asks this site's
// own function (netlify/functions/shorten.mjs), which holds the a47l.com
// token as a Netlify secret – no token is ever in the page. The sketch link is
// still the whole sketch; the shortener only stores that long URL.
import { lsGet, lsSet } from '../ui/dom.js';

const KEY = 'soda.shortlink';
const ENDPOINT = '/api/shorten';

/** The Share checkbox, remembered per browser. */
export const shortLinksWanted = () => !!lsGet(KEY, {}).enabled;
export const setShortLinksWanted = (enabled) => lsSet(KEY, { enabled: !!enabled });

let available;
/** Whether this site has short links set up (cached; false on the dev server). */
export function shortLinksAvailable() {
  available ??= fetch(ENDPOINT)
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((b) => !!b.enabled)
    .catch(() => false);
  return available;
}

/** Returns the short URL for a sketch link. */
export async function shortenUrl(longUrl, { title } = {}) {
  let res;
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: longUrl, title }) });
  } catch {
    throw new Error('offline');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.short) throw new Error(body.error || `${res.status}`);
  return body.short;
}
