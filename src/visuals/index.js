// Visual plugin registry. A plugin is a plain object:
//
//   {
//     name: 'particles',
//     create(): state,                 // once, when the visual first appears
//     frame(state, ctx, f): void,      // every frame while a visual("name") event is active
//   }
//
// `f` is the frame context (see docs/visuals.md):
//   w, h        canvas size in pixels      time, cycle   from the supplied clock (never Date.now)
//   dt          seconds since last frame   params        the visual hap's value (hue, amount, opacity…)
//   active      audible haps sounding now  onsets        audible haps that started this frame
//   fft, wave   master analysis buffers     level         0..1 loudness
//
// Register new plugins here and describe them in src/soda/catalog.js (VISUALS)
// so the editor, validator and vibe skill know about them.
import particles from './particles.js';
import ribbon from './ribbon.js';
import bars from './bars.js';
import pulse from './pulse.js';
import rings from './rings.js';
import { strudelVisuals } from './strudel.js';

export const plugins = Object.fromEntries([particles, ribbon, bars, pulse, rings, ...strudelVisuals].map((p) => [p.name, p]));

