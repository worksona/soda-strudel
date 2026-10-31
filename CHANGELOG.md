# Changelog

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
