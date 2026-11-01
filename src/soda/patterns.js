// soda's multimedia vocabulary for Strudel. Media, captions and visuals are
// patterns, sequenced exactly like sounds:
//
//   $: img("<rain neon>").slow(4).fade(.5)
//   $: captions(['2:14 am', '', 'exit 9', '']).slow(2)
//   $: cam().mirror(1).fx("<none posterize>").blend("screen")
//   $: visual("particles").hue(210)
//   $: note("c2 eb2").s("saw").lpf(camMotion.range(200, 4000))
//
// This module is pure (no DOM) so the vibe skill's validator can run it in Node.
import { registerControl, signal, pure, slowcat, silence } from '@strudel/core';
import { SODA_CONTROLS } from './catalog.js';
import { registerMedia, loadMediaPack } from './mediaRegistry.js';

const controls = Object.assign({}, ...SODA_CONTROLS.map((name) => registerControl(name)));

export const { img, vid, caption, visual, blend, fade, fx, hue, mirror, opacity, tint, still, amount, pos } = controls;

/**
 * One caption per cycle; '' leaves a cycle without text. Mini-notation can't hold
 * spaces inside a step, so multi-word captions use this (or caption('single line')).
 *   captions(['2:14 am', '', 'exit 9']).slow(2)
 */
export const captions = (lines) => slowcat(...lines.map((l) => (l ? pure({ caption: l }) : silence)));

/** The live camera as a media layer. Chain like any media: cam().mirror(1).fx("edges") */
export const cam = (id = 'live') => pure({ cam: id });

let motionSource = () => 0;
export const setCamMotionSource = (fn) => {
  motionSource = fn;
};
/** 0..1 amount of movement in front of the camera. Continuous, like sine. */
export const camMotion = signal(() => motionSource());

let micSource = () => 0;
export const setMicLevelSource = (fn) => {
  micSource = fn;
};
/** 0..1 loudness at the microphone (Input › Microphone). Continuous, like sine. */
export const micLevel = signal(() => micSource());

/**
 * Register media names, like samples() does for sounds.
 *   media({ cover: 'https://example.com/cover.jpg', clip: 'https://example.com/loop.mp4' })
 *   media('soda:demo')            // a hosted pack from /media/demo/media.json
 *   media('https://…/media.json') // any manifest with { name: { url, type } }
 */
export function media(arg) {
  if (typeof arg === 'string') return loadMediaPack(arg);
  for (const [name, url] of Object.entries(arg ?? {})) registerMedia(name, url);
  return Promise.resolve();
}

export const sodaScope = { ...controls, captions, cam, camMotion, micLevel, media };
