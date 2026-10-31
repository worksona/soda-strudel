// Fetches the public Strudel default sample-bank manifests and writes a compact
// snapshot (sound name -> sample count) to data/default-banks.json.
// The app loads these banks at runtime from raw.githubusercontent.com; the
// snapshot only exists so the vibe skill can validate sound names offline.
// Run manually when upstream banks change: node scripts/snapshot-default-banks.mjs
import { writeFile } from 'node:fs/promises';

const DOUGH = 'https://raw.githubusercontent.com/felixroos/dough-samples/main';
export const DEFAULT_BANK_URLS = [
  `${DOUGH}/tidal-drum-machines.json`,
  `${DOUGH}/piano.json`,
  `${DOUGH}/Dirt-Samples.json`,
  `${DOUGH}/vcsl.json`,
  `${DOUGH}/mridangam.json`,
  'https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main/strudel.json',
];
const ALIAS_URL = 'https://raw.githubusercontent.com/todepond/samples/main/tidal-drum-machines-alias.json';

const count = (v) => (Array.isArray(v) ? v.length : typeof v === 'object' ? Object.values(v).flat().length : 1);

const banks = [];
for (const url of DEFAULT_BANK_URLS) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const json = await res.json();
  const sounds = {};
  for (const [k, v] of Object.entries(json)) if (!k.startsWith('_')) sounds[k] = count(v);
  banks.push({ url, sounds });
}
const aliases = await (await fetch(ALIAS_URL)).json();

await writeFile(
  new URL('../data/default-banks.json', import.meta.url),
  JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), banks, aliases }, null, 1),
);
console.log(`wrote ${banks.length} banks, ${Object.keys(aliases).length} aliases`);
