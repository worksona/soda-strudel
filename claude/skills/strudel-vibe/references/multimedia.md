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
$: cam().still("<0 1>")                            // freeze-frame every other cycle
$: note("c2 eb2").s("sawtooth").lpf(camMotion.range(200, 4000))   // movement opens the filter
```

`camMotion` is 0..1 movement in front of the camera (0 when the camera is off).
Viewers choose "Play with camera" or "Play without"; pieces must still work
without it.

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
| `.fx("posterize")` | `none grayscale invert blur posterize pixelate edges sepia contrast hue` | media |
| `.hue(210)` | degrees – visual colour, or the rotation for `fx("hue")` | visuals, media |
| `.amount(.6)` | 0..1 intensity | visuals |
| `.mirror(1)` | flip horizontally | media |
| `.tint("#ff3fd0")` | colour wash (also caption colour) | media, captions |
| `.still(1)` | freeze the current frame | vid, cam |
| `.pos(.3)` | vertical focus 0 (top) .. 1 (bottom) when cropping | media |
| `.speed(x)` | video playback rate | vid |

All accept patterns: `.opacity(sine.range(.3, 1))`, `.fx("<none edges>")`.

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
  "media": { "cover": "https://…/cover.jpg" },
  "code": "…"
}
```

`aspect` is the **export frame**: `9:16` (Reels/TikTok/Shorts), `1:1`, `16:9`, or
`free` (follows the device: portrait → 9:16, else 16:9). On screen the stage always
fills the window, so compose for any shape; keep captions and the subject near
the centre when the piece is meant for 9:16.
`camera` is detected automatically from `cam()` / `camMotion`.
