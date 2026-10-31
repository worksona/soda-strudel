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

Plugins react to **all audible layers** (onsets, pitch, loudness).

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

`aspect`: `free` (fills the screen), `9:16` (Reels/TikTok/Shorts), `1:1`, `16:9`.
`camera` is detected automatically from `cam()` / `camMotion`.
