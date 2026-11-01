// Optional short links through an a47l.com shortener (shortlink-headless:
// POST /api/links with a bearer token). The address and token are set in
// Settings › Short links and stay in this browser; the sketch link itself is
// still the whole sketch – the shortener only stores that long URL.
import { lsGet, lsSet } from '../ui/dom.js';

const KEY = 'soda.shortlink';
export const DEFAULT_SHORTENER = 'https://a47l.com';

/** { url, token, enabled } – enabled is the Share checkbox, remembered. */
export const getShortener = () => ({ url: DEFAULT_SHORTENER, token: '', enabled: false, ...lsGet(KEY, {}) });
export const setShortener = (patch) => lsSet(KEY, { ...getShortener(), ...patch });
export const shortenerReady = (s = getShortener()) => !!(s.url && s.token);

const api = (base, path) => `${base.replace(/\/+$/, '')}/api${path}`;

async function call(s, path, init = {}) {
  let res;
  try {
    res = await fetch(api(s.url, path), {
      ...init,
      headers: { authorization: `Bearer ${s.token}`, 'content-type': 'application/json', ...init.headers },
    });
  } catch {
    throw new Error(`can't reach ${s.url}`);
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error('the token was refused');
  if (!res.ok) throw new Error(body.error || `${res.status} ${res.statusText}`);
  return body;
}

/** Returns the short URL for a long one. */
export async function shortenUrl(longUrl, { notes, settings = getShortener() } = {}) {
  if (!shortenerReady(settings)) throw new Error('add the shortener token in Settings');
  const link = await call(settings, '/links', { method: 'POST', body: JSON.stringify({ url: longUrl, notes }) });
  if (!link.slug || !link.domain) throw new Error('unexpected reply from the shortener');
  return `https://${link.domain}/${link.slug}`;
}

/** Checks the address and token: resolves to 'admin' or 'peer'. */
export async function checkShortener(settings = getShortener()) {
  const who = await call(settings, '/whoami');
  return who.role ?? 'ok';
}
