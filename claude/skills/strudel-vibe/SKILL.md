---
name: strudel-vibe
description: Turn a mood, story, image or description into a playable soda-strudel sketch – live-coded music (Strudel) plus images, camera, captions and visuals – and return a shareable link. Use when someone asks to "vibe" music, make a beat/track/loop/soundtrack, set a poem or story to music, make a music visual or social clip, or continue/refine a soda-strudel or Strudel sketch (including a pasted "Copy for Claude" block or a soda link).
---

# strudel-vibe

You compose **sketches** for soda-strudel: Strudel code where music, media,
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
3. **Pick visuals and media.** `node scripts/soda.mjs media` lists media pack
   items, visual plugins, fx and blends. Use only those names, or add public
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

- Layer with `$:` blocks: drums, bass, harmony, texture, then picture:
  media → visual → captions. 4–7 sound layers is plenty; phones struggle past ~10.
- Make it move: `<…>` alternation, `.slow()`, signals (`sine.range(...)`,
  `perlin`), `.sometimesBy`, `.every`/`.firstOf`, filter sweeps. Static loops
  feel dead after two cycles.
- Tie picture to sound: change images on the same cycle grid as chord changes
  (`img("<a b>").slow(4)` with `chord("<…>").slow(4)` or note changes), use
  `visual("pulse")` or `rings` for drums, `ribbon`/`bars` for texture.
- Captions are **single-quoted** strings: `captions(['line one', '', 'line two'])`
  (one per cycle, `''` = no text). Double quotes would be parsed as mini-notation.
- Keep gain sane (most layers `.gain(.3–.8)`), add `.room()` / `.delay()` for space.
- Camera pieces (`cam()`, `camMotion`) ask the viewer for permission and fall
  back gracefully; mention that in your reply.

## References

- `references/strudel.md` – Strudel essentials: mini-notation, sounds, effects, tonal, time, gotchas
- `references/multimedia.md` – soda's media, camera, caption and visual functions
- `references/recipes.md` – complete example sketches by mood
- `sounds.json`, `media.json` – the catalogues the validator uses
- `config.json` – `siteUrl` the links point at (override with `--site` or `SODA_SITE_URL`)
