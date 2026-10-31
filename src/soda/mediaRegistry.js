// Name -> media source registry. Pure module: fetch is available in browsers and Node.
const registry = new Map();
const listeners = new Set();

const typeOf = (url) => (/\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : 'image');

export function registerMedia(name, source) {
  const entry = typeof source === 'string' ? { url: source, type: typeOf(source) } : { type: typeOf(source.url), ...source };
  registry.set(name, entry);
  listeners.forEach((fn) => fn(name, entry));
}

export const getMedia = (name) => registry.get(name);
export const listMedia = () => [...registry.entries()].map(([name, entry]) => ({ name, ...entry }));
export const onMediaRegistered = (fn) => (listeners.add(fn), () => listeners.delete(fn));

export function resolvePackUrl(id) {
  if (id.startsWith('soda:')) return `/media/${id.slice(5)}/media.json`;
  return id;
}

export async function loadMediaPack(id, base = globalThis.location?.origin) {
  const url = resolvePackUrl(id);
  const res = await fetch(base ? new URL(url, base) : url);
  if (!res.ok) throw new Error(`media pack ${id}: ${res.status}`);
  const items = await res.json();
  for (const [name, entry] of Object.entries(items)) registerMedia(name, typeof entry === 'string' ? entry : entry);
  return Object.keys(items);
}
