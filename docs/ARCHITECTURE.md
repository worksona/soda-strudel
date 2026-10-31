# soda-strudel architecture (0.0.1)

## Decisions

| Decision | Choice |
|---|---|
| Backend | **None.** Static site (Netlify). No accounts, no database, no functions. |
| Strudel | Built on Strudel's published npm packages (`@strudel/*` 1.2.6 / 1.3.0), not a fork of the website. |
| User data | The visitor's browser: IndexedDB for sounds, takes, media and renders; localStorage for the autosaved sketch. |
| Sharing | `#z=` links (deflate-raw + base64url JSON in the URL fragment), `.soda` zip files for pieces using personal sounds/media, exported video. |
| Packs | Owner-managed static folders under `public/samples` and `public/media`. |
| Rendering / export | On the user's machine: live capture (MediaRecorder) and offline WAV (Strudel's `renderPatternAudio`). |
| Claude | The `strudel-vibe` skill writes and validates sketches and returns links. In-app "✦ Claude" copies context for a chat. A live MCP bridge is a later option (below). |
| Multimedia model | Media, camera, captions and visuals are **patterns** (Strudel controls), rendered by one compositor canvas. |

## Map

```
index.html            toolbar, stage, editor, drawer, dialogs
src/main.js           wiring: StrudelMirror + Stage + UI, viewer mode for links
src/strudel/setup.js  eval scope, sound banks (GitHub), soda packs, browser library, pinned Hydra
src/soda/
  catalog.js          pure data: synth names, VISUALS, FX, BLENDS, ASPECTS, isMediaOnly
  patterns.js         multimedia vocabulary: img vid cam captions visual … camMotion media()
  mediaRegistry.js    name → URL registry (packs, sketch media, browser library)
  validate.js         headless validation (used by tests and the skill)
src/stage/
  stage.js            the compositor (see below)
  fx.js               cover-fit drawing, canvas filters, low-res pixel effects
src/visuals/          visual plugins (particles ribbon bars pulse rings) – docs/visuals.md
src/media/
  master.js           taps superdough's output: analyser (visuals) + MediaStream (export)
  camera.js           one shared camera stream, motion signal, Hydra s0 feed
  mic.js              take recording → trimmed WAV
  library.js          IndexedDB ↔ Strudel samples / media registry
src/share/
  sketch.js           #z= link codec (shared with the skill)
  sodafile.js         .soda zip build / import
src/export/           record.js (video), audio.js (WAV), wav.js (encoder)
src/storage/db.js     IndexedDB stores: sounds, media, renders
src/ui/               library drawer, share sheet, Claude copy, DOM helpers
scripts/              pack manifests, demo assets, default-bank snapshot, skill bundler
claude/               Claude Code plugin + strudel-vibe skill
```

## How a frame happens

1. `StrudelMirror` evaluates code with Strudel's transpiler. `$:` blocks are
   stacked into one pattern.
2. The scheduler queries the pattern ahead of time. Our `defaultOutput` sends
   audible events to superdough and **drops media-only events** (`isMediaOnly`:
   has `img`/`vid`/`cam`/`caption`/`visual` and no `s`/`note`).
3. Strudel's drawer queries the pattern around "now" each animation frame and
   hands `(haps, time, painters)` to `Stage.update`.
4. `Stage.render` composites one canvas, bottom → top:
   Hydra (hidden canvas drawn in) → media → visual plugins → Strudel painters → captions.
   Events are de-duplicated per whole event; onsets are events new since the last frame.
5. Export records that canvas plus the master bus, so the file is exactly what
   was on stage.

Time comes from the scheduler (cycles), never wall-clock, so the same code gives
the same picture. A frame-stepped render mode (WebCodecs) can build on this later.

## Sketch format

```json
{ "v": 1, "title": "…", "by": "…", "aspect": "free|9:16|1:1|16:9",
  "media": { "name": "https://…" }, "camera": true, "code": "…" }
```

`camera` is derived from the code. The link is `/#z=<base64url(deflate-raw(JSON))>`.

## Storage

| Store | Key | Holds |
|---|---|---|
| `sounds` | name | Blob, source (`upload`/`take`/`import`), type, bytes |
| `media` | name | Blob, `image`/`video`, mime, bytes |
| `renders` | auto | exported video blobs + meta |

The app calls `navigator.storage.persist()` after the first save. Browser data
can still be evicted (Safari deletes site data after 7 days without a visit
unless the site is installed). `.soda` files are the backup path.

## Hosting

`netlify.toml`: publish `dist`, CORS + caching on `/samples/*` and `/media/*`,
`Permissions-Policy` allowing camera and mic for our own origin. No COOP/COEP
(it would block cross-origin samples).

Runtime origins the browser talks to:
`raw.githubusercontent.com` (default banks, aliases), `unpkg.com` (hydra-synth
1.4.0 when a sketch calls `initHydra`), `felixroos.github.io` (gm_* soundfonts),
and any URLs a sketch names (Freesound, Shabda, media).

## Later options (not in 0.0.1)

- **Frame-stepped video** via WebCodecs + `mp4-muxer`: inject a clock into the
  stage and Hydra, render offline at a fixed fps.
- **Stems** – per-orbit offline renders.
- **Standalone HTML player** export.
- **Live MCP bridge** – a stateless relay (WebSocket to the tab + MCP over HTTP)
  so Claude can drive an open tab; the tab mints a secret, Claude presents it as
  a bearer token, the relay only routes. The skill would gain a live mode.
- **PWA install** – protects browser storage on Safari.
- Body/face tracking for the camera (on-device).
