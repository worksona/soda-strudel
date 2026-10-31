// The user's own library: files and takes stored in IndexedDB, registered with
// Strudel (sounds) and the media registry (images / video) via blob: URLs.
import { samples } from '@strudel/webaudio';
import { registerMedia } from '../soda/mediaRegistry.js';
import { addMedia, addSound, deleteMedia, deleteSound, listMediaItems, listSounds, requestPersist } from '../storage/db.js';

const urls = new Map();
const listeners = new Set();
export const onLibraryChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const changed = () => listeners.forEach((fn) => fn());

function blobUrl(key, blob) {
  if (urls.has(key)) URL.revokeObjectURL(urls.get(key));
  const url = URL.createObjectURL(blob);
  urls.set(key, url);
  return url;
}

const registerSound = (rec) => samples({ [rec.name]: [blobUrl(`s:${rec.name}`, rec.blob)] });
const registerOneMedia = (rec) => registerMedia(rec.name, { url: blobUrl(`m:${rec.name}`, rec.blob), type: rec.type, local: true });

export async function registerLibrary() {
  const [sounds, media] = await Promise.all([listSounds(), listMediaItems()]);
  await Promise.all(sounds.map(registerSound));
  media.forEach(registerOneMedia);
}

const AUDIO = /^audio\/|\.(wav|mp3|ogg|flac|m4a|aiff?|opus|webm)$/i;
const VISUAL = /^(image|video)\/|\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|mov)$/i;

/** Import dropped / picked files. Returns [{ kind, name }] for what was added. */
export async function importFiles(files) {
  const added = [];
  for (const file of files) {
    const isAudio = file.type.startsWith('audio/') || (!file.type && AUDIO.test(file.name));
    if (isAudio) {
      const name = await addSound(file.name, file);
      await registerSound({ name, blob: file });
      added.push({ kind: 'sound', name });
    } else if (VISUAL.test(file.type) || VISUAL.test(file.name)) {
      const name = await addMedia(file.name, file);
      registerOneMedia({ name, blob: file, type: file.type.startsWith('video') ? 'video' : 'image' });
      added.push({ kind: 'media', name });
    }
  }
  if (added.length) {
    requestPersist();
    changed();
  }
  return added;
}

export async function saveTake(blob) {
  const name = await addSound(`take_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`, blob, 'take');
  await registerSound({ name, blob });
  requestPersist();
  changed();
  return name;
}

export async function removeSound(name) {
  await deleteSound(name);
  changed();
}
export async function removeMedia(name) {
  await deleteMedia(name);
  changed();
}
export const libraryChanged = changed;
