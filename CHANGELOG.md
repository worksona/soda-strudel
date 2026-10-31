# Changelog

## Unreleased

- **Real drums**: every drum in the soda pack is now a recording – electronic
  hits from Strudel's uzu-drumkit (Unlicense) and an acoustic kit from VCSL
  (CC0): kick, snare, clap, rim, hat, open hat, ride, crash, toms, shaker,
  cowbell, clave, woodblock / agogo / triangle, plus new tambourine, conga,
  bongo and cajón. Credits per file in public/samples/soda/CREDITS.md
  (scripts/import-drum-samples.mjs). The synthesised "snap" is gone.

- **Workshop tab** on the Examples page: all 145 examples from the Strudel
  workshop, by chapter, each with Listen / Open and a link to the chapter
  (scripts/extract-workshop.mjs; Strudel contributors, AGPL-3.0). All validated
  in tests.
- **Richer sound**: the soda pack is re-rendered – stereo pads, strings, keys,
  plucks, bell, vox, reese and textures (left/right detune or decorrelated
  noise); kick, snare, clap and hats stay centred; hats are filtered noise
  instead of square waves; every sound has its own level instead of all
  peaking near full scale.
- **Examples remixed** for width and depth: melodic layers doubled left/right,
  panned percussion, reverb with room size, low-pass on drums and bright
  synths, gains ≤ .6, more recorded instruments (GM soundfonts).
- The strudel-vibe skill now has mixing guidance (width, depth, EQ, level).

- **Navigation simplified to one level**: every page is an outlined icon in the
  top bar – Sketches, Examples, Sounds, Media, Reference, then Export, Share,
  Claude, then About and Settings. Pages open on the right under their buttons,
  with no tabs inside them. ☰ and the in-panel tabs are gone; on phones the
  pages fold into one Pages button showing a grid.
- Export and Share are pages in the right panel instead of pop-up dialogs.
- Fix: Export › Audio works before you have pressed Play (the code is evaluated first).
- Takes now appear with your sounds on the Sounds page; the log moved into About.
- **About** page: what soda.strudel is, how it works, keys, mini-notation, links,
  credit (David · david@atomic47.co · sodanovels.com) and the log.
- **Light, dark and system** appearance (Settings › Appearance). The editor
  theme follows the app unless you pin one; the stage stays dark.

- App is now called **soda.strudel**.
- UI: square corners everywhere; outlined Lucide icons on every button; one-row
  toolbar (labels collapse to icons on narrow screens); footer removed.
- **Sketches** menu: save (ctrl+s), save as new, new, open past sketches with
  thumbnails, delete, open .soda files. Stored in IndexedDB.
- **Export** menu split out of Share: video, audio (WAV), .soda file, with shape,
  size (720/1080/1440p) and length. Exports are kept and listed in Settings.
- **Settings** panel: profile name (signs shared links), shape, export size,
  editor text size, past exports, storage status, delete sounds/media/sketches,
  reset everything, about/source/Claude skill links.
- Share is now just the link.
- Sound pack grown from 8 to 35 sounds (50 files): full drum kit, pitched
  bass/pluck/bell/keys/stab/strings/vox (note-mapped, in tune with note()),
  textures and fx. Media pack grown to 8 images.
- **One panel**, organised by intent, replacing the two drawers: Sketches
  (Mine · Examples), Library (Sounds · Media · Takes), Reference, Help,
  Console, Settings (now including Editor). ☰ opens it at the last tab;
  Sketches, Library and Settings in the toolbar are shortcuts to their tab.
  Library › Sounds is the single sound browser (yours, soda, GitHub, Strudel's
  drum machines by kit, samples, synths, soundfonts) with one interaction:
  click to hear, double-click / Enter to insert.
- (superseded by the one panel) **☰ panel** (Strudel's REPL panel): Help (keys, mini-notation, picture
  basics, links), Examples (9, with Listen/Open), Reference (507 Strudel + 18
  soda functions, searchable, Listen/Insert per example), Sounds (every loaded
  sound grouped, click to hear, double-click to insert), Console (Strudel log),
  Editor (theme, keybindings incl. vim/emacs/vscode, font, all editor toggles).
- **Writing help**: autocomplete for every function with docs + example; sound,
  bank, media, visual, fx and blend names inside strings; ctrl/cmd-hover docs.
  On by default.
- **GitHub sample libraries** in Library › Sounds: load any repo with a
  strudel.json, 10 verified suggestions, remembered per browser, "Add to sketch"
  writes samples('github:…'). The skill's validator fetches them too.
- **Examples library**: 19 pieces in six categories (Start here, Stories,
  Grooves, Moods, Studies, Live, plus three from live-coding-music-mcp), each
  with a description and shape. Stories use arrange() chapters so music,
  picture and words change together. All are validated in tests and were
  played in the real engine.
- First light rewritten as a lighter, gentler morning piece.
- Fix: Hydra is cleared when the next code doesn't use it.
- Examples include three patterns adapted from live-coding-music-mcp (tempo and
  sample names fixed).
- Fix: WAV export no longer renders visual-only events (img/visual/captions) as
  synth beeps.

## 0.0.1 – 2026-10-30

First build.

**App**
- Strudel editor (StrudelMirror) with synths, soundfonts and Strudel's default
  banks, plus the generated `soda` sound pack and `demo` media pack.
- Stage compositor: Hydra, media, visual plugins, Strudel painters and captions
  on one canvas; shapes free / 9:16 / 1:1 / 16:9; Code · Stage · full screen.
- Multimedia patterns: `img`, `vid`, `cam`, `caption`, `captions`, `visual`,
  `media()`, `camMotion`; params `opacity fade blend fx hue amount mirror tint still pos`.
- Visual plugins: particles, ribbon, bars, pulse, rings.
- Camera input (shared stream, effects, freeze, motion signal, Hydra `s0`).
- Mic takes: record → trimmed WAV → `s("take_…")`.
- Library in IndexedDB: drop audio, images and video; insert by tap.
- Share: `#z=` links, viewer mode with title card and Remix, `.soda` files,
  live video export (MP4/WebM with sound), offline WAV export, phone share sheet.
- ✦ Claude: copy sketch + error + library names for a chat.

**Claude**
- `strudel-vibe` skill with Strudel / multimedia references, validated recipes,
  and `scripts/soda.mjs` (validate with Strudel's real engine, build/decode links,
  search sounds). Packaged as a Claude Code plugin and a claude.ai zip.

**Not yet**
- Frame-stepped (faster than real time, fixed fps) video export, stems,
  standalone HTML player, PWA install, live MCP bridge.
- Camera and mic flows were exercised in code paths but not with real devices
  in automated testing.
