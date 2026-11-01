// POST /api/shorten { url, title } → { short }
//
// The one server-side piece of soda.strudel: makes a short link on the
// a47l.com shortener (shortlink-headless) without the browser ever seeing the
// token. The token is a Netlify secret:
//   netlify env:set SHORTLINK_TOKEN <peer token> --secret
//   netlify env:set SHORTLINK_API_URL https://a47l.com     (optional, the default)
// Only links to this site's own sketches (https://<this host>/#z=…) are
// accepted, so it can't be used as an open shortener for anything else.
// GET /api/shorten → { enabled } tells the Share page whether to offer it.

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const env = (name) => globalThis.Netlify?.env?.get?.(name) ?? process.env[name];

/** A link to one of this site's sketches: same host, root path, #z=… */
export function isSketchLink(longUrl, siteHost) {
  let u;
  try {
    u = new URL(longUrl);
  } catch {
    return false;
  }
  return u.protocol === 'https:' && u.host === siteHost && u.pathname === '/' && !u.search && /^#z=[\w-]+$/.test(u.hash);
}

export default async (req) => {
  const token = env('SHORTLINK_TOKEN');
  const api = (env('SHORTLINK_API_URL') || 'https://a47l.com').replace(/\/+$/, '');
  if (req.method === 'GET') return json({ enabled: !!token });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!token) return json({ error: 'short links are not set up on this site' }, 503);

  const body = await req.json().catch(() => null);
  const siteHost = new URL(req.url).host;
  if (!body || !isSketchLink(body.url, siteHost)) return json({ error: 'only links to sketches on this site can be shortened' }, 400);
  if (body.url.length > 64_000) return json({ error: 'sketch link too long' }, 413);

  const title = String(body.title ?? 'Untitled').slice(0, 120);
  let res;
  try {
    res = await fetch(`${api}/api/links`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ url: body.url, notes: `soda.strudel: ${title}` }),
    });
  } catch {
    return json({ error: 'the shortener could not be reached' }, 502);
  }
  const link = await res.json().catch(() => ({}));
  if (!res.ok || !link.slug || !link.domain) {
    // never pass the shortener's auth details back to the browser
    return json({ error: res.status === 401 ? 'the shortener refused this site’s token' : 'the shortener said no' }, 502);
  }
  return json({ short: `https://${link.domain}/${link.slug}` });
};

export const config = { path: '/api/shorten' };
