// Synthesises the small "soda" demo sound pack and "demo" media pack so the app
// works out of the box before real packs are added. Everything here is
// generated, so it is CC0 / ours to distribute.
// Run: node scripts/gen-demo-assets.mjs
import { mkdir, writeFile } from 'node:fs/promises';

const SR = 44100;
const root = new URL('../public/', import.meta.url);

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
  return buf;
}

const render = (seconds, fn) => Array.from({ length: Math.floor(seconds * SR) }, (_, i) => fn(i / SR));
let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

const sounds = {
  kick: [
    render(0.6, (t) => Math.sin(2 * Math.PI * (45 * t + 90 * (1 - Math.exp(-t * 30)) / 30 * 1.0)) * env(t, 0.002, 0.18)),
    render(0.5, (t) => Math.tanh(2.5 * Math.sin(2 * Math.PI * (50 * t + 4 * (1 - Math.exp(-t * 40))))) * env(t, 0.001, 0.12)),
  ],
  snare: [
    render(0.4, (t) => (0.6 * rand() + 0.4 * Math.sin(2 * Math.PI * 190 * t)) * env(t, 0.001, 0.09)),
  ],
  hat: [
    render(0.12, (t) => rand() * env(t, 0.0005, 0.025) * 0.7),
    render(0.4, (t) => rand() * env(t, 0.0005, 0.12) * 0.6),
  ],
  clap: [
    render(0.35, (t) => rand() * (env(t, 0.001, 0.01) + env(Math.max(0, t - 0.012), 0.001, 0.01) + env(Math.max(0, t - 0.024), 0.001, 0.08)) * 0.5),
  ],
  bass: [
    render(1.2, (t) => Math.tanh(1.8 * (Math.sin(2 * Math.PI * mtof(36) * t) + 0.3 * Math.sin(4 * Math.PI * mtof(36) * t))) * env(t, 0.005, 0.5) * 0.8),
  ],
  pad: [
    render(3, (t) =>
      [48, 55, 58, 62].reduce((a, m, k) => a + Math.sin(2 * Math.PI * mtof(m) * t * (1 + 0.002 * k)), 0) / 4 *
        Math.min(1, t / 0.6) * Math.min(1, (3 - t) / 0.8) * 0.6,
    ),
  ],
  rain: [
    (() => {
      let lp = 0;
      return render(4, (t) => {
        lp += 0.08 * (rand() - lp);
        const drop = rand() > 0.9993 ? 0.8 : 0;
        return (lp * 2.5 + drop * Math.exp(-((t * 1000) % 7))) * Math.min(1, t / 0.3, (4 - t) / 0.3) * 0.5;
      });
    })(),
  ],
  blip: [render(0.25, (t) => Math.sin(2 * Math.PI * mtof(84) * t) * env(t, 0.001, 0.05) * 0.6)],
};

for (const [name, variants] of Object.entries(sounds)) {
  const dir = new URL(`samples/soda/${name}/`, root);
  await mkdir(dir, { recursive: true });
  for (const [i, s] of variants.entries()) await writeFile(new URL(`${i}.wav`, dir), wav(s));
}

const svg = (stops, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">${stops
  .map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`)
  .join('')}</linearGradient></defs>
<rect width="1080" height="1920" fill="url(#g)"/>${extra}</svg>`;

const lines = (n, color) =>
  Array.from({ length: n }, () => {
    const x = Math.abs(rand()) * 1080;
    const y = Math.abs(rand()) * 1920;
    return `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 30).toFixed(0)}" y2="${(y + 140).toFixed(0)}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`;
  }).join('');

const grid = Array.from({ length: 13 }, (_, i) => `<line x1="${i * 90}" y1="1100" x2="${540 + (i * 90 - 540) * 3}" y2="1920" stroke="#ff3fd0" stroke-width="3" opacity=".7"/>`).join('') +
  Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${1100 + i * i * 10}" x2="1080" y2="${1100 + i * i * 10}" stroke="#ff3fd0" stroke-width="3" opacity=".7"/>`).join('');

const media = {
  rain: svg(['#0b1630', '#1c3a6e', '#0a0f1f'], lines(160, '#9cc8ff')),
  neon: svg(['#12001f', '#3a0a5e', '#00121f'], grid + '<circle cx="540" cy="900" r="260" fill="#ff8a3d" opacity=".85"/>'),
  dusk: svg(['#ffb36b', '#e0567a', '#3b1c5a', '#0d0a1f']),
  fog: svg(['#d9dde3', '#9aa3ad', '#59626e']),
};
await mkdir(new URL('media/demo/', root), { recursive: true });
for (const [name, content] of Object.entries(media)) await writeFile(new URL(`media/demo/${name}.svg`, root), content);
console.log('demo assets written');
