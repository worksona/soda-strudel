# strudel-vibe

**Live app:** https://soda-strudel.netlify.app – sketches made with this skill play there ·
**Vibe page** (install + prompts): open the app and tap **Vibe** in the toolbar.

A Claude skill that turns a mood, a story or an image into a playable
[soda.strudel](https://github.com/worksona/soda-strudel) sketch – live-coded
music ([Strudel](https://strudel.cc)) with pictures, captions and visuals – and
hands back a link that plays in any browser.

> “late-night rainy drive, 85 bpm, a bit lonely” → a validated sketch + link

Every sketch is checked with Strudel's real engine before you get the link:
syntax, unknown sounds (including sounds from GitHub sample libraries), visuals,
effects and captions.

## Install

**Claude Code**

```
/plugin marketplace add worksona/strudel-vibe
/plugin install strudel-vibe@strudel-vibe
```

**claude.ai** – zip the skill folder and upload it under Settings › Capabilities › Skills:

```bash
cd skills && zip -r strudel-vibe.zip strudel-vibe
```

(or download it from the **Vibe** page of https://soda-strudel.netlify.app).

**By hand** – copy `skills/strudel-vibe` into `~/.claude/skills/`.

## Use

Ask for music, a soundtrack, a loop, a social clip, a poem set to music, or paste
a soda link or a “Copy for Claude” block to continue a sketch:

- “Make a 9:16 lo-fi piece about the last bus home, with captions.”
- “Something like a sunrise over the sea, ambient, no drums.”
- “Darker, and add a breakbeat from clean-breaks.”

The skill writes the sketch, runs `scripts/soda.mjs link` to validate it and
build the link, and replies with the link, the code and ideas for the next take.

## The helper script

`skills/strudel-vibe/scripts/soda.mjs` – one bundled file, Node 18+, no install:

```bash
node scripts/soda.mjs link sketch.json --site https://your-site   # validate + link
node scripts/soda.mjs check code.js                                 # validate only
node scripts/soda.mjs decode "https://…/#z=…"                       # link -> sketch
node scripts/soda.mjs sounds 909                                    # search sounds
node scripts/soda.mjs media                                         # media, visuals, fx
```

## Configure

Links point at **https://soda-strudel.netlify.app** (`skills/strudel-vibe/config.json ›
siteUrl`). Override per call with `--site URL` or the `SODA_SITE_URL` environment
variable – e.g. for your own deployment.

## Contents

| Path | What |
|---|---|
| `skills/strudel-vibe/SKILL.md` | the workflow and craft notes Claude follows |
| `references/strudel.md` | Strudel essentials |
| `references/multimedia.md` | soda's pictures, camera, captions, visuals |
| `references/recipes.md` | complete, validated example sketches |
| `references/functions.md` | every Strudel + soda function, one line each |
| `sounds.json`, `media.json` | what the validator knows exists |
| `scripts/soda.mjs` | validator, link codec, sound search |

## Where it comes from

This repo is **generated** from [soda-strudel](https://github.com/worksona/soda-strudel)
(`claude/` folder) by `pnpm skill:publish`. Make changes there, not here.

## Licence

AGPL-3.0-or-later. `scripts/soda.mjs` bundles Strudel (AGPL-3.0, © Strudel
contributors) to validate sketches with its real engine.

A personal project by David · [david@atomic47.co](mailto:david@atomic47.co) · [sodanovels.com](https://sodanovels.com)
