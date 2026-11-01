// GET /api/piece?url=<raw url>[&export=<name>|&track=<title>] → the piece's code, as text
// GET /api/piece?list=codeberg:<owner>/<repo>[&branch=<b>] → { info, files } of a Codeberg repo
//
// Opens songs in soda.strudel (decision 2026-11-01-open-public-songs-in-soda).
// Fetched: the curated allowlist, and song files in public Codeberg
// repositories (Song repositories) – Codeberg sends no CORS headers, so the
// browser can't read it directly; GitHub it can. Text only, size-capped, no
// other hosts: this is no open proxy. Nothing is stored.
import ALLOW from '../lib/piece-allow.mjs';
import { extractExport, extractTrack, pieceKey } from '../../src/share/pieces.js';

const MAX = 400_000;
const CODEBERG_RAW = /^https:\/\/codeberg\.org\/[\w.-]+\/[\w.-]+\/raw\/(branch|commit|tag)\/[^?#]+\.(js|mjs|str|strudel|txt|tidal)$/i;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=300' } });

async function listCodeberg(spec, branch) {
  const m = spec.match(/^codeberg:(\w[\w.-]*)\/(\w[\w.-]*)$/);
  if (!m) return json({ error: 'expected codeberg:owner/repo' }, 400);
  const [, owner, repo] = m;
  const api = `https://codeberg.org/api/v1/repos/${owner}/${repo}`;
  const meta = await fetch(api, { signal: AbortSignal.timeout(8000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!meta || meta.private) return json({ error: 'no such public Codeberg repository' }, 404);
  const ref = branch || meta.default_branch;
  const files = [];
  for (let page = 1; page <= 5; page++) {
    const t = await fetch(`${api}/git/trees/${encodeURIComponent(ref)}?recursive=true&per_page=1000&page=${page}`, { signal: AbortSignal.timeout(8000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!t) break;
    files.push(...(t.tree ?? []).filter((e) => e.type === 'blob').map((e) => ({ path: e.path, size: e.size })));
    if (!t.truncated) break;
  }
  const license = (meta.licenses ?? []).find((l) => l && l !== 'none') ?? 'none stated';
  return json({ info: { title: meta.full_name, owner: meta.owner?.login ?? owner, license, description: meta.description, url: meta.html_url, branch: ref }, files });
}
const text = (body, status = 200, extra = {}) =>
  new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*', ...extra } });

export default async (req) => {
  const q = new URL(req.url).searchParams;
  if (q.get('list')) return listCodeberg(q.get('list'), q.get('branch'));
  const load = { url: q.get('url') ?? '', ...(q.get('export') ? { export: q.get('export') } : {}), ...(q.get('track') ? { track: q.get('track') } : {}) };
  const songFile = CODEBERG_RAW.test(load.url) && !load.export && !load.track;
  if (!ALLOW.includes(pieceKey(load)) && !songFile) return text('this piece is not in the Repertoire', 403);
  let res;
  try {
    res = await fetch(load.url, { signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'soda-strudel-repertoire' } });
  } catch {
    return text('the source did not answer', 502);
  }
  if (!res.ok) return text(`the source answered ${res.status}`, 502);
  if (songFile && !/^text\/|javascript/.test(res.headers.get('content-type') ?? 'text/plain')) return text('not a text file', 415);
  const body = await res.text();
  if (body.length > MAX) return text('the piece is too large', 413);
  const code = load.export ? extractExport(body, load.export) : load.track ? extractTrack(body, load.track) : body;
  if (code == null) return text(`no piece called ${load.export ?? load.track} in the source`, 404);
  return text(code, 200, { 'cache-control': 'public, max-age=3600' });
};

export const config = { path: '/api/piece' };
