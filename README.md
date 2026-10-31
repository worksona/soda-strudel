# soda.strudel

A personal project by David · [david@atomic47.co](mailto:david@atomic47.co) · [sodanovels.com](https://sodanovels.com)

Live-code music, images, camera and story in the browser – and vibe it with Claude.

soda.strudel is a static web app built on [Strudel](https://strudel.cc), the
JavaScript port of TidalCycles. It adds a multimedia **stage** where images,
video, the camera, captions and visuals are patterns, sequenced like sounds:

```js
setcps(.5)
$: s("kick*2 [~ snare]").bank("soda")
$: note("<c2 eb2>").s("sawtooth").lpf(camMotion.range(300, 3000))
$: img("<rain neon>").slow(4).fade(.3)
$: cam().mirror(1).fx("posterize").opacity(.5)
$: visual("particles").hue(210)
$: captions(['2:14 am', '', 'exit 9', '']).slow(2)
```

- **No backend.** The site is static files. Your sounds, takes and media live in
  your browser (IndexedDB). Sketches share as links whose content sits in the
  `#fragment`, which never reaches a server.
- **Export on your machine.** Social video (9:16 / 1:1 / 16:9 MP4 or WebM with
  sound) and WAV audio, rendered in the browser.
- **Claude skill.** `strudel-vibe` turns a mood or story into a validated
  sketch and hands back a link.

Version 0.0.1 – early. See [CHANGELOG.md](CHANGELOG.md) for what's in and what's next.

## Use it

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

ctrl+enter plays / updates, ctrl+. stops, ctrl+s saves. The toolbar:

One row of outlined icons, grouped:

| Group | Buttons |
|---|---|
| Left | **soda.strudel** (opens About) · **File** ▾ · Play · Code / Stage / Full screen · Mic / Camera |
| Pages | **Examples** · **Sounds** · **Media** · **Reference** |
| Out | **Export** · **Share** (pages) · **Claude** (copies the sketch for a chat) |
| Right | **About** · **Settings** |

**File** is a pulldown: New sketch · Open… · Open .soda file… · Save (ctrl+s) ·
Save as new · Rename… · Download .soda file · Recent sketches. Tiny captions
sit under every toolbar icon (Settings › Appearance turns them off).

Each page opens on the right, one level deep – no tabs inside pages and no pop-up dialogs. Click the
lit icon again (or Esc) to close. On phones the pages and actions fold into one
**Pages** button that shows a grid.

| Page | Contains |
|---|---|
| Open sketch (File › Open…) | Every saved sketch with thumbnails: open, delete; save / save as new / new |
| Examples | Two tabs: **Examples** (19 soda pieces by category) and **Workshop** (all 145 examples from the [Strudel workshop](https://strudel.cc/workshop/getting-started/), by chapter). Listen / Open on each |
| Sounds | One browser for every sound: yours (uploads and mic takes), the soda pack, GitHub libraries (load, add to sketch, forget, suggestions), Strudel's drum machines (by kit), samples, synths, soundfonts. Click to hear, double-click or Enter to insert, outlined = pitched |
| Media | Your images and videos, the soda media pack, camera snippets |
| Reference | Every Strudel and soda function, searchable, examples with Listen / Insert |
| Export | Shape, size, length → Video (stage + sound), Audio (WAV, faster than real time), .soda file |
| Share | Title, then Copy link (plays in any browser; nothing uploaded) |
| About | What it is, how it works, keys, mini-notation, links, and the log |
| Settings | Appearance (system / light / dark) · Profile · Screen and export · Editor · Exports · Storage |

Takes are mic recordings and appear with your sounds; sketches are your saved
pieces – both live in the browser's IndexedDB.

**Writing help:** autocomplete for every Strudel and soda function (with docs and
an example), and for sound, bank, media, visual and fx names inside strings
(ctrl+space to open). Hold ctrl/cmd and point at a function for its docs.

**GitHub sound libraries:** the Sounds page loads any repo with
a `strudel.json` (`user/repo` or a URL), with ten verified suggestions
(Dirt-Samples, clean-breaks, crate, garden, dough-fox, spicule…). Loaded libraries
return on your next visit; "Add to sketch" writes `samples('github:…')` into the
code so shared links load them too.

People opening a shared link get a title card → tap → full-screen playback,
with **Remix** to open the code.

## The Claude skill

`claude/skills/strudel-vibe` – install either way:

- **Claude Code:** `/plugin marketplace add worksona/soda-strudel`, then
  `/plugin install soda-strudel@soda-strudel`.
- **claude.ai:** download `/strudel-vibe.zip` from the running site (Settings ›
  About) or build it with `pnpm skill`, then upload it under Settings › Capabilities › Skills.

The skill's `scripts/soda.mjs` (bundled, no dependencies, Node 18+) validates
sketches with Strudel's real engine and builds links:

```bash
node claude/skills/strudel-vibe/scripts/soda.mjs link sketch.json --site https://your-site
node claude/skills/strudel-vibe/scripts/soda.mjs sounds 909
```

Links point at `config.json › siteUrl`. Set it when you deploy:
`SODA_SITE_URL=https://your-site pnpm skill`.

## Sound and media packs

Drop folders in and rebuild manifests:

```
public/samples/<pack>/<sound>/*.wav     → s("<sound>").bank("<pack>")  (or s("<pack>_<sound>"))
public/samples/<pack>/pack.json         → { "prefix": "<pack>", "licence": "CC0-1.0" }
public/media/<pack>/*.{jpg,webp,svg,mp4} → img("<name>") / vid("<name>")
```

```bash
pnpm manifests      # writes strudel.json / media.json per pack + public/sounds.json, media.json
pnpm skill          # refreshes the skill's catalogues and zip
```

Name files after notes (`c3.wav`, `f#2.wav`) to make a **pitched** sound: the
manifest maps them by pitch so `note("e3 g3").s("pluck").bank("soda")` plays in tune.

The bundled `soda` sound pack has 38 sounds:
- **Drums are real recordings** – a 17-sound kit from VCSL (CC0) and Strudel's
  uzu-drumkit (Unlicense), built by `node scripts/import-drum-samples.mjs`
  with per-file credits in `public/samples/soda/CREDITS.md`.
- **Pitched instruments, textures and fx** are synthesised in stereo by
  `node scripts/gen-demo-assets.mjs` (CC0), as is the `demo` media pack (8 images). Record every pack's licence in
its `pack.json` – shared links make sounds public.

`node scripts/extract-workshop.mjs` refreshes the Workshop tab from Strudel's
repository (AGPL-3.0, Strudel contributors).

Strudel's default banks (drum machines, piano, VCSL, Dirt-Samples…) load from
GitHub at runtime, like on strudel.cc. `node scripts/snapshot-default-banks.mjs`
refreshes the offline name list the skill validates against.

## Deploy (Netlify)

`netlify.toml` is ready. Build and deploy from your machine:

```bash
pnpm test && pnpm build
netlify deploy --prod --dir dist
```

No functions, no environment variables. Keep COOP/COEP headers off – they would
block samples from GitHub, Freesound and Shabda.

## Develop

```bash
pnpm test           # sketch codec + headless validator (vitest)
pnpm build          # manifests → skill bundle → vite build
```

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) – how it fits together
- [docs/visuals.md](docs/visuals.md) – write a visual plugin
- [docs/ux-principles.md](docs/ux-principles.md) – the rules new features follow
- [claude/skills/strudel-vibe/references/multimedia.md](claude/skills/strudel-vibe/references/multimedia.md) – the multimedia language

## License and credits

AGPL-3.0-or-later, like Strudel, whose packages this app is built on. If you
host a modified version, publish its source (Settings › About links to it).

Strudel's maintainers ask that LLM-generated code not be contributed upstream
(see their POLICY.md). soda.strudel is a separate project built on Strudel's
published npm packages; please don't send changes from here upstream.
