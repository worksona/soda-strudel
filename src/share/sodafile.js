// .soda files: a zip holding a sketch plus the user's own sounds and media it
// uses. This is how pieces built on personal recordings travel without a server.
import { strToU8, strFromU8, unzipSync, zipSync } from 'fflate';
import { listMediaItems, listSounds, putMedia, putSound } from '../storage/db.js';
import { normalizeSketch } from './sketch.js';

const usedIn = (code, name) => new RegExp(`(^|[^a-z0-9_])${name.replace(/[^a-z0-9_]/g, '')}([^a-z0-9_]|$)`, 'i').test(code);
const ext = (mime, fallback) => mime?.split('/')[1]?.split(/[;+]/)[0]?.replace('mpeg', 'mp3').replace('svg', 'svg') || fallback;

export async function buildSodaFile(sketch) {
  sketch = normalizeSketch(sketch);
  const files = {};
  const manifest = { sounds: [], media: [] };
  for (const s of await listSounds()) {
    if (!usedIn(sketch.code, s.name)) continue;
    const path = `sounds/${s.name}.${ext(s.type, 'wav')}`;
    files[path] = new Uint8Array(await s.blob.arrayBuffer());
    manifest.sounds.push({ name: s.name, path, type: s.type, source: s.source });
  }
  for (const m of await listMediaItems()) {
    if (!usedIn(sketch.code, m.name)) continue;
    const path = `media/${m.name}.${ext(m.mime, 'bin')}`;
    files[path] = new Uint8Array(await m.blob.arrayBuffer());
    manifest.media.push({ name: m.name, path, type: m.type, mime: m.mime });
  }
  files['sketch.json'] = strToU8(JSON.stringify(sketch, null, 2));
  files['library.json'] = strToU8(JSON.stringify(manifest, null, 2));
  files['README.txt'] = strToU8(
    'A soda.strudel piece. Open soda.strudel and drop this file on it.\n' +
      'soda.strudel is free software (AGPL-3.0) built on Strudel (https://strudel.cc).\n',
  );
  return { blob: new Blob([zipSync(files, { level: 6 })], { type: 'application/zip' }), manifest };
}

/** Imports a .soda file into IndexedDB. Returns the sketch, with names rewritten if they clashed. */
export async function readSodaFile(file) {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
  if (!files['sketch.json']) throw new Error('not a .soda file (no sketch.json)');
  const sketch = normalizeSketch(JSON.parse(strFromU8(files['sketch.json'])));
  const manifest = files['library.json'] ? JSON.parse(strFromU8(files['library.json'])) : { sounds: [], media: [] };
  const existingSounds = new Map((await listSounds()).map((s) => [s.name, s]));
  const existingMedia = new Map((await listMediaItems()).map((m) => [m.name, m]));
  const rename = (code, from, to) => code.replace(new RegExp(`(^|[^a-z0-9_])${from}(?=[^a-z0-9_]|$)`, 'gi'), `$1${to}`);

  for (const s of manifest.sounds) {
    const data = files[s.path];
    if (!data) continue;
    let name = s.name;
    const clash = existingSounds.get(name);
    if (clash && clash.bytes !== data.byteLength) {
      for (let i = 2; existingSounds.has(name); i++) name = `${s.name}_${i}`;
      sketch.code = rename(sketch.code, s.name, name);
    }
    if (!clash || name !== s.name)
      await putSound({ name, blob: new Blob([data], { type: s.type }), source: s.source ?? 'import', type: s.type, bytes: data.byteLength, created: Date.now() });
  }
  for (const m of manifest.media) {
    const data = files[m.path];
    if (!data) continue;
    let name = m.name;
    const clash = existingMedia.get(name);
    if (clash && clash.bytes !== data.byteLength) {
      for (let i = 2; existingMedia.has(name); i++) name = `${m.name}_${i}`;
      sketch.code = rename(sketch.code, m.name, name);
    }
    if (!clash || name !== m.name)
      await putMedia({ name, blob: new Blob([data], { type: m.mime }), type: m.type, mime: m.mime, bytes: data.byteLength, created: Date.now() });
  }
  return sketch;
}
