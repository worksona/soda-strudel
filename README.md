# soda-strudel

Live-code music, images, camera and story in the browser – and vibe it with Claude.

soda-strudel is a static web app built on [Strudel](https://strudel.cc), the
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

ctrl+enter plays / updates, ctrl+. stops. The toolbar has six controls:

| Control | What it does |
|---|---|
| ▶ Play | Evaluate and play (again to stop) |
| Code · Stage · ⛶ | Code over the stage, stage only, or full screen |
| 🎙 📷 | Record a mic take into your library · camera on/off (stays on this device) |
| Library | Sounds · Media · Takes. Drop files anywhere; tap an item to insert it |
| Share | Link · Video · File (.soda) · More: WAV export, open .soda |
| ✦ Claude | Copies the sketch, errors and your library names for a Claude chat |

People opening a shared link get a title card → tap → full-screen playback,
with **Remix** to open the code.

## The Claude skill

`claude/skills/strudel-vibe` – install either way:

- **Claude Code:** `/plugin marketplace add worksona/soda-strudel`, then
  `/plugin install soda-strudel@soda-strudel`.
- **claude.ai:** download `/strudel-vibe.zip` from the running site (footer
  link) or build it with `pnpm skill`, then upload it under Settings › Capabilities › Skills.

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

The bundled `soda` sound pack and `demo` media pack are generated
(`node scripts/gen-demo-assets.mjs`) and CC0. Record every pack's licence in
its `pack.json` – shared links make sounds public.

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
host a modified version, publish its source (the footer links to it).

Strudel's maintainers ask that LLM-generated code not be contributed upstream
(see their POLICY.md). soda-strudel is a separate project built on Strudel's
published npm packages; please don't send changes from here upstream.
