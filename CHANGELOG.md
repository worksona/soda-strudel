# Changelog

## Unreleased

- **A new First light.** The first piece new visitors hear is now a full
  arrangement: a breathing synth bass, wide chords, a slow supersaw melody,
  chopped power chords, scripted drums with fills every eighth bar, celesta
  “birds” and a noise-and-crackle bed, built up by arrange() over two and a
  half minutes and faded out. A second arrange() runs the pictures, visuals
  and words on the same plan – night, fog clearing, dusk with a punchcard of
  every layer, sun with rings and particles – and sliders in the code mix it
  live. Mixed to peak around 0.75 at its fullest.
- **Shared links play like a video.** In the viewer, tap the stage (or press
  space) to stop and play again, with a play / stop icon flashing in the
  middle. A small play / stop button joins Full screen and Remix bottom right.
- **Export is a quick recorder.** Export sits next to Record in the top bar
  and opens a recorder over the stage: Video + sound or Sound only (lossless
  WAV), one big Start. While recording: a running timer (with progress when a
  length is set), a level meter and the size so far, and the Export button
  turns into the timer – one tap stops. Then a player shows the result with
  Download, Share (phones), Record again and Discard; it is also kept in
  Settings › Exports. The gear holds the frame, size, length (until you stop,
  or 4–64 cycles, stopping on its own) and “start on the next cycle” so clips
  loop cleanly. The live microphone is recorded when Input › Microphone is on.
  The full Export page (WAV faster than real time, .soda file) is one link
  away, and in More on phones. On narrow phones all ten buttons stay on one row.
- **Short links with a47l.com.** Share has a “Short link” checkbox: Copy
  link stores the full sketch link on a47l.com and copies the short one,
  falling back to the full link if that fails. The token is a Netlify secret
  (`SHORTLINK_TOKEN` or `API_TOKEN`) used by the site's one function, `/api/shorten`, which
  only shortens links to this site's own sketches; the checkbox stays off
  until the secret is set.
- **Sounds has tabs.** My sounds (your uploads and takes) and soda sounds (the
  soda pack, GitHub libraries, Strudel's sounds); search works within the tab.
  A new take or dropped audio opens My sounds.
- **Record is its own button.** A mic button in the top bar records a take
  that becomes a sound; it glows and turns into Stop while recording.
- **Input is for live sources.** Input › Microphone turns the mic on as a
  source: the new `micLevel` signal (0..1 loudness, like `camMotion`) drives
  patterns and visuals, and video exports record the microphone. Shared links
  that use `micLevel` offer the viewer the microphone.
- **Tooltips switch.** Settings › Tooltips turns hover hints off and on, both
  in the code and on buttons. Hints now show above an open side panel.
- **Toolbar fits.** Below 800px the pages fold into More; on narrow phones the
  bar tightens so all nine buttons stay on one row.
- **Hints on hover.** Point at anything in the code – no key to hold – and a
  hint shows: a function's doc; what a name in a string is (an effector or
  look in `fx`, a visual, a blend, a sound and how many variations it has, a
  bank, a picture, a note and its MIDI number); what a mini-notation symbol
  does (`* / < > [ ] ~ , : ! @ ? |` …); and what `$:` means. Hints sit below
  the word, clear of the toolbar. Icon-only buttons show their name on hover.
- **Keyboard commands work wherever focus is.** On a Mac, cmd+enter plays and
  cmd+. stops (cmd+enter used to add a blank line); ctrl and alt still work.
  The cursor starts in the code and comes back after a click on Play or
  Update, and with focus on the page, play, stop, undo, redo, copy and paste
  still reach the code. cmd/ctrl+f opens find and replace. These keys work in
  every Settings › Editor › Keys mode (Standard, VS Code, Vim, Emacs); About
  lists them all.
- **Examples and Share stay on the phone toolbar.** There was room beside
  More; the two buttons reached for most no longer need a second tap.
- **Video effectors for the camera (and any picture).** `.fx()` on `cam`,
  `vid` and `img` now takes twenty-one effectors after
  [Pixel Flow](https://pixel-flow.atomic47.co/pixel-flow-nodes/): kaleido,
  symmetry, mosaic, slice, wave, twist, ripple, melt, smear, rgbshift, glitch,
  vhs, sort, dither, halftone, ascii, scanlines, solarize, threshold, timeslice
  (slit-scan) and feedback. `.amount(0..1)` is their strength, `.hue()` a
  direction for smear and rgbshift, and `:` chains them in order –
  `cam().fx("vhs:kaleido").amount(camMotion)`. New Live example “Video booth”;
  the Reference, the validator and the skill know every name.
- **Dancefloor examples and Hydra patterns.** Five new examples in a
  *Dancefloor* category – Dub techno fog, Melodic techno, Trance lift (build →
  breakdown → drop with `arrange()`), Psy roll, Hard techno kaleid – written
  after the genre recipes in [Breath of Strudel](https://github.com/vakofmaya/BreathOfStrudle)
  (CC BY 4.0) and the trance arc in honcoops/strudel_trance, each with a
  full-screen visual. The skill gains a genre table, two of the recipes and a
  set of Hydra backgrounds after [Hydra Book](https://github.com/micuat/hydra-book)
  (public domain). The validator now treats `initHydra()` like the browser does:
  Hydra's `shape`, `src`, `o0`… take over Strudel's for that sketch only. A
  sidechain kick (`duckorbit`) no longer logs "duck target orbit does not
  exist" on the first beats while the pad it ducks is still loading.
- **The stage always fills the screen.** A sketch's shape (9:16 · 1:1 · 16:9)
  is now the *export frame*, not a letterbox: on a phone the piece is portrait,
  on a laptop wide, and video export cuts it to the frame. A sketch without a
  shape follows the device (portrait → 9:16, else 16:9) – the Export page shows
  that as “Auto”. **View › Show export frame** outlines the frame over the
  stage and dims what the cut would lose (remembered). Example cards read
  “made for 9:16”; Settings says “Export shape of this sketch”.

- **The stage is the default view.** soda.strudel opens with the piece filling
  the window; View › Code over the stage brings the editor back, and the view
  you pick in that menu is remembered (`soda.view`). Insert, Remix, “Just let
  me code” and “Play First light” show the code as before.

- **Strudel's animations as visuals, full stage.** `visual("punchcard")`,
  `pianoroll`, `wordfall`, `spiral`, `pitchwheel`, `scope` and `spectrum` show
  every audible layer across the whole stage, with `hue`, `amount`, `opacity`,
  `blend` and `fade` like the other visuals, layered with media and captions and
  in exports. Strudel's chained `.punchcard()` / `.spiral()` still work for one
  layer. The drawer's two-cycle window stays open while the code names a
  timeline visual (src/visuals/strudel.js, `TIMELINE_VISUALS`).

- **Audio effects on pictures.** Strudel's effect controls now mean something
  on `img`, `vid` and `cam` layers: `.lpf()` blurs (low cutoff = soft),
  `.hpf()` turns the picture into outlines, `.room()`/`.roomsize()` glow,
  `.delay()`/`.delayfeedback()`/`.delaytime()` echo previous frames, `.crush()`
  posterizes, `.coarse()` pixelates, `.distort()` adds contrast, `.pan()`
  slides the crop, `.gain()` sets brightness. One chain can shape a sound and
  its picture together (`const dub = x => x.lpf(…).room(.7)`). No new names:
  autocomplete, the validator and the skill already know them; hover docs and
  the Reference say what each does on a picture. New example “Dub picture”
  (Studies). `src/stage/pictureFx.js` is pure, so the mapping is tested.

- **Dark is the default theme.** Only a choice made in Settings › Appearance is
  saved (new key); the earlier automatically stored “system” is cleared, so
  existing visitors also get Dark unless they pick otherwise. The page starts
  dark in the markup – no light flash while loading.

- **Update button** to the right of Play (instead of Play turning into Update):
  dim until you press Play, lights up and pulses when you've changed the code
  while playing, applies your changes like ctrl+enter. Play is just Play/Stop.

- **Welcome on first visit**: “Make music you can see.” – one tap plays
  First light, then a tip shows how to live-code (change a number, tap
  Update). Also Browse examples, Vibe with Claude, Just let me code. About ›
  “Show the welcome again”.
- **Light theme fixed**: the editor is a solid light page across the full
  width (no grey veil fading to black), no text glow, the line-number gutter
  follows the page.

- **Vibe** page and toolbar button next to Claude: what the strudel-vibe skill
  does, download / install (claude.ai, Claude Code, by hand), prompts to copy,
  how it works, links.
- The skill's links now point at the live site, https://soda-strudel.netlify.app.
- Fix: the skill download link saved the file as "true".
- Deployed to Netlify: https://soda-strudel.netlify.app

- Toolbar menus consolidated: **View** (Code over the stage · Stage only ·
  Full screen) and **Input** (Record a take / Stop recording · Camera · Switch
  camera) are pulldowns to the right of File, replacing five separate buttons.
  View's icon shows the current view; Input glows red while recording or with
  the camera on. All three pulldowns share one component (src/ui/menu.js):
  one open at a time, full keyboard support.

- The strudel-vibe skill has its own repo, worksona/strudel-vibe, published
  from `claude/` with `pnpm skill:publish` (git subtree). The plugin is now
  named `strudel-vibe`, with its own marketplace, README and licence.

- **Mobile ready**:
  - Play becomes **Update** when the code changed while playing (no ctrl+enter
    on phones); works on desktop too.
  - iPhone audio: plays with the silent switch on (audioSession / silent clip
    unlock on the first tap).
  - Sounds: tap to hear, then Insert from a bar at the bottom (no double-click
    on touch); inserting no longer pops the keyboard.
  - Full screen falls back to an in-page version where the Fullscreen API is
    missing (iPhone), with an exit button.
  - Safe areas (notch, home bar), 16px inputs, touch-action tuned, toasts full
    width.
  - Code always wraps to the screen on phones (≤ 680px) at 16px or larger –
    applied over the saved editor settings without changing them, and
    re-applied when the screen size changes.
  - **Installable PWA**: manifest, app icons (scripts/gen-icons.mjs), service
    worker that keeps the app and packs for quick reopen and offline use;
    installing also protects browser storage from Safari's 7-day eviction.

- Opening examples, workshop items or sketches no longer asks for confirmation
  (the browser dialog failed silently in some embedded browsers, so Open
  stopped working after the first example). Only real edits count as unsaved;
  if there were edits, the toast offers Undo.
- The separate "Open sketch" panel is gone: File lists every saved sketch
  (click to open, trash to delete with Undo); "Open…" removed, "Open .soda
  file…" stays.

- **File pulldown** left of Play (replaces the Sketches icon): New sketch,
  Open…, Open .soda file…, Save, Save as new, Rename…, Download .soda file and
  up to six recent sketches. Full keyboard support (↓ ↑ Home End Esc).
- **Tiny captions** under every toolbar icon, on by default as a test –
  Settings › Appearance › “Small labels under the toolbar icons”.

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
