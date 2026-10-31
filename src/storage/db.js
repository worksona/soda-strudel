// Everything a user adds lives in their own browser (IndexedDB). No backend.
//   sounds  – uploaded files and mic takes (WAV blobs), usable as s("name")
//   media   – uploaded images / videos, usable as img("name") / vid("name")
//   renders – exported videos and WAVs
import { openDB } from 'idb';

const dbp = openDB('soda-strudel', 1, {
  upgrade(db) {
    db.createObjectStore('sounds', { keyPath: 'name' });
    db.createObjectStore('media', { keyPath: 'name' });
    db.createObjectStore('renders', { keyPath: 'id', autoIncrement: true });
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
export const addRender = async (blob, meta) => (await dbp).add('renders', { blob, ...meta, created: Date.now() });

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
