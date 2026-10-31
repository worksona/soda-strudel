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
};

export const FX = ['none', 'grayscale', 'invert', 'blur', 'posterize', 'pixelate', 'edges', 'sepia', 'contrast', 'hue'];
export const BLENDS = ['normal', 'screen', 'multiply', 'overlay', 'lighter', 'difference', 'soft-light'];
export const ASPECTS = { free: null, '9:16': [1080, 1920], '1:1': [1080, 1080], '16:9': [1920, 1080] };

// Hap value keys that mean "this event is visual, don't send it to the audio engine".
export const MEDIA_KEYS = ['img', 'vid', 'cam', 'caption', 'visual'];
export const SODA_CONTROLS = [
  'img', 'vid', 'caption', 'visual', 'blend', 'fade', 'fx', 'hue', 'mirror', 'opacity', 'tint', 'still', 'amount', 'pos',
];

export const isMediaOnly = (value) =>
  value && typeof value === 'object' && MEDIA_KEYS.some((k) => value[k] !== undefined) && value.s === undefined && value.note === undefined;
