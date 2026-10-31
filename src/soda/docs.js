// Reference docs for soda's own functions, in the same shape as Strudel's jsdoc
// entries so the Reference panel, editor hints and the skill treat them alike.
import { BLENDS, FX, VIDEO_FX, VISUALS } from './catalog.js';

const d = (name, description, examples = [], params = [], synonyms) => ({
  name,
  description,
  examples,
  params: params.map(([pname, type, pdesc]) => ({ name: pname, type: { names: [type] }, description: pdesc })),
  synonyms,
  tags: ['soda'],
});

export const SODA_DOCS = [
  d('img', 'Shows an image on the stage while the event is active. Names come from media packs, your Library, the sketch\'s media, or a URL.', ['$: img("<rain neon dusk>").slow(4).fade(.3)'], [['name', 'string', 'media name or image URL']]),
  d('vid', 'Plays a looping video on the stage while the event is active. Chain .speed() for playback rate.', ['$: vid("clip").speed(.5).opacity(.8)'], [['name', 'string', 'media name or video URL']]),
  d('cam', 'The live camera as a media layer (the viewer must allow the camera).', ['$: cam().mirror(1).fx("<none posterize>")'], []),
  d('camMotion', 'A continuous signal 0..1: how much movement is in front of the camera. 0 when the camera is off.', ['$: note("c2 eb2").s("sawtooth").lpf(camMotion.range(200, 4000))'], []),
  d('captions', 'One caption per cycle from a list of plain strings (single quotes). Empty string = no caption that cycle.', ["$: captions(['2:14 am', '', 'exit 9', '']).slow(2)"], [['lines', 'string[]', 'caption text per cycle']]),
  d('caption', 'A caption shown while the event is active. Use single quotes – double quotes are mini-notation.', ["$: caption('a single line').fade(.2)"], [['text', 'string', 'caption text']]),
  d('visual', `Runs a visual plugin on the stage: ${Object.keys(VISUALS).join(', ')}.`, ['$: visual("particles").hue(200).amount(.6)', '$: visual("<pulse rings>").slow(4)'], [['name', 'string', Object.entries(VISUALS).map(([k, v]) => `${k}: ${v.description}`).join(' ')]]),
  d('media', 'Registers media names, like samples() does for sounds.', ["media({ cover: 'https://example.com/cover.jpg' })", "media('soda:demo')"], [['map', 'object | string', 'name → URL map, or a pack id / manifest URL']]),
  d('opacity', 'Layer opacity 0..1 for media, visuals and captions.', ['$: img("fog").opacity(sine.range(.3, 1))'], [['amount', 'number', '0..1']]),
  d('fade', 'Fraction of each event spent fading in and out (0..0.5).', ['$: img("<sea night>").slow(2).fade(.4)'], [['amount', 'number', '0..0.5']]),
  d('blend', `How a layer mixes with what is below: ${BLENDS.join(', ')}.`, ['$: cam().blend("screen")'], [['mode', 'string', BLENDS.join(' | ')]]),
  d('fx', `Picture effect for media layers (img, vid, cam). Looks: none, grayscale, invert, blur, posterize, pixelate, edges, sepia, contrast, hue. Effectors (after Pixel Flow), strength from .amount(0..1), chained in order with ':': ${Object.entries(VIDEO_FX).map(([k, v]) => `${k} – ${v}`).join('; ')}.`, ['$: img("neon").fx("<none edges posterize>")', '$: cam().fx("vhs:kaleido").amount(sine.slow(8))', '$: vid("clip").fx("<timeslice feedback>").amount(camMotion)'], [['effect', 'string', FX.join(' | ')]]),
  d('hue', 'Colour (degrees) for visuals; on media the rotation for fx("hue") and the direction of fx("smear") / fx("rgbshift").', ['$: visual("rings").hue("<160 300>")'], [['degrees', 'number', '0..360']]),
  d('amount', 'Intensity 0..1 for visual plugins and for the fx effectors on media (default .5).', ['$: visual("particles").amount(.8)', '$: cam().fx("kaleido").amount("<.2 .6 1>")'], [['amount', 'number', '0..1']]),
  d('mirror', 'Flips a media layer horizontally (1 = on).', ['$: cam().mirror(1)'], [['on', 'number', '0 or 1']]),
  d('tint', 'Colour wash over a media layer; text colour for captions.', ['$: img("fog").tint("#ff3fd0")'], [['color', 'string', 'CSS colour']]),
  d('still', 'Freezes the current frame of a video or the camera while 1.', ['$: cam().still("<0 1>")'], [['on', 'number', '0 or 1']]),
  d('pos', 'Vertical focus 0 (top) .. 1 (bottom) when a media layer is cropped to fill.', ['$: img("sun").pos(.3)'], [['focus', 'number', '0..1']]),
];
