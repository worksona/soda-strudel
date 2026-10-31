// GitHub sample libraries: any repo with a strudel.json, as on strudel.cc.
// Loaded libraries are remembered in this browser; "Add to sketch" writes
// samples('github:user/repo') into the code so shared links load them too.
import { samples } from '@strudel/webaudio';
import { lsGet, lsSet } from '../ui/dom.js';

// Verified to serve a strudel.json. Check each repo's licence before publishing pieces.
export const CURATED = [
  { id: 'tidalcycles/dirt-samples', title: 'Dirt-Samples', note: 'The classic TidalCycles set: 218 sounds, 2,000+ samples (808, 909, breaks, voices…).' },
  { id: 'yaxu/clean-breaks', title: 'clean-breaks', note: 'Famous breakbeats (amen-era funk breaks) – chop them with .slice / .splice.' },
  { id: 'eddyflux/crate', title: 'crate', note: 'A crate of drums and percussion: congas, bongos, djembe, bells, blocks.' },
  { id: 'mot4i/garden', title: 'garden', note: 'A compact kit plus fx, strings, loops and metal hits.' },
  { id: 'bubobubobubobubo/dough-fox', title: 'dough-fox', note: '63 characterful one-shots: kicks, claps, beeps, noises.' },
  { id: 'yaxu/spicule', title: 'spicule', note: '75 sounds from Alex McLean’s Spicule album – acid, airhorns, basses, guitars.' },
  { id: 'yaxu/mrid', title: 'mrid', note: 'Mridangam strokes (South Indian percussion).' },
  { id: 'tidalcycles/uzu-drumkit', title: 'uzu-drumkit', note: 'Strudel’s default kit: bd sd hh oh cp…' },
  { id: 'tidalcycles/uzu-wavetables', title: 'uzu-wavetables', note: 'Wavetables for the wt_ synths.' },
  { id: 'switchangel/pad', title: 'pad', note: 'A single lush pad, swpad.' },
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

export async function loadLibrary(input, { remember = true } = {}) {
  const lib = parseLibrary(input);
  const res = await fetch(lib.url);
  if (!res.ok) throw new Error(`${lib.id}: no strudel.json found (${res.status})`);
  const json = await res.json();
  const base = json._base ?? lib.url.slice(0, lib.url.lastIndexOf('/') + 1);
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

export async function loadSavedLibraries() {
  await Promise.all(savedLibraries().map((id) => loadLibrary(id, { remember: false }).catch((e) => console.warn('[soda] github library', id, e.message))));
}
