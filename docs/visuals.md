# Writing a visual plugin

Visuals are the easiest place to extend soda.strudel. A plugin is one file,
one object, and it immediately works in code, in shared links, in video export
and in the Claude skill.

## The contract

```js
// src/visuals/stars.js
export default {
  name: 'stars',
  create() {
    return { stars: [] };            // per-instance state, created when visual("stars") first appears
  },
  frame(state, ctx, f) {             // every animation frame while a visual("stars") event is active
    // draw with ctx (CanvasRenderingContext2D) into f.w × f.h pixels
  },
};
```

`f` – the frame context:

| field | meaning |
|---|---|
| `w`, `h` | canvas size in pixels (export may be 1080×1920 – scale sizes by `h`) |
| `dt` | seconds since the last frame (animate with it, not with `Date.now()`) |
| `time`, `cycle` | scheduler time in cycles – use for anything musical |
| `params` | the visual event's value: `hue`, `amount`, `opacity`, … (strings/numbers) |
| `active` | audible events sounding now (`hap.value` has `s`, `note`, `gain`, …) |
| `onsets` | audible events that started this frame – trigger bursts here |
| `haps`, `drawTime` | the drawer's whole window of audible events (two cycles behind and ahead) and `[lookbehind, lookahead]` – what Strudel's painters take; the window is only open while the code names a timeline visual (`TIMELINE_VISUALS` in catalog.js) |
| `fft` | `Float32Array` of dB values from the master output |
| `wave` | `Float32Array` time-domain samples (-1..1) |
| `level` | 0..1 loudness |

The stage sets `globalAlpha` (opacity × fade) and `globalCompositeOperation`
(`blend`) before calling `frame`, and restores after. Use `ctx.save()/restore()`
around your own state changes.

## Register it

1. Add the file to `src/visuals/` and to the list in `src/visuals/index.js`.
2. Describe it in `src/soda/catalog.js › VISUALS` (description + params). The
   validator and the skill read this, so Claude can use it right away.
3. If it needs a new parameter, add the name to `SODA_CONTROLS` in the same
   file (check it doesn't collide with a Strudel control – `fit`, `size`,
   `density`, `freeze`, `layer` are taken).
4. Add a line to the visuals table in
   `claude/skills/strudel-vibe/references/multimedia.md` and run `pnpm skill`.

## Rules

- **Time from `f`, never the wall clock.** That keeps visuals in sync with the
  music and makes a future frame-stepped export possible.
- **Scale by `f.h`.** A line that is 2 px in the editor is invisible in a
  1080×1920 export.
- **Budget ~2 ms per frame** on a mid-range phone. Cap particle counts; avoid
  `getImageData` on full-resolution canvases.
- **React to music.** Use `onsets` for hits, `note` for colour or position,
  `level`/`fft` for texture. A visual that ignores the music belongs in a media file.
- **Degrade quietly.** No audio yet → `fft` is empty → draw something calm.

## Ideas waiting for an owner

- `shader` – a GLSL fragment layer with uniforms fed by params (`time`, `level`, `hue`)
- `type` – kinetic typography driven by captions and onsets
- `collage` – media tiles that swap on drum hits
- `lyrics` – word-by-word reveal synced to a melody line
- `scope3d` – Three.js / WebGPU scene
- per-orbit routing: `visual("bars").orbit(2)` reacting only to one layer

# Writing a video effector

Effectors are the picture-side twin of visuals: `.fx("vhs:kaleido")` on an
`img`, `vid` or `cam` layer runs them in order after the layer is drawn,
`.amount(0..1)` is their one knob (default .5), `.hue()` a direction for the
few that have one. They live in `src/stage/videoFx.js`, one function each:

```js
wave(ctx, src, w, h, p) {
  // src: the layer as drawn so far (a copy); ctx: the layer, cleared – draw the result
  const amp = p.amount * (w / 12);
  for (let y = 0; y < h; y += 2) ctx.drawImage(src, 0, y, w, 2, Math.sin(y * 18 / h + p.t * 3) * amp, y, w, 2);
}
```

`p` carries `amount`, `hue`, `t` (scheduler time in cycles – animate with it so
the picture moves with the music), `dt` (seconds since the last frame) and
`state`, an object kept per media layer and effect for ring buffers, feedback
frames and accumulated spin.

To add one: write the function, describe it in `VIDEO_FX` in
`src/soda/catalog.js` (the validator, the Reference page and the skill read
that; say what `amount` does), add a row to the effects table in
`claude/skills/strudel-vibe/references/multimedia.md`, then `pnpm run docs`
and `pnpm skill`. The module throws at load when a catalogued name has no
implementation, and tests/videoFx.test.js checks names never collide with
soda controls (an effect called `mirror` would read like `.mirror()`).

Rules: size everything by `h` (a 1080×1920 export must look like the editor);
read pixels only from a reduced copy (`reduced(src, w, h, 3)`), never a full
frame; draw-based effects can run at full resolution. The chain copies the
layer once per link, so three or four links are fine on a phone, ten are not.
