// Pure data shared by the app, the build scripts and the vibe skill's validator.
// Keep it free of DOM / browser imports.

export const SYNTH_SOUNDS = [
  'triangle', 'tri', 'square', 'sqr', 'sawtooth', 'saw', 'sine', 'sin', 'user', 'one',
  'sbd', 'supersaw', 'bytebeat', 'pulse', 'bus',
  'pink', 'white', 'brown', 'crackle',
  'zzfx', 'z_sine', 'z_sawtooth', 'z_triangle', 'z_square', 'z_tan', 'z_noise',
];

// Visual plugins: name -> description and the params they read from the hap value.
// Every param is a soda control usable as a pattern method, e.g. visual("particles").hue(200).amount(.6)
export const VISUALS = {
  particles: { description: 'Every sound onset bursts particles; colour from note, size from gain.', params: ['hue', 'amount', 'opacity'] },
  ribbon: { description: 'Flowing waveform ribbon from the master output.', params: ['hue', 'amount', 'opacity'] },
  bars: { description: 'Spectrum bars from the master output.', params: ['hue', 'amount', 'opacity'] },
  pulse: { description: 'Full-frame colour flash on onsets – a beat strobe that stays tasteful.', params: ['hue', 'amount', 'opacity'] },
  rings: { description: 'Concentric rings expanding from the centre on each onset, radius by pitch.', params: ['hue', 'amount', 'opacity'] },
  // Strudel's own animations (src/visuals/strudel.js), showing every audible layer across the full stage
  punchcard: { description: "Strudel's punchcard: every audible layer as scrolling blocks, one row per sound or note, playhead in the middle.", params: ['hue', 'opacity'] },
  pianoroll: { description: "Strudel's pianoroll: notes on a pitch axis scrolling past the playhead; amount below .5 turns it vertical (phones).", params: ['hue', 'amount', 'opacity'] },
  wordfall: { description: "Strudel's wordfall: event names fall down the stage in time.", params: ['hue', 'opacity'] },
  spiral: { description: "Strudel's spiral: the cycle as a spiral, one turn per cycle, lit as it plays; amount sets the size.", params: ['hue', 'amount', 'opacity'] },
  pitchwheel: { description: "Strudel's pitchwheel: sounding notes as points on a circle of pitch; amount sets line weight.", params: ['amount', 'opacity'] },
  scope: { description: 'Oscilloscope of the master output across the full width; amount sets the height.', params: ['hue', 'amount', 'opacity'] },
  spectrum: { description: 'Scrolling spectrogram of the master output, pitch bottom to top; amount sets speed.', params: ['hue', 'amount', 'opacity'] },
};
/** Visuals that need the drawer's time window (haps before and after now), not just the present moment. */
export const TIMELINE_VISUALS = ['punchcard', 'pianoroll', 'wordfall', 'spiral'];

// Picture effects for media layers (img / vid / cam). The first ten are the
// original one-look effects; VIDEO_FX are the effectors after Pixel Flow
// (pixel-flow.atomic47.co) – `.amount(0..1)` sets their strength, `.hue()`
// steers the ones that have a direction. Chain them with ':' in order:
// cam().fx("vhs:kaleido").amount(.6)
export const VIDEO_FX = {
  kaleido: 'kaleidoscope – mirrored wedges around the centre, slowly spinning; amount = how many (2..10)',
  symmetry: 'one half of the picture mirrored onto the other, a face becomes two; amount slides the seam',
  mosaic: 'the picture cut into tiles that drift and jitter; amount = how many and how far',
  slice: 'vertical strips sliding up and down in a wave; amount = how far',
  wave: 'rows swaying sideways like heat haze; amount = how far',
  twist: 'the centre twisted into a spiral; amount = how much (.5 is straight)',
  ripple: 'rings breathing out from the centre like water; amount = depth',
  melt: 'columns dripping down by their brightness; amount = how far',
  smear: 'motion smear in one direction; amount = length, hue = angle in degrees',
  rgbshift: 'red and blue pulled apart, 3D-glasses style; amount = distance, hue = angle',
  glitch: 'rectangles torn out and shifted, changing every beat; amount = how far',
  vhs: 'tracking noise, line tearing and dropouts like a worn tape; amount = how bad',
  sort: 'pixel sort – bright runs of each row sorted into streaks; amount = threshold',
  dither: 'ordered dither to a few levels, like an old screen; amount = levels (2..6)',
  halftone: 'dots on black sized by brightness, newsprint style; amount = dot size',
  ascii: 'the picture as characters; amount = character size',
  scanlines: 'bright wobbling lines across the picture; amount = wobble',
  solarize: 'bright parts inverted, the Man Ray look; amount = threshold',
  threshold: 'pure black and white; amount = the cut-off',
  timeslice: 'slit-scan: each strip from a different moment, movement smears in time; amount = how far back',
  feedback: 'video feedback – the last frame zoomed and turned under the new one; amount = zoom and spin',
};
export const FX = ['none', 'grayscale', 'invert', 'blur', 'posterize', 'pixelate', 'edges', 'sepia', 'contrast', 'hue', ...Object.keys(VIDEO_FX)];
/** The effect names of an fx value: a name, or a chain ("vhs:kaleido" – mini-notation hands it over as an array). */
export const fxChain = (fx) => (fx === undefined || fx === null ? [] : [fx].flat().map(String).filter((n) => n && n !== 'none'));
export const BLENDS = ['normal', 'screen', 'multiply', 'overlay', 'lighter', 'difference', 'soft-light'];
export const ASPECTS = { free: null, '9:16': [1080, 1920], '1:1': [1080, 1080], '16:9': [1920, 1080] };
/**
 * The export frame for a sketch. On screen the stage always fills the window;
 * `aspect` only says what shape an export (and the crop guide) should have.
 * A sketch without one ('free') follows the device: portrait → 9:16, else 16:9.
 */
export const frameFor = (aspect, portrait) => (ASPECTS[aspect] ? aspect : portrait ? '9:16' : '16:9');

// Hap value keys that mean "this event is visual, don't send it to the audio engine".
export const MEDIA_KEYS = ['img', 'vid', 'cam', 'caption', 'visual'];
export const SODA_CONTROLS = [
  'img', 'vid', 'caption', 'visual', 'blend', 'fade', 'fx', 'hue', 'mirror', 'opacity', 'tint', 'still', 'amount', 'pos',
];

export const isMediaOnly = (value) =>
  value && typeof value === 'object' && MEDIA_KEYS.some((k) => value[k] !== undefined) && value.s === undefined && value.note === undefined;
