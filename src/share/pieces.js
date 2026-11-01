// Pieces from the Repertoire's collections that soda.strudel may open: only
// curated pieces whose authors chose an open licence (decision
// 2026-11-01-repertoire-reuse-policy). Their code is never stored in the app –
// it is fetched from where the author published it when someone clicks Open,
// through /api/piece (a fixed allowlist, so it is no open proxy), and opens
// with a credit header on top so the author's name travels with it.

/** "url" or "url#export" – how the allowlist names a piece. */
export const pieceKey = (load) => (load?.export ? `${load.url}#${load.export}` : load?.url ?? '');

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

/** Lines that credit the author at the top of the opened code. */
export function creditHeader(item) {
  const lines = [
    `// "${item.title}"${item.by ? ` by ${item.by}` : ''}`,
    `// Licence: ${item.license}${item.source || item.url ? ` · source: ${item.source || item.url}` : ''}`,
    '// Opened unchanged from the soda.strudel Repertoire – the piece belongs to its author.',
  ];
  return lines.join('\n') + '\n\n';
}

const looksLikeCode = (res) => res?.ok && !/text\/html/.test(res.headers.get('content-type') ?? '');

/** The piece's code, fetched from its source. Throws with a readable message. */
export async function fetchPiece(load, { dev = false } = {}) {
  const q = new URLSearchParams({ url: load.url, ...(load.export ? { export: load.export } : {}) });
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
    return load.export ? extractExport(text, load.export) ?? '' : text;
  }
  throw new Error('opening pieces needs the deployed site (or `netlify dev`)');
}
