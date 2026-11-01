# soda multimedia

In soda-strudel, pictures, the camera, captions and visuals are **patterns**:
sequence them exactly like sounds. They never make sound themselves.

The stage draws layers bottom → top: Hydra · media (img/vid/cam) · visuals ·
Strudel painters · captions. Everything lands on one canvas, so video export
captures all of it.

## Media

```js
$: img("<rain neon dusk fog>").slow(4).fade(.3)     // a new image every 4 cycles
$: vid("<clip1 clip2>").slow(8).speed(.5)          // video loops, playback rate
$: img("https://example.com/cover.jpg")            // direct URL works too (must allow CORS)
```

Register names (like `samples()` for sounds):

```js
media({ cover: 'https://example.com/cover.jpg', loop: 'https://example.com/loop.mp4' })
media('soda:demo')          // hosted pack (loaded automatically)
```

Or put `"media": { "cover": "https://…" }` in the sketch JSON – preferred, the
validator knows about those names.

## Camera

```js
$: cam().mirror(1).opacity(.8)                     // live camera, selfie-mirrored
$: cam().fx("<none posterize edges pixelate>")     // effect changes every cycle
$: cam().fx("vhs:kaleido").amount(camMotion)       // video effectors chained, strength from movement
$: cam().still("<0 1>")                            // freeze-frame every other cycle
$: note("c2 eb2").s("sawtooth").lpf(camMotion.range(200, 4000))   // movement opens the filter
```

`camMotion` is 0..1 movement in front of the camera (0 when the camera is off).
`micLevel` is 0..1 loudness at the microphone (Input › Microphone; 0 when it is
off) – `visual("rings").amount(micLevel)`, `.gain(micLevel.range(.4, 1))`.
Viewers choose "Play with camera / microphone" or "Play without"; pieces must
still work without them.

## Captions

```js
$: captions(['2:14 am', '', 'exit 9', '']).slow(2)   // one per cycle, '' = nothing
$: caption('a single line').fade(.2)                 // one caption, whole cycle
```

Single quotes only. Captions sit in the lower-middle of the frame, clear of
social-app UI, wrap automatically, and fade in/out (`.fade(...)`).

## Visual plugins

```js
$: visual("particles").hue(200).amount(.6)
$: visual("<pulse rings>").slow(4).hue(330)
```

| name | what it does |
|---|---|
| `particles` | every sound onset bursts particles; colour from pitch |
| `ribbon` | flowing waveform ribbon from the master output |
| `bars` | spectrum bars |
| `pulse` | full-frame colour flash on onsets – beat strobe |
| `rings` | rings expanding from the centre on onsets, speed by pitch |
| `punchcard` | Strudel's punchcard: every layer as scrolling blocks, playhead in the middle |
| `pianoroll` | Strudel's pianoroll: notes on a pitch axis; `.amount(.2)` turns it vertical for 9:16 |
| `wordfall` | Strudel's wordfall: event names fall down the stage in time |
| `spiral` | Strudel's spiral: one turn per cycle, lit as it plays; `.amount()` = size |
| `pitchwheel` | Strudel's pitchwheel: sounding notes on a circle of pitch; `.amount()` = line weight |
| `scope` | oscilloscope of the mix, full width; `.amount()` = height |
| `spectrum` | scrolling spectrogram of the mix, pitch bottom to top; `.amount()` = speed |

Plugins react to **all audible layers** (onsets, pitch, loudness) and fill the
stage. The Strudel ones are the same animations Strudel chains onto a single
pattern (`.punchcard()`, `.spiral()`…), here as full-screen visuals showing
every layer, with `hue`, `amount`, `opacity`, `blend` and `fade` like the rest.
Prefer `visual("punchcard")` over `.punchcard()` in sketches: it layers with
media and captions and exports. Timeline visuals (punchcard, pianoroll,
wordfall, spiral) look at two cycles ahead and behind.

## Parameters (media, visuals, captions)

| param | values | applies to |
|---|---|---|
| `.opacity(x)` | 0..1 | all |
| `.fade(x)` | 0..0.5 – fraction of the event spent fading in and out | all |
| `.blend("screen")` | `normal screen multiply overlay lighter difference soft-light` | media, visuals |
| `.fx("posterize")` | a look: `none grayscale invert blur posterize pixelate edges sepia contrast hue` – or effectors, see below | media |
| `.hue(210)` | degrees – visual colour; on media the rotation for `fx("hue")` and the direction of `smear` / `rgbshift` | visuals, media |
| `.amount(.6)` | 0..1 intensity – of a visual, or of the fx effectors on media (default .5) | visuals, media |
| `.mirror(1)` | flip horizontally | media |
| `.tint("#ff3fd0")` | colour wash (also caption colour) | media, captions |
| `.still(1)` | freeze the current frame | vid, cam |
| `.pos(.3)` | vertical focus 0 (top) .. 1 (bottom) when cropping | media |
| `.speed(x)` | video playback rate | vid |

All accept patterns: `.opacity(sine.range(.3, 1))`, `.fx("<none edges>")`.

## Video effectors (after Pixel Flow)

Beyond the looks, `.fx()` takes **effectors**: picture processors with one knob,
`.amount(0..1)`. Chain them in order with `:` – `fx("vhs:kaleido")` is VHS,
then kaleidoscope – and sequence them like anything else:
`fx("<kaleido timeslice vhs:rgbshift>")`. They are made for the camera (and
work on `img` / `vid` too):

| effector | what it does · what `amount` sets |
|---|---|
| `kaleido` | mirrored wedges around the centre, slowly spinning · how many (2..10) |
| `symmetry` | one half mirrored onto the other, a face becomes two · where the seam is |
| `mosaic` | tiles that drift and jitter · how many, how far |
| `slice` | vertical strips sliding in a wave · how far |
| `wave` | rows swaying like heat haze · how far |
| `twist` | the centre twisted into a spiral · how much (.5 = straight) |
| `ripple` | rings breathing out from the centre · depth |
| `melt` | columns dripping by brightness · how far |
| `smear` | motion smear · length; `hue` = angle |
| `rgbshift` | red and blue pulled apart · distance; `hue` = angle |
| `glitch` | torn rectangles, new every eighth · how far |
| `vhs` | tracking noise, tearing, dropouts · how bad |
| `sort` | pixel sort – bright runs become streaks · threshold |
| `dither` | ordered dither like an old screen · levels (2..6) |
| `halftone` | dots on black sized by brightness · dot size |
| `ascii` | the picture as characters · character size |
| `scanlines` | bright wobbling lines · wobble |
| `solarize` | bright parts inverted · threshold |
| `threshold` | pure black and white · the cut-off |
| `timeslice` | slit-scan: each strip from a different moment · how far back |
| `feedback` | the last frame zoomed and turned under the new one · zoom and spin |

```js
$: cam().mirror(1).fx("<kaleido timeslice vhs:rgbshift feedback>").amount(camMotion.range(.2, .9))
$: vid("clip").fx("glitch:scanlines").amount("<.2 .8>")       // strength per cycle
$: img("neon").fx("sort").amount(sine.slow(8)).hue(90)          // sweep the threshold
```

Tips: `timeslice` and `feedback` want a moving picture (camera, video, a
panning `img`); on a still image they do nothing or just bloom. Keep chains to
two or three links on phones – each link copies the frame. `hue` on `smear`
and `rgbshift` is an angle in degrees, so `.hue(saw.range(0, 360).slow(8))`
turns the smear.

## Audio effects on pictures

Strudel's effect controls mean the analogous thing on a media layer (`img`,
`vid`, `cam`). A media layer makes no sound, so nothing is heard – the picture
wears the effect instead. Use the same names you already use on sounds:

| control | on a picture |
|---|---|
| `.lpf(hz)` | blur – low cutoff = soft, 8000 and up = sharp |
| `.hpf(hz)` | outlines – 200 starts, 4000 is all edges |
| `.room(x)` `.roomsize(n)` | glow (0..1) and how wide it spreads (default 2) |
| `.delay(x)` `.delayfeedback(x)` `.delaytime(s)` | echo: previous frames linger (0..1), how slowly they fade, spacing in seconds |
| `.crush(bits)` | posterize, 1..8 bits per channel |
| `.coarse(n)` | pixelate, n pixels per block |
| `.distort(x)` | contrast and saturation |
| `.pan(x)` | horizontal position of the crop, 0 left .. 1 right |
| `.gain(x)` | brightness, 1 = as is |

The point is one chain for sound and picture – they then move together:

```js
const dub = x => x.lpf(sine.range(300, 6000).slow(8)).room(.7).delay(.4).delayfeedback(.6)
$: dub(note("<c2 eb2>").s("bass").bank("soda").gain(.5))
$: dub(img("<rain neon>").slow(4))
$: cam().hpf("<0 800 3000>").coarse("<1 8 24>")      // camera: outlines and blocks per cycle
$: img("fog").pan(camMotion.range(.2, .8)).crush(3)  // movement slides the crop
```

Echoes only show when the picture changes (a new image, camera motion, a
moving `pan`); a still picture with `.delay()` looks the same. Glow and blur
cost a little on phones – one or two effected layers is plenty.

## Sketch JSON

```json
{
  "title": "Rain Drive",
  "by": "optional author",
  "aspect": "9:16",
  "view": "code",
  "guide": true,
  "media": { "cover": "https://…/cover.jpg" },
  "code": "…"
}
```

`aspect` is the **export frame**: `9:16` (Reels/TikTok/Shorts), `1:1`, `16:9`, or
`free` (follows the device: portrait → 9:16, else 16:9). On screen the stage always
fills the window, so compose for any shape; keep captions and the subject near
the centre when the piece is meant for 9:16.
`view` is how the link opens: `stage` (default – the piece fills the screen,
tap to play / stop), `code` (the code playing over the stage, like strudel.cc –
good for teaching or showing off a pattern) or `full` (Play goes straight to
full screen). `guide: true` outlines the export frame.
`camera` is detected automatically from `cam()` / `camMotion`.

## Exporting video

Export (next to Record in the top bar) opens a quick recorder over the stage:
**Video + sound** or **Sound only** (lossless WAV). The gear sets the frame
(the sketch's `aspect`), size, length (until you stop, or 4–64 cycles) and
"start on the next cycle" so clips loop cleanly. The live microphone is
recorded when Input › Microphone is on. Finished clips are kept in
Settings › Exports.

The video records **the view you are in**: with View › Code over the stage
(or a link opened with `view: "code"`) the code layer is in the video as it is
on screen – syntax colours, playing notes outlined, sliders and inline visuals
like `._pianoroll()` – top left, sized to the frame. Stage only records the
stage alone. So for a teaching or show-off clip, suggest `view: "code"`; for a
clean music video, the default stage. Keep big visuals clear of the top left
when the code will be over them.
