// Scans public/samples/<pack>/<sound>/*.{wav,mp3,ogg,flac,m4a} and
// public/media/<pack>/*.{svg,png,jpg,jpeg,webp,avif,gif,mp4,webm} and writes:
//   public/samples/<pack>/strudel.json  – loadable with samples('soda:<pack>')
//   public/media/<pack>/media.json       – loadable with media('soda:<pack>')
//   public/sounds.json / public/media.json – catalogues for the app and the vibe skill
// Add a pack by dropping a folder in and running `pnpm manifests` (or `pnpm build`).
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { SYNTH_SOUNDS } from '../src/soda/catalog.js';

const pub = new URL('../public/', import.meta.url);
const AUDIO = /\.(wav|mp3|ogg|flac|m4a|opus)$/i;
const MEDIA = /\.(svg|png|jpe?g|webp|avif|gif|mp4|webm)$/i;

const dirs = async (url) => {
  try {
    const entries = await readdir(url, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name).sort();
  } catch {
    return [];
  }
};
const files = async (url, re) => (await readdir(url)).filter((f) => re.test(f)).sort();
const readJson = async (url, fallback) => {
  try {
    return JSON.parse(await readFile(url, 'utf8'));
  } catch {
    return fallback;
  }
};

const soundPacks = [];
for (const pack of await dirs(new URL('samples/', pub))) {
  const packUrl = new URL(`samples/${pack}/`, pub);
  const meta = await readJson(new URL('pack.json', packUrl), {});
  const manifest = { _base: `/samples/${pack}/` };
  for (const sound of await dirs(packUrl)) {
    const list = await files(new URL(`${sound}/`, packUrl), AUDIO);
    if (list.length) manifest[`${meta.prefix ?? pack}_${sound}`] = list.map((f) => `${sound}/${f}`);
  }
  await writeFile(new URL('strudel.json', packUrl), JSON.stringify(manifest, null, 1));
  const sounds = Object.fromEntries(Object.entries(manifest).filter(([k]) => k !== '_base').map(([k, v]) => [k, v.length]));
  soundPacks.push({ id: `soda:${pack}`, bank: meta.prefix ?? pack, licence: meta.licence ?? 'unknown', sounds });
}

const mediaPacks = [];
for (const pack of await dirs(new URL('media/', pub))) {
  const packUrl = new URL(`media/${pack}/`, pub);
  const meta = await readJson(new URL('pack.json', packUrl), {});
  const items = {};
  for (const f of await files(packUrl, MEDIA)) {
    const name = f.replace(MEDIA, '');
    const { size } = await stat(new URL(f, packUrl));
    items[name] = { url: `/media/${pack}/${f}`, type: /\.(mp4|webm)$/i.test(f) ? 'video' : 'image', bytes: size };
  }
  await writeFile(new URL('media.json', packUrl), JSON.stringify(items, null, 1));
  mediaPacks.push({ id: `soda:${pack}`, licence: meta.licence ?? 'unknown', items: Object.fromEntries(Object.entries(items).map(([k, v]) => [k, v.type])) });
}

// General MIDI soundfont names (gm_*) straight from @strudel/soundfonts, so the
// validator can check them exactly.
const gmSource = await readFile(new URL('../node_modules/@strudel/soundfonts/gm.mjs', import.meta.url), 'utf8').catch(() => '');
const soundfonts = [...new Set(gmSource.match(/gm_[a-z0-9_]+/g) ?? [])].sort();

const defaults = await readJson(new URL('../data/default-banks.json', import.meta.url), { banks: [], aliases: {} });

await writeFile(
  new URL('sounds.json', pub),
  JSON.stringify(
    {
      note: 'Sounds available in soda-strudel. Use s("name") or s("kick").bank("soda"). Packs load automatically.',
      synths: SYNTH_SOUNDS,
      soundfontPrefix: 'gm_',
      soundfonts,
      packs: soundPacks,
      defaults: defaults.banks.map((b) => ({ url: b.url, sounds: b.sounds })),
      bankAliases: defaults.aliases,
    },
    null,
    1,
  ),
);
await writeFile(new URL('media.json', pub), JSON.stringify({ note: 'Media available via img("name") / vid("name").', packs: mediaPacks }, null, 1));
console.log(`manifests: ${soundPacks.length} sound packs, ${mediaPacks.length} media packs`);
