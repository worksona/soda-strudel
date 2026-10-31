// Strudel's audio effects, read as picture effects. A media layer (img / vid /
// cam) makes no sound, so chaining .lpf() or .room() on it would be silent
// anyway – instead the stage gives each effect the analogous visual meaning.
// One chain can then shape a sound and its picture together:
//
//   const dub = x => x.lpf(sine.range(300, 4000).slow(8)).room(.7).delay(.4)
//   $: dub(note("<c2 eb2>").s("bass").bank("soda"))
//   $: dub(img("<rain neon>").slow(4))
//
// Pure (no DOM): the validator, tests and the skill can import it.

/** Which Strudel controls the stage understands on media layers, and what they do there. */
export const PICTURE_FX = {
  lpf: 'blur – a low cutoff softens the picture, 8000 Hz and up is sharp',
  hpf: 'outlines – the higher the cutoff, the more the picture becomes edges',
  room: 'glow – a soft bloom, 0..1',
  roomsize: 'how wide the glow spreads (default 2)',
  delay: 'echo – how much of the previous frames stays, 0..1',
  delayfeedback: 'echo decay – how slowly the echo fades, 0..1 (default .5)',
  delaytime: 'echo spacing in seconds (default .25)',
  crush: 'posterize – bits per colour channel, 1..8',
  coarse: 'pixelate – pixels per block, 1..64',
  distort: 'contrast and saturation, 0..1 and beyond',
  pan: 'horizontal position of the crop, 0 (left) .. 1 (right)',
  gain: 'brightness, 1 = as is',
};
export const PICTURE_FX_NAMES = Object.keys(PICTURE_FX);
// Strudel stores .lpf() as `cutoff` and .hpf() as `hcutoff` on the event value.
const VALUE_KEYS = [...PICTURE_FX_NAMES, 'cutoff', 'hcutoff'];

const num = (x, fallback) => {
  if (x === undefined || x === null) return fallback;
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
};
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/**
 * Reads the picture effects out of a media event's value. `h` is the canvas
 * height in pixels, so blur and glow scale with the output size. Returns null
 * when the value carries none of them (the common case – no extra work).
 */
export function pictureFx(v, h = 1000) {
  if (!v || !VALUE_KEYS.some((k) => v[k] !== undefined)) return null;
  const lpf = num(v.cutoff ?? v.lpf, Infinity);
  const hpf = num(v.hcutoff ?? v.hpf, 0);
  const room = clamp(num(v.room, 0), 0, 1);
  const roomsize = clamp(num(v.roomsize, 2), 0.1, 10);
  const delay = clamp(num(v.delay, 0), 0, 1);
  const delayfeedback = clamp(num(v.delayfeedback, 0.5), 0, 0.98);
  const delaytime = clamp(num(v.delaytime, 0.25), 0.02, 4);
  const crush = v.crush === undefined ? null : clamp(Math.round(num(v.crush, 8)), 1, 8);
  const coarse = v.coarse === undefined ? null : clamp(Math.round(num(v.coarse, 1)), 1, 64);
  const distort = clamp(num(v.distort, 0), 0, 4);
  const pan = v.pan === undefined ? null : clamp(num(v.pan, 0.5), 0, 1);
  const gain = clamp(num(v.gain, 1), 0, 4);

  // cutoff → blur: logarithmic from 8 kHz (none) down to 100 Hz (very soft)
  const blur = lpf >= 8000 ? 0 : clamp(Math.log2(8000 / Math.max(100, lpf)) / Math.log2(80), 0, 1);
  // hpf → outlines: 200 Hz starts, 4 kHz is all edges
  const outlines = hpf <= 200 ? 0 : clamp(Math.log2(hpf / 200) / Math.log2(20), 0, 1);
  return {
    blurPx: blur * (h / 30),
    outlines,
    glow: room,
    glowPx: (h / 60) * (roomsize / 2),
    echo: delay,
    /** fraction of the echo that survives `dt` seconds */
    echoRetain: (dt) => (delay ? Math.pow(delayfeedback, dt / delaytime) : 0),
    levels: crush === null ? null : Math.pow(2, crush),
    pixel: coarse === null || coarse <= 1 ? null : coarse,
    contrast: 1 + distort * 1.5,
    saturate: 1 + distort * 0.6,
    brightness: gain,
    pan,
  };
}

/** The CSS filter string for the cheap effects, or '' when none apply. */
export function pictureFilter(p) {
  if (!p) return '';
  const parts = [];
  if (p.blurPx > 0.3) parts.push(`blur(${p.blurPx.toFixed(1)}px)`);
  if (p.contrast !== 1) parts.push(`contrast(${p.contrast.toFixed(2)}) saturate(${p.saturate.toFixed(2)})`);
  if (p.brightness !== 1) parts.push(`brightness(${p.brightness.toFixed(2)})`);
  return parts.join(' ');
}
