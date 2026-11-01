// GitHub sample libraries: any repo with a strudel.json, as on strudel.cc.
// Loaded libraries are remembered in this browser; "Add to sketch" writes
// samples('github:user/repo') into the code so shared links load them too.
import { samples } from '@strudel/webaudio';
import { lsGet, lsSet } from '../ui/dom.js';

// Verified to serve a strudel.json. Check each repo's licence before publishing pieces.
// Community sound banks cleared by the rights check (2026-11-01): open licence,
// contents made by their authors. They load with soda and are credited in Sounds.
export const CLEARED = [
  { id: 'AuditeMarlow/samples', title: 'AuditeMarlow drums', prefix: 'marlow_', note: 'Kick, snare and hi-hat made by Audite Marlow – marlow_kick, marlow_snare, marlow_hihat (prefixed so they never replace kick, snare or hihat in your sketches).', license: 'MIT', by: 'Audite Marlow', url: 'https://github.com/AuditeMarlow/samples' },
  { id: 'fstiffo/polifonia-samples/master', title: 'Polifonia church bells', note: 'Single church-bell notes from San Pietro, recorded for the Polifonia Song Contest 2024 – try n("0 2 4").s("italy").', license: 'CC0-1.0', by: 'Francesco Stiffoni / Polifonia Song Contest 2024', url: 'https://github.com/fstiffo/polifonia-samples' },
  { id: 'hvillase/cavlp-25p', title: 'Household foley', note: 'A bottle cap, a ball and a spray can – botella, pelota, spray.', license: 'GPL-3.0', by: 'hvillase', url: 'https://github.com/hvillase/cavlp-25p' },
];

// Suggested libraries: open licences only (decision 2026-11-01-repertoire-reuse-policy).
// Any other library can still be loaded by name.
export const CURATED = [
  { id: 'tidalcycles/uzu-drumkit', title: 'uzu-drumkit', note: 'Strudel’s default kit: bd sd hh oh cp… (Unlicense)' },
  { id: 'switchangel/pad', title: 'pad', note: 'A single lush pad, swpad, by Switch Angel (Unlicense).' },
];

const KEY = 'soda.github';
const loaded = new Map(); // id -> { id, url, names }
const owner = new Map(); // sound name -> library id
const listeners = new Set();
export const onGithubChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const changed = () => listeners.forEach((fn) => fn());

/** Accepts user/repo, user/repo/branch, github:user/repo, a github.com URL or any strudel.json URL. */
export function parseLibrary(input) {
  let s = String(input).trim();
  if (!s) throw new Error('enter user/repo or a strudel.json URL');
  if (/^https?:\/\//.test(s) && !/^https?:\/\/github\.com\//.test(s)) {
    const url = s.endsWith('.json') ? s : `${s.replace(/\/$/, '')}/strudel.json`;
    return { id: url, code: `samples('${url}')`, url };
  }
  s = s.replace(/^github:/, '').replace(/^https?:\/\/github\.com\//, '').replace(/\/tree\//, '/').replace(/\/$/, '');
  const [user, repo, branch = 'main', ...rest] = s.split('/');
  if (!user || !repo) throw new Error('expected user/repo');
  const path = rest.length ? `${rest.join('/')}/` : '';
  const id = [user, repo, ...(branch !== 'main' || rest.length ? [branch, ...rest] : [])].join('/');
  return { id, code: `samples('github:${id}')`, url: `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}strudel.json` };
}

export async function loadLibrary(input, { remember = true, prefix = '' } = {}) {
  const lib = parseLibrary(input);
  const res = await fetch(lib.url);
  if (!res.ok) throw new Error(`${lib.id}: no strudel.json found (${res.status})`);
  let json = await res.json();
  const base = json._base ?? lib.url.slice(0, lib.url.lastIndexOf('/') + 1);
  if (prefix) json = Object.fromEntries(Object.entries(json).map(([k, v]) => [k.startsWith('_') ? k : prefix + k, v]));
  await samples(json, base);
  const names = Object.keys(json).filter((k) => !k.startsWith('_'));
  names.forEach((n) => owner.set(n.toLowerCase(), lib.id));
  loaded.set(lib.id, { ...lib, names });
  if (remember) {
    const saved = savedLibraries();
    if (!saved.includes(lib.id)) lsSet(KEY, [...saved, lib.id]);
  }
  changed();
  return loaded.get(lib.id);
}

export const savedLibraries = () => lsGet(KEY, []);
export const loadedLibraries = () => [...loaded.values()];
export const githubLibraryOf = (soundName) => owner.get(soundName.toLowerCase());

export function forgetLibrary(id) {
  lsSet(KEY, savedLibraries().filter((x) => x !== id));
  loaded.delete(id);
  changed();
}

/** Loads the cleared community banks; their sounds then work like soda's own. */
export async function loadClearedLibraries() {
  await Promise.all(CLEARED.map((c) => loadLibrary(c.id, { remember: false, prefix: c.prefix }).catch((e) => console.warn('[soda] cleared library', c.id, e.message))));
}
export const clearedLibrary = (id) => CLEARED.find((c) => c.id === id);

export async function loadSavedLibraries() {
  await Promise.all(savedLibraries().map((id) => loadLibrary(id, { remember: false }).catch((e) => console.warn('[soda] github library', id, e.message))));
}
