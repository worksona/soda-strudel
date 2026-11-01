// GET /api/piece?url=<raw url>[&export=<name>|&track=<title>] → the piece's code, as text
//
// Opens a Repertoire piece in soda.strudel. Only pieces on the allowlist –
// curated songs whose code is public at its source – are fetched, so this is
// no open proxy. Codeberg sends no CORS headers, hence the hop through here.
// Nothing is stored: the code comes from where the author published it.
import ALLOW from '../lib/piece-allow.mjs';
import { extractExport, extractTrack, pieceKey } from '../../src/share/pieces.js';

const MAX = 400_000;
const text = (body, status = 200, extra = {}) =>
  new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*', ...extra } });

export default async (req) => {
  const q = new URL(req.url).searchParams;
  const load = { url: q.get('url') ?? '', ...(q.get('export') ? { export: q.get('export') } : {}), ...(q.get('track') ? { track: q.get('track') } : {}) };
  if (!ALLOW.includes(pieceKey(load))) return text('this piece is not in the Repertoire', 403);
  let res;
  try {
    res = await fetch(load.url, { signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'soda-strudel-repertoire' } });
  } catch {
    return text('the source did not answer', 502);
  }
  if (!res.ok) return text(`the source answered ${res.status}`, 502);
  const body = await res.text();
  if (body.length > MAX) return text('the piece is too large', 413);
  const code = load.export ? extractExport(body, load.export) : load.track ? extractTrack(body, load.track) : body;
  if (code == null) return text(`no piece called ${load.export ?? load.track} in the source`, 404);
  return text(code, 200, { 'cache-control': 'public, max-age=3600' });
};

export const config = { path: '/api/piece' };
