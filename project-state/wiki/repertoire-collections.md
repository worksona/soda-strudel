---
id: repertoire-collections
kind: wiki-page
title: Collections
tags:
- repertoire
- collections
parent: repertoire
created: '2026-11-01T21:30:00Z'
created_by: dolsson@aimqc.com
last_modified: '2026-11-01T21:30:00Z'
last_modified_by: dolsson@aimqc.com
---
# Collections

Fifteen hand-picked sets built from the catalogue and the first harvest. Part of [[repertoire]]. In the app: Examples › Repertoire › Collections. To browse and mix your own set, use the published page: https://claude.ai/artifact/8J6kfHPvfaxriusZZjBk6G (a private claude.ai artifact – share it from its Share menu).

| Collection | Link id | Items | Open in soda | What it is |
|---|---|---|---|---|
| [Start here: learn Strudel](https://soda-strudel.netlify.app/#collection=start-here) | `start-here` | 10 | 1 | First steps, in order: the official workshop, then short from-scratch videos, then a finished piece to take apart. |
| [Open licence: play them here](https://soda-strudel.netlify.app/#collection=open-to-play) | `open-to-play` | 13 | 13 | Pieces whose authors chose an open licence – they open straight into the editor, with the credit at the top. |
| [Strudel classics by Felix Roos](https://soda-strudel.netlify.app/#collection=strudel-classics) | `strudel-classics` | 8 | 8 | The tunes that ship with Strudel, by its co-author – CC BY-NC-SA 4.0, so they open here with credit. |
| [Techno and house](https://soda-strudel.netlify.app/#collection=techno-house) | `techno-house` | 14 | 7 | Four-on-the-floor, from first groove to dub chords and acid lines. |
| [Drum & bass, jungle and breaks](https://soda-strudel.netlify.app/#collection=bass-and-breaks) | `bass-and-breaks` | 14 | 7 | Chopping breaks, rolling basslines and the Amen – from first slice to liquid DnB. |
| [Ambient and generative](https://soda-strudel.netlify.app/#collection=ambient-generative) | `ambient-generative` | 10 | 6 | Slow pads, chance and process – music that plays itself. |
| [Game music and chiptune](https://soda-strudel.netlify.app/#collection=game-and-chiptune) | `game-and-chiptune` | 12 | 11 | Square, triangle and noise – the sound of consoles, plus music written for an open-source game. |
| [Hip-hop and lo-fi](https://soda-strudel.netlify.app/#collection=hiphop-and-lofi) | `hiphop-and-lofi` | 6 | 3 | Swing, dusty keys and laid-back drums. |
| [Synthwave, trance and more styles](https://soda-strudel.netlify.app/#collection=synthwave-trance-and-more) | `synthwave-trance-and-more` | 9 | 1 | One-genre-at-a-time studies: synthwave, trance, disco, UK garage, dubstep, hardstyle. |
| [Covers and transcriptions](https://soda-strudel.netlify.app/#collection=covers-and-transcriptions) | `covers-and-transcriptions` | 15 | 10 | Well-known songs rebuilt as patterns – the best way to see how a real arrangement is laid out. Listen at the source: the songs belong to their composers. |
| [Music theory in code](https://soda-strudel.netlify.app/#collection=music-theory) | `music-theory` | 9 | 1 | Short videos where one change – a mode, an extra note, a progression – explains why music sounds the way it does. |
| [Performances](https://soda-strudel.netlify.app/#collection=performances) | `performances` | 11 | 0 | Strudel on stage and on stream – from the Showcase and algorave nights. |
| [Sounds and tools](https://soda-strudel.netlify.app/#collection=sounds-and-tools) | `sounds-and-tools` | 10 | 3 | Sample banks cleared for use, and tools that turn MIDI, humming or a song into Strudel code. |
| [eefano's songbook](https://soda-strudel.netlify.app/#collection=eefano-songbook) | `eefano-songbook` | 93 | 93 | 93 songs by eefano – covers of Cardiacs, Tim Smith, The Sea Nymphs and more, plus originals and jam sessions. They open here unchanged, credited; the songs belong to their writers. |
| [Community originals](https://soda-strudel.netlify.app/#collection=community-originals) | `community-originals` | 24 | 23 | Original Strudel pieces shared by their authors across techno, drum & bass, dub, ambient, glitch, world and game music. Licensed ones may be reused; the rest open here unchanged – ask the author before reusing. |

## How loading works
- **Listen** and **Open here** appear for every song whose code is public at its source (141 so far; decision `2026-11-01-open-public-songs-in-soda`). The app fetches the code from where it was published, through `/api/piece` and an allowlist generated from these collections, and puts a credit header on top – with "ask the author before reusing" when there is no open licence. Nothing is stored in soda.strudel. `#song=<id>` opens one song.
- **Watch here** plays YouTube tutorials and performances in a panel beside the editor.
- soda examples open as usual; the three cleared sound banks load with soda – **Listen** and **Try it** use them directly.
- Everything else opens at its source. Rules: [[repertoire-reuse-and-citation]].
- Links: `#collection=<id>` opens a built-in collection; `#col=…` carries a whole shared collection (titles, credits, links – never code).

## Rebuilding
Curation lives in `documents/repertoire/curate_collections.py` → `collections.json`; `pnpm repertoire` (or `pnpm build`) turns it into `public/repertoire.json` and the `/api/piece` allowlist. The published page is `documents/repertoire/collections-page.html`.
