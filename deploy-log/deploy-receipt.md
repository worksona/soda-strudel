# Deployment Receipt

> **Project:** soda.strudel | **Deployed:** 2026-11-01T01:03:55Z| Field | Value |
|-------|-------|
| Platform | Netlify |
| URL (production) | https://soda-strudel.netlify.app |
| URL (this deploy) | https://6ae68ff10e9b97dd71b4f5e4--soda-strudel.netlify.app |
| URL (preview, verified first) | https://6ae68f0e41d26ea77df5bf09--soda-strudel.netlify.app |
| Project ID | a0fecd9f-e8fe-4d36-897e-12d539ed0188 |
| Deploy ID | 6ae68ff10e9b97dd71b4f5e4 |
| Team | worksona |
| Project type | Static (Vite build) – no functions, no backend |
| Source path | dist/ (built locally with `pnpm build`, commit 70cd93a) |
| Build | Local only – Netlify does not build (no build minutes) |
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

## Configuration Used

```toml
# Static site: everything runs in the browser. No functions, no backend.
[build]
  command = "pnpm build"
  publish = "dist"

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

None – the app is static and needs no secrets.

## Redeploy

```bash
pnpm test && pnpm build
netlify deploy --dir dist            # draft – check it
netlify deploy --dir dist --prod     # production
```
