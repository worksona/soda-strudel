---
id: repertoire-credits
kind: wiki-page
title: Credits
tags:
- repertoire
- credits
- licences
parent: repertoire
created: '2026-11-01T19:10:00Z'
created_by: dolsson@aimqc.com
last_modified: '2026-11-01T19:10:00Z'
last_modified_by: dolsson@aimqc.com
---
# Credits

What soda.strudel uses from other people, and under which licence. Part of [[repertoire]]; rules in [[repertoire-reuse-and-citation]]. Keep this page current whenever something is adapted or a bank is added (backlog: credits page).

## The software
- **Strudel** by Felix Roos, Alex McLean and contributors – AGPL-3.0 – https://codeberg.org/uzu/strudel. soda.strudel is AGPL-3.0 too: https://github.com/worksona/soda-strudel
- **Strudel workshop examples** (Examples › Workshop) – Strudel contributors, AGPL-3.0 – https://strudel.cc/workshop/getting-started/

## Examples made after someone else's work
Shown on each example in Examples (`credit` field; a test keeps it there).

| soda example | After | By | Licence |
|---|---|---|---|
| Dub techno fog, Melodic techno, Trance lift, Psy roll, Hard techno kaleid | Breath of Strudel – https://github.com/vakofmaya/BreathOfStrudle | vakofmaya | CC BY 4.0 |
| Trance lift (the four-chapter arc) | strudel_trance – https://github.com/honcoops/strudel_trance | honcoops | README: "free to use, modify, and incorporate" |
| Hard techno kaleid (the Hydra pattern) | Hydra Book – https://github.com/micuat/hydra-book | micuat | Unlicense (public domain) |
| Ambient drone, Drum & bass 174, Minimal techno 130 | live-coding-music-mcp – https://github.com/williamzujkowski/live-coding-music-mcp | williamzujkowski | AGPL-3.0 |

Adapted repertoire pieces (none yet): each will be listed here with author, source, licence and the changes made.

## Sounds
- **soda pack** (`bank("soda")`, public/samples/soda) – recordings from **VCSL** by Sam Gossner (CC0-1.0, https://github.com/sgossner/VCSL) and **uzu-drumkit** by switchangel and mot4i (Unlicense, https://github.com/tidalcycles/uzu-drumkit); per-file list in `public/samples/soda/CREDITS.md`.
- **Strudel's default banks**, loaded at start exactly as strudel.cc does (src/strudel/setup.js), via dough-samples by Felix Roos – https://github.com/felixroos/dough-samples:
  - tidal-drum-machines (classic drum machine samples), piano, Dirt-Samples (TidalCycles' default set – its repo states no licence, https://github.com/tidalcycles/Dirt-Samples), VCSL (CC0-1.0), mridangam
  - uzu-drumkit (Unlicense) – https://github.com/tidalcycles/uzu-drumkit
  - drum-machine aliases by TodePond – https://github.com/todepond/samples
  These are the community-standard Strudel defaults; their licences vary per bank and Dirt-Samples has none stated – worth a look in the sound bank rights check.
- Open-licensed community banks: none shipped yet – see [[repertoire-sound-banks]] and the rights check on the backlog.

## Pictures
- **soda:demo** media pack (night, fog, dusk, sun, sea, rain, neon, blocks) – made for soda.strudel, CC0-1.0.
