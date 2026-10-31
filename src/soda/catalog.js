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

export const FX = ['none', 'grayscale', 'invert', 'blur', 'posterize', 'pixelate', 'edges', 'sepia', 'contrast', 'hue'];
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
