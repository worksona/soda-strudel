// Pieces from the Repertoire that soda.strudel opens: any song whose code is
// public at its source, opened unchanged (decisions 2026-11-01-repertoire-reuse-policy
// and 2026-11-01-open-public-songs-in-soda). Their code is never stored in the
// app – it is fetched from where the author published it when someone clicks
// Open, through /api/piece (a fixed allowlist, so it is no open proxy), and
// opens with a credit header on top so the author's name travels with it.
// A load is { url } (a file), { url, export } (one tune in a module like
// Strudel's tunes.mjs) or { url, track } (a strudel.cc link in a README table row).

/** "url" or "url#export" – how the allowlist names a piece. */
export const pieceKey = (load) => (load?.export ? `${load.url}#${load.export}` : load?.track ? `${load.url}@${load.track}` : load?.url ?? '');

/**
 * The template literal exported as `name` from a module like Strudel's tunes.mjs
 * (export const caverave = `…`;). Returns null when there is no such export.
 */
export function extractExport(source, name) {
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) return null;
  const start = source.search(new RegExp(`export const ${name.replace(/\$/g, '\\$')}\\s*=\\s*\``));
  if (start < 0) return null;
  let i = source.indexOf('`', start) + 1;
  let out = '';
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '\\' && i + 1 < source.length) {
      const next = source[i + 1];
      out += next === '`' || next === '\\' || next === '$' ? next : ch + next;
      i++;
    } else if (ch === '`') return out;
    else out += ch;
  }
  return null;
}

/** The code inside a strudel.cc link (https://strudel.cc/#<base64>), or null. */
export function codeFromStrudelLink(link) {
  const hash = String(link).split('#')[1];
  if (!hash) return null;
  try {
    const bin = atob(decodeURIComponent(hash));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

/** The code of the README table row whose first cell is `title` – its strudel.cc link. */
export function extractTrack(readme, title) {
  for (const line of readme.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    if (cells[1] !== title) continue;
    const link = line.match(/\((https:\/\/strudel\.cc\/[^)\s]*#[^)\s]+)\)/)?.[1];
    return link ? codeFromStrudelLink(link) : null;
  }
  return null;
}

/** Lines that credit the author at the top of the opened code. */
export function creditHeader(item) {
  const open = item.reuse === 'open';
  const lines = [
    `// "${item.title}"${item.by ? ` by ${item.by}` : ''}${item.original ? ` – original song: ${item.original}` : ''}`,
    `// Licence: ${item.license || 'none stated'}${item.source || item.url ? ` · source: ${item.source || item.url}` : ''}`,
    open
      ? '// Opened unchanged from the soda.strudel Repertoire – the piece belongs to its author.'
      : '// Opened unchanged from the soda.strudel Repertoire – it belongs to its author; ask them before reusing it.',
  ];
  return lines.join('\n') + '\n\n';
}

const looksLikeCode = (res) => res?.ok && !/text\/html/.test(res.headers.get('content-type') ?? '');

/** The piece's code, fetched from its source. Throws with a readable message. */
export async function fetchPiece(load, { dev = false } = {}) {
  // GitHub raw files answer the browser directly (CORS) – no hop needed
  if (!load.export && !load.track && load.url.startsWith('https://raw.githubusercontent.com/')) {
    const direct = await fetch(load.url).catch(() => null);
    if (direct?.ok) return direct.text();
  }
  const q = new URLSearchParams({ url: load.url, ...(load.export ? { export: load.export } : {}), ...(load.track ? { track: load.track } : {}) });
  const res = await fetch(`/api/piece?${q}`).catch(() => null);
  if (looksLikeCode(res)) return res.text();
  if (res && res.status !== 404 && !/text\/html/.test(res.headers.get('content-type') ?? '')) {
    throw new Error((await res.text().catch(() => '')) || `could not fetch the piece (${res.status})`);
  }
  // the dev server has no functions: GitHub raw files allow direct fetches
  if (dev && load.url.startsWith('https://raw.githubusercontent.com/')) {
    const direct = await fetch(load.url);
    if (!direct.ok) throw new Error(`could not fetch the piece (${direct.status})`);
    const text = await direct.text();
    return load.export ? extractExport(text, load.export) ?? '' : load.track ? extractTrack(text, load.track) ?? '' : text;
  }
  throw new Error('opening pieces needs the deployed site (or `netlify dev`)');
}
