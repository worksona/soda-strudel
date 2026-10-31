// Sketch <-> URL fragment codec. Shared by the app and the vibe skill (Node 18+),
// so it only uses web-standard APIs (CompressionStream, TextEncoder, btoa/atob).
//
// A sketch link looks like  https://<site>/#z=<base64url(deflate-raw(JSON))>
// The fragment never reaches the server, so links need no backend.

export const SKETCH_VERSION = 1;

/**
 * @typedef {object} Sketch
 * @property {number} v
 * @property {string} code          Strudel code (with soda multimedia functions)
 * @property {string} [title]
 * @property {string} [by]
 * @property {'free'|'9:16'|'1:1'|'16:9'} [aspect]
 * @property {Record<string,string>} [media]   extra media names -> public URLs
 * @property {boolean} [camera]     piece uses the camera (viewer gets an Allow / Play without choice)
 */

export function normalizeSketch(input) {
  const s = typeof input === 'string' ? { code: input } : { ...input };
  if (typeof s.code !== 'string' || !s.code.trim()) throw new Error('sketch needs non-empty code');
  s.v = SKETCH_VERSION;
  if (s.camera === undefined) s.camera = /\bcam\s*\(|camMotion/.test(s.code);
  for (const k of Object.keys(s)) if (s[k] === undefined || s[k] === '') delete s[k];
  return s;
}

const toBase64Url = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = (str) => {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

async function pipe(bytes, stream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** @returns {Promise<string>} fragment without '#', e.g. "z=eJx…" */
export async function encodeSketch(sketch) {
  const json = JSON.stringify(normalizeSketch(sketch));
  const packed = await pipe(new TextEncoder().encode(json), new CompressionStream('deflate-raw'));
  return `z=${toBase64Url(packed)}`;
}

/** Accepts "#z=…", "z=…" or a full URL. Returns null when there is no sketch. */
export async function decodeSketch(input) {
  if (!input) return null;
  let frag = input;
  const hashAt = frag.indexOf('#');
  if (hashAt >= 0) frag = frag.slice(hashAt + 1);
  const params = new URLSearchParams(frag);
  const z = params.get('z');
  if (!z) return null;
  const bytes = await pipe(fromBase64Url(z), new DecompressionStream('deflate-raw'));
  return normalizeSketch(JSON.parse(new TextDecoder().decode(bytes)));
}

export async function sketchUrl(sketch, origin) {
  return `${origin.replace(/\/$/, '')}/#${await encodeSketch(sketch)}`;
}

// Chat apps and social posts start truncating somewhere around here.
export const LONG_LINK_WARNING = 2000;
