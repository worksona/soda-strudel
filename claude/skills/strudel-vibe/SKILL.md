---
name: strudel-vibe
description: Turn a mood, story, image or description into a playable soda.strudel sketch – live-coded music (Strudel) plus images, camera, captions and visuals – and return a shareable link. Use when someone asks to "vibe" music, make a beat/track/loop/soundtrack, set a poem or story to music, make a music visual or social clip, or continue/refine a soda.strudel or Strudel sketch (including a pasted "Copy for Claude" block or a soda link).
---

# strudel-vibe

You compose **sketches** for soda.strudel: Strudel code where music, media,
captions and visuals are all patterns. A sketch travels as a link
(`https://<site>/#z=…`) that plays in any browser – no account, no upload.

## Workflow

1. **Read the vibe.** Mood, energy, tempo, genre, story, and where it will be
   seen. Don't interrogate: make sensible choices and say what you chose.
   - Social clip → `aspect: "9:16"` and 8–16 cycles that loop well.
   - Story / poem → captions carry the words; music follows the arc.
   - No tempo given → pick one that fits (see references/strudel.md › Tempo).
2. **Pick sounds that exist.** Run `node scripts/soda.mjs sounds <word>` (e.g.
   `909`, `piano`, `soda`) to search. Prefer the `soda` pack and Strudel's
   default banks. Synths (`sawtooth`, `supersaw`, `triangle`, `sine`, `square`,
   `pulse`) and `gm_*` soundfonts always work.
   The **soda pack** (`.bank("soda")`):
   - drums – real recordings (even variations electronic, odd acoustic):
     `kick`(0–3) `snare`(0–2) `clap`(0–1) `rim`(0–1) `hat`(0–1) `openhat`(0–1)
     `ride`(0–1) `crash`(0–1) `tom`(0 low–2 high) `shaker`(0–1) `cowbell` `clave`
     `perc`(0 woodblock, 1 agogo, 2 triangle) `tamb`(0–1) `conga`(0–1) `bongo`(0–1) `cajon`(0 bass, 1 slap)
   - pitched – always with `note()`/`n().scale()`: `bass` `sub` `reese` `acid`
     `pluck` `bell` `keys` `stab` `strings` `vox`
   - textures / fx: `pad` `rain` `wind` `vinyl` `riser` `downer` `swoosh`
     `impact` `glitch`(0–2) `zap` `blip`
   Pick variations with `s("kick:2")`.
   **GitHub libraries** add more: put `samples('github:user/repo')` on the first
   line and use their names. Good ones: `tidalcycles/dirt-samples` (classic Tidal
   set: 808, 909, breaks, voices), `yaxu/clean-breaks` (funk breaks – `amen`,
   `apache`, `think`… chop with `.loopAt(2).chop(8)`), `eddyflux/crate` (congas,
   bongos, djembe), `mot4i/garden`, `bubobubobubobubo/dough-fox`, `yaxu/spicule`.
   The validator fetches them, so their names check out.
3. **Pick visuals and media.** `node scripts/soda.mjs media` lists media pack
   items (demo: `rain neon dusk fog night sea sun blocks`), visual plugins, fx
   and blends. Use only those names, or add public
   image/video URLs under the sketch's `media` field.
4. **Write the sketch** as JSON to a temp file:
   ```json
   { "title": "Rain Drive", "aspect": "9:16", "code": "setcps(.45)\n$: s(\"kick*2\").bank(\"soda\")\n…" }
   ```
5. **Validate and link:** `node scripts/soda.mjs link /tmp/sketch.json`.
   It evaluates the code with Strudel's real engine (no audio), checks the
   first 8 cycles, and prints `{ ok, errors, warnings, stats, link }`.
   Fix every error. Fix warnings about unknown sounds/media unless the user said
   they have them in their own library. Re-run until `ok` (at most ~3 tries).
6. **Reply** with: the link, the title, 2–3 lines on what you made (sound +
   picture + story), the code in a ```js block (people paste it into the
   editor), and one or two specific ideas for the next iteration.

Run scripts from this skill's directory. They need Node 18+ and nothing else.
If Node isn't available, write carefully against the references and give the
code without a link, saying it wasn't validated.

## Refining

- "Darker", "more swing", "slower build"… → change the code, re-validate,
  return a new link. Keep the parts the user liked.
- A pasted **Copy for Claude** block contains the current code, last error and
  the user's own sound/media names (those exist only in their browser – you may
  use them; the validator will warn, that's expected).
- A pasted soda link → `node scripts/soda.mjs decode "<link>"` to get the code.

## Craft notes

**Mix for width and depth – this is what separates rich from tinny:**
- **Real instruments first**: `gm_*` soundfonts (e.g. `gm_epiano1`,
  `gm_acoustic_guitar_nylon:1`, `gm_string_ensemble_1`, `gm_cello`), sampled kits
  (`.bank("RolandTR909")`, `"BossDR110"`), Strudel's piano. Use synths for bass,
  acid and pads.
- **Width**: double melodic layers left/right a moment apart –
  `.layer(x => x.pan(.2), x => x.pan(.8).late(1/32))` – and move hats/percussion
  with `.pan(sine.range(.3, .7))`. Keep kick, snare and bass centred.
- **Depth**: `.room(.3–1)` on almost everything (more for pads/strings,
  less for drums), `.roomsize(4–8)` for big spaces, `.delay(.25).delayfeedback(.3–.45)`
  on leads.
- **EQ**: `.lpf(1500–5000)` on drums and bright synths, `.hpf(150–300)` on
  anything that isn't bass. Nothing should hiss.
- **Level**: gains .2–.6 for most layers, ≤ .85 for the kick; the mix gets
  loud fast.
- **Feel**: `.late(1/64)` or `.swingBy(1/6, 4)` loosens a part.

- Layer with `$:` blocks: drums, bass, harmony, texture, then picture:
  media → visual → captions. 4–7 sound layers is plenty; phones struggle past ~10.
- Make it move: `<…>` alternation, `.slow()`, signals (`sine.range(...)`,
  `perlin`), `.sometimesBy`, `.every`/`.firstOf`, filter sweeps. Static loops
  feel dead after two cycles.
- **Audio effects work on pictures** (see references/multimedia.md › Audio
  effects on pictures): on `img`/`vid`/`cam`, `.lpf()` blurs, `.hpf()` draws
  outlines, `.room()` glows, `.delay()` echoes, `.crush()` posterizes,
  `.coarse()` pixelates, `.pan()` slides the crop, `.gain()` brightens. The
  strongest move is **one chain for a sound and its picture**:
  `const dub = x => x.lpf(sine.range(300, 6000).slow(8)).room(.7)` then
  `$: dub(note(...).s("bass"))` and `$: dub(img("<rain neon>").slow(4))` –
  the filter that opens the bass sharpens the image. Prefer this over
  `.fx("blur")` when the sound has the same effect; keep `.fx()` for looks
  with no audio twin (grayscale, invert, sepia, hue).
- **Dancefloor genres** (recipes › Dancefloor genres): genre is tempo + kick +
  bass + how much reverb. Sine kicks with `penv/pdecay`, ladder-filtered saw
  bass, a pad on `.orbit(2)` ducked by a silent `s("bd*4").duckorbit(2).gain(0)`,
  and `arrange()` for build → breakdown → drop. Hydra backgrounds: recipes ›
  Hydra patterns (kaleid, feedback, pixelate, camera) – one `.out()` per sketch.
- Tie picture to sound: change images on the same cycle grid as chord changes
  (`img("<a b>").slow(4)` with `chord("<…>").slow(4)` or note changes), use
  `visual("pulse")` or `rings` for drums, `ribbon`/`bars` for texture,
  `punchcard`/`pianoroll`/`spiral` when the piece is about the pattern itself
  (studies, tutorials, polyrhythms), `scope`/`spectrum` for sound-design pieces.
- **Tell stories in chapters** with `arrange([cycles, stack(...)], …)`: each
  chapter stacks its music, picture, visual and captions, so they all turn the
  page together (see recipes › Postcard). A chapter of N cycles shows N captions.
- Captions are **single-quoted** strings: `captions(['line one', '', 'line two'])`
  (one per cycle, `''` = no text). Double quotes would be parsed as mini-notation.
- Keep gain sane (most layers `.gain(.3–.8)`), add `.room()` / `.delay()` for space.
- Camera pieces (`cam()`, `camMotion`) ask the viewer for permission and fall
  back gracefully; mention that in your reply. Give the camera a **video
  effector chain** (multimedia.md › Video effectors): `cam().mirror(1)
  .fx("<kaleido timeslice vhs:rgbshift>").amount(camMotion.range(.2, .9))` –
  one look per bar, strength from movement. `timeslice`, `feedback`, `kaleido`
  and `symmetry` are the camera's best friends; `glitch`/`vhs` suit breaks.

## References

- `references/strudel.md` – Strudel essentials: mini-notation, sounds, effects, tonal, time, gotchas
- `references/functions.md` – every Strudel + soda function, one line each (generated from Strudel's own docs) – grep it when unsure a function exists or what it's called
- `references/multimedia.md` – soda's media, camera, caption and visual functions
- `references/recipes.md` – complete example sketches by mood
- `sounds.json`, `media.json` – the catalogues the validator uses
- `config.json` – `siteUrl` the links point at (override with `--site` or `SODA_SITE_URL`)
