// Everything a user adds lives in their own browser (IndexedDB). No backend.
//   sounds   – uploaded files and mic takes (WAV blobs), usable as s("name")
//   media    – uploaded images / videos, usable as img("name") / vid("name")
//   sketches – saved sketches (code, title, shape, thumbnail)
//   renders  – exported videos and WAVs
import { openDB } from 'idb';

const DB = 'soda-strudel';
const STORES = ['sounds', 'media', 'sketches', 'renders'];

const dbp = openDB(DB, 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore('sounds', { keyPath: 'name' });
      db.createObjectStore('media', { keyPath: 'name' });
      db.createObjectStore('renders', { keyPath: 'id', autoIncrement: true });
    }
    if (oldVersion < 2) db.createObjectStore('sketches', { keyPath: 'id' });
  },
});

export const safeName = (s) =>
  String(s).toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'untitled';

async function uniqueName(store, base) {
  const db = await dbp;
  let name = safeName(base);
  for (let i = 2; await db.get(store, name); i++) name = `${safeName(base)}_${i}`;
  return name;
}

// ---------- sounds & media ----------
export async function addSound(base, blob, source = 'upload') {
  const name = await uniqueName('sounds', base);
  await (await dbp).put('sounds', { name, blob, source, type: blob.type, bytes: blob.size, created: Date.now() });
  return name;
}
export async function addMedia(base, blob) {
  const name = await uniqueName('media', base);
  const type = blob.type.startsWith('video') ? 'video' : 'image';
  await (await dbp).put('media', { name, blob, type, mime: blob.type, bytes: blob.size, created: Date.now() });
  return name;
}
export const putSound = async (rec) => (await dbp).put('sounds', rec);
export const putMedia = async (rec) => (await dbp).put('media', rec);
export const listSounds = async () => (await dbp).getAll('sounds');
export const listMediaItems = async () => (await dbp).getAll('media');
export const deleteSound = async (name) => (await dbp).delete('sounds', name);
export const deleteMedia = async (name) => (await dbp).delete('media', name);

// ---------- sketches ----------
export const newSketchId = () => `sk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
export async function saveSketch(sketch) {
  const now = Date.now();
  const rec = { ...sketch, id: sketch.id ?? newSketchId(), created: sketch.created ?? now, updated: now };
  await (await dbp).put('sketches', rec);
  return rec;
}
export const getSketch = async (id) => (await dbp).get('sketches', id);
export const deleteSketch = async (id) => (await dbp).delete('sketches', id);
export const listSketches = async () => (await (await dbp).getAll('sketches')).sort((a, b) => b.updated - a.updated);

// ---------- renders ----------
export const addRender = async (blob, meta) => (await dbp).add('renders', { blob, bytes: blob.size, ...meta, created: Date.now() });
export const listRenders = async () => (await (await dbp).getAll('renders')).sort((a, b) => b.created - a.created);
export const deleteRender = async (id) => (await dbp).delete('renders', id);

// ---------- housekeeping ----------
export async function clearStore(name) {
  if (!STORES.includes(name)) throw new Error(`unknown store ${name}`);
  await (await dbp).clear(name);
}
export async function countAll() {
  const db = await dbp;
  return Object.fromEntries(await Promise.all(STORES.map(async (s) => [s, await db.count(s)])));
}
/** Wipes every store. The page should reload afterwards. */
export async function resetEverything() {
  const db = await dbp;
  await Promise.all(STORES.map((s) => db.clear(s)));
}

export async function storageStatus() {
  try {
    const persisted = (await navigator.storage?.persisted?.()) ?? false;
    const { usage = 0, quota = 0 } = (await navigator.storage?.estimate?.()) ?? {};
    return { persisted, usage, quota };
  } catch {
    return { persisted: false, usage: 0, quota: 0 };
  }
}
/** Ask the browser not to evict our data. Called after the first save. */
export async function requestPersist() {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
