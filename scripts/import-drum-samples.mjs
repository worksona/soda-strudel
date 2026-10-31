// Builds the drums of the soda pack from real recordings we are allowed to ship:
//   VCSL – Versilian Community Sample Library (CC0-1.0) – acoustic kit & percussion
//   uzu-drumkit – Strudel's default kit by switchangel & mot4i (Unlicense)
// Each sample is downloaded once (cached), trimmed of leading silence, cut to a
// sensible length with a short fade, levelled, and written as 16-bit WAV with
// its channels and sample rate kept. Credits go to public/samples/soda/CREDITS.md.
//   node scripts/import-drum-samples.mjs && pnpm manifests
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const VCSL = 'https://raw.githubusercontent.com/sgossner/VCSL/master/';
const UZU = 'https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main/';
const cache = new URL('../node_modules/.cache/soda-drums/', import.meta.url);
const out = new URL('../public/samples/soda/', import.meta.url);

const V = (path) => ({ url: VCSL + path, source: 'VCSL (CC0-1.0)' });
const U = (path) => ({ url: UZU + path, source: 'uzu-drumkit (Unlicense)' });
const M = 'Membranophones/Struck%20Membranophones/';
const I = 'Idiophones/Struck%20Idiophones/';

// name -> [{ url, source }, …] in variation order (name:0, name:1 …), plus
// max length in seconds and peak level. Indexes used by the examples are kept.
const KIT = {
  kick: { len: 1.2, peak: 0.85, files: [U('bd/10_bd_switchangel.wav'), V(`${M}Bass%20Drum%201/BDrumNew_hit_v3_rr1_Sum.wav`), U('bd/14_bd_switchangel.wav'), U('bd/11_bd_mot4i.wav')] },
  snare: { len: 0.8, peak: 0.7, files: [U('sd/11_sd_switchangel_3.wav'), V(`${M}Snare%20Drum%2C%20Modern%201/Snare2_HitNS_v4_rr1_Mid.wav`), U('sd/10_sd_switchangel-bounce-2.wav')] },
  clap: { len: 0.7, peak: 0.6, files: [U('cp/10_cp_switchangel.wav'), V(`${I}Claps/Clap_rr1.wav`)] },
  rim: { len: 0.4, peak: 0.5, files: [U('rim/10_rim_switchangel.wav'), V(`${M}Snare%20Drum%2C%20Rope/RopeSnare_sidestick_Main_vl2_rr1.wav`)] },
  hat: { len: 0.35, peak: 0.4, files: [U('hh/10_hh_switchangel.wav'), V(`${I}Hi-Hat%20Cymbal/HiHat_HitC_v2_rr1_Mid.wav`)] },
  openhat: { len: 1.2, peak: 0.38, files: [U('oh/10_oh_switchangel.wav'), V(`${I}Hi-Hat%20Cymbal/HiHat_HitLoose_rr1_Mid.wav`)] },
  ride: { len: 3, peak: 0.35, files: [U('rd/10_rd_switchangel.wav'), V(`${I}Suspended%20Cymbal%201/susCymb1_hit_bell_mf1.wav`)] },
  crash: { len: 3.5, peak: 0.4, files: [U('cr/10_cr_switchangel.wav'), V(`${I}Crash%20Cymbals/cymbal_crash1_mf1.wav`)] },
  tom: { len: 1, peak: 0.65, files: [V(`${M}Tom%20Low/TomL_HitM_v3_rr1_Mid.wav`), U('mt/10_mt_mot4i.wav'), V(`${M}Tom%20High/TomH_HitM_v3_rr1_Mid.wav`)] },
  shaker: { len: 0.6, peak: 0.35, files: [U('sh/10_sh_switchangel.wav'), V(`${I}Shaker%2C%20Small/Mid_ShakerDouble_Down_rr1.wav`)] },
  cowbell: { len: 0.8, peak: 0.4, files: [V(`${I}Cowbells/Cowbell1_Hit_v3_rr1_Mid.wav`)] },
  clave: { len: 0.4, peak: 0.45, files: [V(`${I}Claves/Claves1_Hit_v2_rr1_Mid.wav`)] },
  perc: { len: 1, peak: 0.45, files: [V(`${I}Woodblock/wood_click_f_rr1.wav`), V(`${I}Agogo%20Bells/Agogo_High_v2_rr1_Mid.wav`), V(`${I}Triangles/Triangle1_Hit_v1_rr1_Mid.wav`)] },
  tamb: { len: 0.9, peak: 0.4, files: [V(`${I}Tambourine%201/Tamb1_Hit_v2_rr1_Mid.wav`), V(`${I}Tambourine%202/Tamb2_Shake_rr3_Mid.wav`)] },
  conga: { len: 1, peak: 0.6, files: [V(`${M}Congas/Conga_HitN_v2_rr1_Sum.wav`), V(`${M}Congas/Quinto_HitFM1_v1_rr1_Sum.wav`)] },
  bongo: { len: 0.8, peak: 0.55, files: [V(`${M}Bongos/BongoH_Hit1_v2_rr1_Mid.wav`), V(`${M}Bongos/BongoH_HitMuted1_v2_rr1_Mid.wav`)] },
  cajon: { len: 0.9, peak: 0.65, files: [V(`${I}Cajon/Cajon_hit1_f_rr1.wav`), V(`${I}Cajon/Cajon_hit2_f_rr1.wav`)] },
};

// ---------- resolve real paths from the published VCSL manifest ----------
// (VCSL folder names are long; look each file name up instead of guessing)
const vcslMap = await (await fetch('https://raw.githubusercontent.com/felixroos/dough-samples/main/vcsl.json')).json();
const vcslPaths = Object.values(vcslMap).flat().filter((p) => typeof p === 'string');
function resolve(file) {
  if (!file.url.startsWith(VCSL)) return file;
  const name = decodeURIComponent(file.url.split('/').pop());
  const hit = vcslPaths.find((p) => decodeURIComponent(p).endsWith(`/${name}`));
  if (!hit) throw new Error(`VCSL file not found: ${name}`);
  return { ...file, url: VCSL + hit };
}

// ---------- WAV in / out ----------
function readWav(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('not a WAV');
  let o = 12;
  let fmt;
  let data;
  while (o + 8 <= buf.length) {
    const id = buf.toString('ascii', o, o + 4);
    const size = buf.readUInt32LE(o + 4);
    if (id === 'fmt ') {
      let format = buf.readUInt16LE(o + 8);
      if (format === 0xfffe) format = buf.readUInt16LE(o + 32); // extensible: sub-format
      fmt = { format, channels: buf.readUInt16LE(o + 10), rate: buf.readUInt32LE(o + 12), bits: buf.readUInt16LE(o + 22) };
    } else if (id === 'data') data = buf.subarray(o + 8, o + 8 + size);
    o += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error('WAV without fmt/data');
  const { format, channels, bits } = fmt;
  const bytes = bits / 8;
  const frames = Math.floor(data.length / (bytes * channels));
  const chans = Array.from({ length: channels }, () => new Float32Array(frames));
  for (let i = 0; i < frames; i++)
    for (let c = 0; c < channels; c++) {
      const p = (i * channels + c) * bytes;
      let v;
      if (format === 3) v = bits === 64 ? data.readDoubleLE(p) : data.readFloatLE(p);
      else if (bits === 16) v = data.readInt16LE(p) / 32768;
      else if (bits === 24) v = data.readIntLE(p, 3) / 8388608;
      else if (bits === 32) v = data.readInt32LE(p) / 2147483648;
      else if (bits === 8) v = (data[p] - 128) / 128;
      else throw new Error(`unsupported ${bits}-bit WAV`);
      chans[c][i] = v;
    }
  return { rate: fmt.rate, chans };
}

function writeWav({ rate, chans }) {
  const n = chans[0].length;
  const ch = chans.length;
  const buf = Buffer.alloc(44 + n * ch * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * ch * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * ch * 2, 28);
  buf.writeUInt16LE(ch * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * ch * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++, o += 2) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, chans[c][i])) * 32767), o);
  return buf;
}

/** Trim leading silence, cap the length with a fade, normalise to `peak`. */
function shape({ rate, chans }, { len, peak }) {
  const amp = (i) => Math.max(...chans.map((c) => Math.abs(c[i])));
  const max = Math.max(...chans.map((c) => c.reduce((m, x) => Math.max(m, Math.abs(x)), 0))) || 1;
  let start = 0;
  while (start < chans[0].length - 1 && amp(start) < max * 0.003) start++;
  start = Math.max(0, start - Math.round(rate * 0.002));
  // also trim trailing silence
  let end = chans[0].length;
  while (end > start + 1 && amp(end - 1) < max * 0.001) end--;
  end = Math.min(end, start + Math.round(len * rate));
  const fade = Math.min(Math.round(rate * 0.04), end - start);
  const gain = peak / max;
  return {
    rate,
    chans: chans.map((c) => {
      const s = c.slice(start, end);
      for (let i = 0; i < s.length; i++) s[i] *= gain * Math.min(1, (s.length - i) / fade);
      return s;
    }),
  };
}

async function fetchCached(url) {
  await mkdir(cache, { recursive: true });
  const file = new URL(createHash('sha1').update(url).digest('hex') + '.wav', cache);
  if (existsSync(file)) return readFile(file);
  let res = await fetch(url);
  // dough-samples' vcsl.json drops the top folder on a few paths (e.g. tom_mallet)
  if (res.status === 404 && url.startsWith(VCSL) && !/^(Membranophones|Idiophones)\//.test(url.slice(VCSL.length)))
    res = await fetch(VCSL + 'Membranophones/' + url.slice(VCSL.length));
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(file, buf);
  return buf;
}

const credits = ['# soda drum credits', '', 'Real recordings, redistributed under their licences:', '', '- **VCSL** – Versilian Community Sample Library by Sam Gossner, CC0-1.0 – https://github.com/sgossner/VCSL', '- **uzu-drumkit** – by switchangel and mot4i for Strudel, Unlicense – https://github.com/tidalcycles/uzu-drumkit', '', '| sound | file | source |', '|---|---|---|'];
for (const [name, spec] of Object.entries(KIT)) {
  const dir = new URL(`${name}/`, out);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const [i, raw] of spec.files.entries()) {
    const file = resolve(raw);
    const wav = shape(readWav(await fetchCached(file.url)), spec);
    await writeFile(new URL(`${i}.wav`, dir), writeWav(wav));
    credits.push(`| ${name}:${i} | ${decodeURIComponent(file.url.split('/').pop())} | ${file.source} |`);
  }
  process.stdout.write(`${name} `);
}
await rm(new URL('snap/', out), { recursive: true, force: true }); // no real recording of a snap – dropped
await writeFile(new URL('CREDITS.md', out), credits.join('\n') + '\n');
console.log('\ndrums imported');
