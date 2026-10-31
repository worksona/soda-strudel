// Synthesises the tonal, texture and fx sounds of soda's pack ("soda") and the
// media pack ("demo"). Everything here is generated, so it is CC0 and ours to ship.
// The drums are real recordings – see scripts/import-drum-samples.mjs.
//   node scripts/gen-demo-assets.mjs && pnpm manifests
//
// Unpitched sounds: public/samples/soda/<sound>/<n>.wav  -> s("rain").bank("soda")
// Pitched sounds:   public/samples/soda/<sound>/<note>.wav (e.g. c4.wav). Strudel
// repitches note-named samples, so note("e4 g4").s("pluck").bank("soda") is in tune.
import { mkdir, rm, writeFile } from 'node:fs/promises';

const SR = 44100;
const TAU = Math.PI * 2;
const root = new URL('../public/', import.meta.url);

/** 16-bit WAV. `channels` is one array (mono) or [left, right]; peak sets the level. */
function wav(channels, peak = 0.7) {
  channels = Array.isArray(channels[0]) ? channels : [channels];
  const n = Math.min(...channels.map((c) => c.length));
  const ch = channels.length;
  const max = channels.reduce((m, c) => c.reduce((mm, x) => Math.max(mm, Math.abs(x)), m), 0) || 1;
  const gain = peak / max;
  const buf = Buffer.alloc(44 + n * ch * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * ch * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * ch * 2, 28);
  buf.writeUInt16LE(ch * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * ch * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++, o += 2) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, channels[c][i] * gain)) * 32767), o);
  return buf;
}

// ---------- tiny DSP kit ----------
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
let tune = 1; // stereo(): left a hair flat, right a hair sharp – a chorus-like width
const mtof = (m) => 440 * 2 ** ((m - 69) / 12) * tune;
/** Renders `make` twice – detuned for tonal sounds, fresh noise for noisy ones – as [L, R]. */
const stereo = (make, cents = 3) => {
  tune = 2 ** (-cents / 1200);
  const L = make();
  tune = 2 ** (cents / 1200);
  const R = make();
  tune = 1;
  return [L, R];
};
const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const midi = (name) => NOTE[name[0]] + (name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0) + (Number(name.at(-1)) + 1) * 12;
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const adsr = (t, len, a, r) => Math.min(1, t / a, Math.max(0, (len - t) / r));

/** Renders `seconds` with a per-sample callback that gets (t, i) and keeps its own state. */
const render = (seconds, fn) => {
  const out = new Array(Math.floor(seconds * SR));
  for (let i = 0; i < out.length; i++) out[i] = fn(i / SR, i);
  return out;
};
/** Phase-accumulating oscillator – safe for pitch sweeps. */
const osc = (shape = 'sine') => {
  let ph = 0;
  return (freq) => {
    ph = (ph + freq / SR) % 1;
    if (shape === 'sine') return Math.sin(TAU * ph);
    if (shape === 'saw') return 2 * ph - 1;
    if (shape === 'square') return ph < 0.5 ? 1 : -1;
    return 1 - 4 * Math.abs(ph - 0.5); // triangle
  };
};
const lowpass = () => {
  let y = 0;
  return (x, cutoff) => (y += (1 - Math.exp((-TAU * cutoff) / SR)) * (x - y));
};
const highpass = () => {
  const lp = lowpass();
  return (x, cutoff) => x - lp(x, cutoff);
};
/** State-variable filter (bandpass / lowpass with resonance). */
const svf = () => {
  let low = 0;
  let band = 0;
  return (x, cutoff, q = 1, mode = 'band') => {
    const f = 2 * Math.sin((Math.PI * Math.min(cutoff, SR / 6)) / SR);
    low += f * band;
    const high = x - low - band / q;
    band += f * high;
    return mode === 'low' ? low : mode === 'high' ? high : band;
  };
};
const sat = (x, drive = 1) => Math.tanh(x * drive);

// ---------- pitched ----------
const pluck = (note, len = 1.6, bright = 0.5) => {
  // Karplus–Strong
  const period = Math.round(SR / mtof(midi(note)));
  const line = Array.from({ length: period }, () => rand());
  let i = 0;
  return render(len, (t) => {
    const j = (i + 1) % period;
    const y = line[i];
    line[i] = (0.5 + bright * 0.49) * line[i] + (0.5 - bright * 0.49) * line[j];
    line[i] *= 0.996;
    i = j;
    return y * adsr(t, len, 0.002, 0.05);
  });
};
const fm = (note, { len = 2, ratio = 3.5, index = 4, decay = 0.6, idxDecay = 0.4 }) => {
  const f = mtof(midi(note));
  const m = osc();
  const c = osc();
  return render(len, (t) => c(f + m(f * ratio) * f * index * Math.exp(-t / idxDecay)) * env(t, 0.002, decay) * adsr(t, len, 0.001, 0.05));
};
const keys = (note, len = 2) => {
  const f = mtof(midi(note));
  const [a, b, c] = [osc(), osc(), osc()];
  return render(len, (t) => (a(f) + 0.4 * b(f * 2) * Math.exp(-t * 3) + 0.15 * c(f * 7.02) * Math.exp(-t * 12)) * env(t, 0.003, 0.9) * adsr(t, len, 0.001, 0.08));
};
const supersaw = (note, len, { voices = 5, detune = 0.012, attack = 0.01, release = 0.2, cutoff = 4000, chord = [0] }) => {
  const oscs = chord.flatMap((iv) => Array.from({ length: voices }, (_, v) => ({ o: osc('saw'), f: mtof(midi(note) + iv) * (1 + detune * (v / (voices - 1 || 1) - 0.5)) })));
  const lp = lowpass();
  return render(len, (t) => lp(oscs.reduce((s, { o, f }) => s + o(f), 0) / oscs.length, cutoff) * adsr(t, len, attack, release));
};
const bass = (note, kind) => {
  const f = mtof(midi(note));
  const o = osc(kind === 'acid' ? 'square' : 'saw');
  const o2 = osc('saw');
  const sub = osc();
  const filt = svf();
  const len = kind === 'sub' ? 1.5 : 1.2;
  return render(len, (t) => {
    if (kind === 'sub') return sub(f) * env(t, 0.005, 0.6) * adsr(t, len, 0.003, 0.1);
    if (kind === 'reese') return sat(filt(o(f * 0.997) + o2(f * 1.006), 500 + 300 * Math.sin(t * 3), 1.5, 'low') * 1.5 + 0.5 * sub(f), 1.4) * adsr(t, len, 0.01, 0.2);
    if (kind === 'acid') return sat(filt(o(f), 300 + 3000 * Math.exp(-t * 9), 6, 'low'), 2) * env(t, 0.002, 0.35);
    return sat(o(f) * 0.6 + sub(f), 1.8) * env(t, 0.005, 0.5) * adsr(t, len, 0.002, 0.05);
  });
};
const vox = (note, vowel = 'a', len = 1.6) => {
  // glottal saw through three formant filters
  const formants = { a: [730, 1090, 2440], e: [530, 1840, 2480], o: [570, 840, 2410] }[vowel];
  const f = mtof(midi(note));
  const o = osc('saw');
  const vib = osc();
  const filters = formants.map(() => svf());
  return render(len, (t) => {
    const x = o(f * (1 + 0.006 * vib(5.5) * Math.min(1, t * 2)));
    return filters.reduce((s, fl, k) => s + fl(x, formants[k], 8) / (k + 1), 0) * adsr(t, len, 0.08, 0.25);
  });
};

// ---------- textures ----------
const noiseSweep = (len, from, to, up = true) => {
  const b = svf();
  return render(len, (t) => {
    const p = t / len;
    const k = up ? p : 1 - p;
    return b(rand(), from * (to / from) ** k, 3) * (up ? p ** 2 : (1 - p) ** 1.5) * 2;
  });
};
const vinyl = (len = 4) => {
  const lp = lowpass();
  return render(len, (t) => lp(rand(), 3000) * 0.15 + (rand() > 0.9985 ? rand() * 0.9 : 0) * adsr(t, len, 0.2, 0.2));
};
const wind = (len = 4) => {
  const b = svf();
  return render(len, (t) => b(rand(), 400 + 300 * Math.sin(t * 1.3) + 200 * Math.sin(t * 0.37), 4) * adsr(t, len, 0.6, 0.8) * 2);
};
const rain = (len = 4) => {
  let lp = 0;
  return render(len, (t) => {
    lp += 0.08 * (rand() - lp);
    return (lp * 2.5 + (rand() > 0.9993 ? 0.8 : 0) * Math.exp(-((t * 1000) % 7))) * adsr(t, len, 0.3, 0.3);
  });
};
const impact = () => {
  const o = osc();
  const lp = lowpass();
  return render(2.5, (t) => sat(o(30 + 90 * Math.exp(-t * 8)) * env(t, 0.001, 0.8) + lp(rand(), 800) * env(t, 0.001, 0.4), 1.5));
};
const glitch = (n) =>
  render(0.5, (t) => {
    const step = Math.floor(t * 32);
    const f = 200 * 2 ** (((step * 7 + n * 5) % 24) / 6);
    const on = (step * 13 + n) % 3 !== 0;
    return on ? Math.sign(Math.sin(TAU * f * t)) * 0.5 * Math.round(Math.sin(TAU * f * 0.5 * t) * 4) / 4 : 0;
  });
const zap = () => {
  const o = osc('saw');
  return render(0.4, (t) => o(2000 * Math.exp(-t * 14) + 60) * env(t, 0.001, 0.12));
};
const swoosh = () => {
  const b = svf();
  return render(1.2, (t) => b(rand(), 300 * 20 ** Math.sin((Math.PI * t) / 1.2), 2) * Math.sin((Math.PI * t) / 1.2) ** 2 * 2);
};
const pad = (len = 4) => {
  const notes = [48, 55, 58, 62, 65];
  const oscs = notes.flatMap((m) => [0.997, 1.003].map((d) => ({ o: osc('saw'), f: mtof(m) * d })));
  const lp = lowpass();
  return render(len, (t) => lp(oscs.reduce((s, { o, f }) => s + o(f), 0) / oscs.length, 900 + 500 * Math.sin(t * 0.8)) * adsr(t, len, 0.8, 1));
};

// ---------- the pack ----------
// unpitched: arrays (index with "name:n"); pitched: { note: samples }.
// Each entry is S(data, peak): data is mono or [L, R]; peak is its level (1 = full
// scale). Quieter peaks for bright sounds keep the kit from sounding tinny.
const S = (data, peak) => ({ data, peak });
const pack = {
  // drums come from real recordings: scripts/import-drum-samples.mjs
  bass: { c2: S(bass('c2', 'saw'), 0.7) },
  sub: { c2: S(bass('c2', 'sub'), 0.75) },
  reese: { c2: S(stereo(() => bass('c2', 'reese'), 6), 0.6) },
  acid: { c2: S(bass('c2', 'acid'), 0.55) },
  pluck: { c3: S(stereo(() => pluck('c3', 1.8, 0.4)), 0.55), c4: S(stereo(() => pluck('c4', 1.4, 0.6)), 0.5) },
  bell: { c5: S(stereo(() => fm('c5', { len: 3, ratio: 3.5, index: 3, decay: 1.2, idxDecay: 0.5 }), 4), 0.4) },
  keys: { c4: S(stereo(() => keys('c4'), 4), 0.55) },
  stab: { c4: S(stereo(() => supersaw('c4', 0.5, { voices: 3, detune: 0.01, attack: 0.002, release: 0.08, cutoff: 3500, chord: [0, 3, 7, 10] }), 5), 0.45) },
  strings: { c3: S(stereo(() => supersaw('c3', 3, { voices: 5, detune: 0.014, attack: 0.5, release: 0.8, cutoff: 2200 }), 6), 0.5) },
  vox: { c4: S(stereo(() => vox('c4', 'a'), 5), 0.45) },
  pad: [S(stereo(() => pad(), 6), 0.5)],
  rain: [S(stereo(() => rain()), 0.4)],
  wind: [S(stereo(() => wind()), 0.4)],
  vinyl: [S(stereo(() => vinyl()), 0.28)],
  riser: [S(stereo(() => noiseSweep(4, 200, 8000, true)), 0.42)],
  downer: [S(stereo(() => noiseSweep(3, 8000, 150, false)), 0.42)],
  swoosh: [S(stereo(() => swoosh()), 0.4)],
  impact: [S(stereo(() => impact()), 0.7)],
  glitch: [S(glitch(1), 0.3), S(glitch(2), 0.3), S(glitch(3), 0.3)],
  zap: [S(zap(), 0.35)],
  blip: [S(render(0.25, (t) => Math.sin(TAU * mtof(84) * t) * env(t, 0.001, 0.05)), 0.3)],
};

for (const [name, variants] of Object.entries(pack)) {
  const dir = new URL(`samples/soda/${name}/`, root);
  await rm(dir, { recursive: true, force: true }); // only our own folders – drums are left alone
  await mkdir(dir, { recursive: true });
  const entries = Array.isArray(variants) ? variants.map((s, i) => [String(i), s]) : Object.entries(variants);
  for (const [file, { data, peak }] of entries) await writeFile(new URL(`${file}.wav`, dir), wav(data, peak));
}
await writeFile(
  new URL('samples/soda/pack.json', root),
  JSON.stringify(
    {
      prefix: 'soda',
      licence: 'CC0-1.0 / Unlicense',
      note: 'Tonal sounds, textures and fx synthesised by scripts/gen-demo-assets.mjs (CC0). Drums are real recordings from VCSL (CC0) and uzu-drumkit (Unlicense) – see CREDITS.md.',
    },
    null,
    1,
  ),
);

// ---------- media ----------
const W = 1080;
const H = 1920;
const svg = (stops, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>${extra}</svg>`;
const r = () => Math.abs(rand());
const lines = (n, color) =>
  Array.from({ length: n }, () => {
    const x = r() * W;
    const y = r() * H;
    return `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 30).toFixed(0)}" y2="${(y + 140).toFixed(0)}" stroke="${color}" stroke-width="3" opacity="0.5"/>`;
  }).join('');
const grid =
  Array.from({ length: 13 }, (_, i) => `<line x1="${i * 90}" y1="1100" x2="${540 + (i * 90 - 540) * 3}" y2="1920" stroke="#ff3fd0" stroke-width="3" opacity=".7"/>`).join('') +
  Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${1100 + i * i * 10}" x2="1080" y2="${1100 + i * i * 10}" stroke="#ff3fd0" stroke-width="3" opacity=".7"/>`).join('');
const stars = Array.from({ length: 220 }, () => `<rect x="${(r() * W).toFixed(0)}" y="${(r() * H * 0.8).toFixed(0)}" width="${(1 + r() * 4).toFixed(1)}" height="${(1 + r() * 4).toFixed(1)}" fill="#fff" opacity="${(0.3 + r() * 0.7).toFixed(2)}"/>`).join('');
const waves = Array.from({ length: 14 }, (_, k) => {
  const y = 900 + k * 70;
  return `<path d="M0 ${y} ${Array.from({ length: 13 }, (_, i) => `Q ${i * 90 + 45} ${y + (i % 2 ? 40 : -40)} ${(i + 1) * 90} ${y}`).join(' ')}" stroke="#7cf2c9" stroke-width="4" fill="none" opacity="${(0.15 + k * 0.05).toFixed(2)}"/>`;
}).join('');
const blocks = Array.from({ length: 40 }, () => `<rect x="${(r() * W).toFixed(0)}" y="${(r() * H).toFixed(0)}" width="${(40 + r() * 300).toFixed(0)}" height="${(40 + r() * 300).toFixed(0)}" fill="none" stroke="#fff" stroke-width="3" opacity="${(0.1 + r() * 0.4).toFixed(2)}"/>`).join('');

const media = {
  rain: svg(['#0b1630', '#1c3a6e', '#0a0f1f'], lines(160, '#9cc8ff')),
  neon: svg(['#12001f', '#3a0a5e', '#00121f'], grid + '<circle cx="540" cy="900" r="260" fill="#ff8a3d" opacity=".85"/>'),
  dusk: svg(['#ffb36b', '#e0567a', '#3b1c5a', '#0d0a1f']),
  fog: svg(['#d9dde3', '#9aa3ad', '#59626e']),
  night: svg(['#02030a', '#0a1030', '#1a1240'], stars + '<circle cx="780" cy="420" r="90" fill="#f4f1de" opacity=".9"/>'),
  sea: svg(['#04121c', '#0b3448', '#0e5a63'], waves),
  sun: svg(['#ffe29a', '#ff9a5a', '#c83d5b'], '<circle cx="540" cy="1050" r="330" fill="#fff4d6" opacity=".9"/>'),
  blocks: svg(['#101010', '#202028'], blocks),
};
await rm(new URL('media/demo/', root), { recursive: true, force: true });
await mkdir(new URL('media/demo/', root), { recursive: true });
for (const [name, content] of Object.entries(media)) await writeFile(new URL(`media/demo/${name}.svg`, root), content);
await writeFile(new URL('media/demo/pack.json', root), JSON.stringify({ licence: 'CC0-1.0', note: 'Generated by scripts/gen-demo-assets.mjs' }, null, 1));

const files = Object.values(pack).reduce((n, v) => n + (Array.isArray(v) ? v.length : Object.keys(v).length), 0);
console.log(`soda pack: ${Object.keys(pack).length} sounds, ${files} files · demo media: ${Object.keys(media).length} images`);
