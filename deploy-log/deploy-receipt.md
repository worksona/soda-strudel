# Deployment Receipt

> **Project:** soda.strudel | **Deployed:** 2026-11-01T20:15:00Z| Field | Value |
|-------|-------|
| Platform | Netlify |
| URL (production) | https://soda-strudel.netlify.app |
| URL (this deploy) | https://6ae7928e83214f6087fba768--soda-strudel.netlify.app |
| URL (preview, verified first) | https://6ae79231394b2d2b381c6857--soda-strudel.netlify.app |
| Project ID | a0fecd9f-e8fe-4d36-897e-12d539ed0188 |
| Deploy ID | 6ae7928e83214f6087fba768 |
| Team | worksona |
| Project type | Static (Vite build) plus two functions: `/api/shorten` (a47l.com short links) and `/api/piece` (opens allowlisted Repertoire songs whose code is public at its source) |
| Source path | dist/ (built locally with `pnpm build`, commit of the service worker fix after e2299da) |
| Build | Local only – Netlify does not build (no build minutes); the CLI bundles `netlify/functions` |
| Custom domain | none |

## Verified

- `/`, `/sw.js`, `/manifest.webmanifest`, `/samples/…`, `/media/…`, `/strudel-vibe.zip`, `/strudel-docs.json`, `/icons/…` → 200
- Headers: `/sw.js` and manifest `no-cache`; packs `Access-Control-Allow-Origin: *`, `max-age=604800`
- App loads, plays, service worker activates, no console errors
- A link made by the strudel-vibe skill opens on production in viewer mode
- Opens dark on a light-mode device (dark default)
- First-visit welcome renders; Play from it starts First light; Update is dim before Play and enabled while playing
- Video effectors (`fx("vhs:kaleido")`) run on the draft deploy with no console errors; `/strudel-docs.json` lists them
- Phone toolbar (375px) is one row: File, View, Input, Play, Update, Examples, Share, More
- Editor keys: cmd+enter plays, cmd+. stops, cmd+f finds, focus starts in the code; no console errors
- `/api/shorten` reports enabled, refuses non-sketch links; Share › Short link made https://a47l.com/TCLsM, which 302s to the sketch
- Record button and micLevel in the live bundle; toolbar one row; no console errors
- Recorder: video (1080×1920 MP4) and WAV captures checked on the draft, 4-cycle take starts on the beat and stops itself; opens on production with no console errors
- Viewer: a shared link on production plays from the title card and a tap on the stage stops it; no console errors
- New First light in the live bundle; three inline widgets each get their own canvas on production; Share › Opens as shows Stage only / Code over the stage / Full screen

## Configuration Used

```toml
# Static site: everything runs in the browser. The one function,
# /api/shorten, makes optional short links on a47l.com; its token is the
# API_TOKEN (or SHORTLINK_TOKEN) secret in the Netlify environment.
[build]
  command = "pnpm build"
  publish = "dist"

[functions]
  directory = "netlify/functions"


[build.environment]
  NODE_VERSION = "22"

# Hosted sound and media packs: allow any origin (other Strudel instances, the
# vibe skill) and cache hard. Don't add COOP/COEP headers – they would block
# samples loaded from GitHub, Freesound and Shabda.
[[headers]]
  for = "/samples/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Cache-Control = "public, max-age=604800"

[[headers]]
  for = "/media/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Cache-Control = "public, max-age=604800"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    Referrer-Policy = "no-referrer"
    X-Content-Type-Options = "nosniff"
    Permissions-Policy = "camera=(self), microphone=(self), display-capture=()"

# the service worker and manifest must never be stuck in a cache
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Cache-Control = "no-cache"
    Content-Type = "application/manifest+json"
```

## Environment Variables Set

- `SHORTLINK_TOKEN` (or `API_TOKEN`) – a47l.com bearer token for `/api/shorten`, set by the owner as a secret. Optional `SHORTLINK_API_URL` (default https://a47l.com).

## Redeploy

```bash
pnpm test && pnpm build
netlify deploy --dir dist            # draft – check it
netlify deploy --dir dist --prod     # production
```
- Video export with Code over the stage: a recorded MP4 shows the code, note outlines, slider and inline pianoroll (dev); the live bundle has the code layer, `/api/shorten` enabled
- Repertoire collections: `/api/piece` returns all 18 allowlisted pieces (draft), refuses others (403) on production; `#collection=open-to-play` on production opens the collection and Open here loads a Codeberg piece with its credit header, no errors
- Songs in soda: 141/141 allowlisted songs fetched through `/api/piece` on the draft; on production Collections (15) load, Listen plays Lavender Town without touching the editor and Stop resets it, Watch here docks a youtube-nocookie player, the 3 community banks load, `#song=` opens and plays Ossuary with its credit
- Service worker v2 takes over on the first visit and drops the old cache (`soda-v1`), so data JSON is no longer stale after a deploy
