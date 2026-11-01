# Strudel repertoire sources: where to find, monitor and cite Strudel pieces

Prepared 2026-11-01 for soda-strudel (https://soda-strudel.netlify.app). Every URL below was opened (HTTP 200 or page read) or returned by the GitHub/Codeberg/YouTube APIs on 2026-11-01, unless it is marked **UNVERIFIED**. No pattern code is reproduced here.

---

## 0. Licensing facts that shape everything below

| Fact | Evidence |
|---|---|
| Strudel software is **AGPL-3.0** ("GNU Affero General Public License v3"). The README says Strudel code "can only be shared within free/open source projects under the same license". | https://codeberg.org/uzu/strudel (README + `LICENSE`, https://codeberg.org/uzu/strudel/src/branch/main/LICENSE) |
| The stock tunes in the repo are **not AGPL**. Almost every Felix Roos tune in `tunes.mjs` carries its own header: `@license CC BY-NC-SA 4.0` + `@by Felix Roos`. That means attribution, **non-commercial use only** and share-alike. | https://codeberg.org/uzu/strudel/src/branch/main/website/src/repl/tunes.mjs |
| The strudel.cc FAQ says contributed examples and tracks are licensed separately from the software, and that they **must not be used to train AI models without permission**. It also says "the music you make with it is your own". | https://strudel.cc/learn/faq/ |
| On 2026-10-28 the project adopted a **"Post-AI humane policy"**. It declines contributions that contain LLM-generated content and flags LLM-written forum posts. It also "strongly discourage[s]" importing the projects into corporate AI platforms. | https://codeberg.org/uzu/strudel/src/branch/main/POLICY.md · announcement by yaxu: https://uzu.lurk.org/t/strudels-post-ai-humane-policy-for-live-coding-development/6251 |
| Patterns that users share from the REPL (the Bakery, "Featured" and "Latest") have **no license stated** anywhere. | https://strudel.cc/bakery/ · https://strudel.cc/learn/faq/ |
| The default sample banks are licensed separately and per bank (for example CC-BY 3.0, CC0 and CC-BY-SA 4.0 entries). | https://github.com/felixroos/dough-samples (README) |
| Covers (Depeche Mode, Radiohead, Toby Fox, Koji Kondo and others) carry the **underlying composition copyright**, whatever license the script has. | e.g. https://github.com/eefano/strudel-songs-collection |

**What this means for soda-strudel:** we can link to and credit anything. We can adapt a Felix Roos stock tune only for non-commercial use, under CC BY-NC-SA 4.0, with attribution. For anything with no license, we ask the author first. Because of the AI policy and the FAQ wording, the harvest should **link and summarise**. It should not bulk-copy community code into AI tooling.

---

## 1. Source landscape

| # | Source | URL (verified) | What it holds | How to monitor | Update frequency (observed) | License / reuse terms |
|---|---|---|---|---|---|---|
| 1 | **Strudel source repo** (Codeberg, canonical) | https://codeberg.org/uzu/strudel | Code, docs and stock tunes | Commits RSS: https://codeberg.org/uzu/strudel.rss · Releases RSS: https://codeberg.org/uzu/strudel/releases.rss · Tags: https://codeberg.org/uzu/strudel/tags.rss · API: `https://codeberg.org/api/v1/repos/uzu/strudel/commits?limit=20` | Latest commit 2026-11-01. Latest release seen: `@strudel/core@1.2.4` (2025-09-10) | AGPL-3.0 (code) |
| 2 | **Stock tunes file**: `website/src/repl/tunes.mjs` | https://codeberg.org/uzu/strudel/src/branch/main/website/src/repl/tunes.mjs | 32 exported tunes: Felix Roos originals plus covers (Coltrane "Giant Steps", Koji Kondo, Hirokazu Tanaka) and a Barry Harris exercise | File RSS: https://codeberg.org/uzu/strudel/rss/branch/main/website/src/repl/tunes.mjs · API: `…/commits?path=website/src/repl/tunes.mjs` | Rarely changes. Last change 2025-12-13 ("Make legacy the default") | Per-tune header **CC BY-NC-SA 4.0**, `@by Felix Roos`. Covers have no license line. |
| 3 | Drum-pattern file: `website/src/repl/drum_patterns.mjs` | https://codeberg.org/uzu/strudel/src/branch/main/website/src/repl/drum_patterns.mjs | Genre drum grooves (Afro etc.) | Same as #1 | Rare | Header says it is derived from https://github.com/lvm/tidal-drum-patterns ("licensed under GPL-3.0") |
| 4 | `examples/` directory in the repo | https://codeberg.org/uzu/strudel/src/branch/main/examples | **Not songs.** Embedding and integration demos (buildless, codemirror-repl, headless-repl, minimal-repl, superdough, tidal-repl) | Same as #1 | n/a | AGPL-3.0 |
| 5 | GitHub mirror / legacy repo | https://github.com/tidalcycles/strudel | Archived 2025-06-19 (read-only), labelled "MOVED TO CODEBERG" | Do not monitor. Use it only for old links. | Frozen | AGPL-3.0 |
| 6 | **strudel.cc REPL + Shuffle** | https://strudel.cc/ | The shuffle (random) button calls `getRandomTune()`, which picks a random **Featured** community pattern (`website/src/repl/util.mjs`). Stock tunes are currently **commented out** of the pattern browser (`useExamplePatterns.jsx`). | Use the REPL's Shuffle by hand. Source: https://codeberg.org/uzu/strudel/src/branch/main/website/src/repl/util.mjs | Changes whenever maintainers feature a share | Community shares: no license stated |
| 7 | **Community Bakery** (Featured + Latest shares) | https://strudel.cc/bakery/ (anchors `#featured`, `#latest`) | All patterns shared publicly from the REPL, as short links `https://strudel.cc/?<hash>` | Visit the page weekly. It renders client-side; there is no RSS. | Continuous ("Latest") | No license stated. Ask the author (most shares are anonymous, so attribution may come only from an `@by` line in the code). |
| 8 | **Showcase** (video list) | https://strudel.cc/intro/showcase/ (source: https://codeberg.org/uzu/strudel/src/branch/main/website/src/components/Showcase.jsx) | About 35 curated YouTube performances (DJ_Dave, Switch Angel, eddyflux, froos, TOPLAP solstice sets…) | Watch `Showcase.jsx` through the repo RSS | When a PR adds videos | YouTube standard license. The code is not licensed. |
| 9 | **Docs / workshop / recipes** | https://strudel.cc/workshop/getting-started/ · https://strudel.cc/workshop/first-sounds/ · https://strudel.cc/learn/getting-started/ · https://strudel.cc/recipes/recipes/ · https://strudel.cc/blog/ | Tutorials and technique snippets | Repo RSS (#1). The blog page is at /blog/. | With releases | AGPL-3.0 (part of the repo). FAQ restriction on AI training. |
| 10 | **Uzu forum** (successor to club.tidalcycles.org; old Strudel category URL 301s here) | https://uzu.lurk.org/c/strudel/ · old: https://club.tidalcycles.org/c/strudel/ | 73+ Strudel topics: help threads, "week N exploring Strudel" shares, the long-running **Strudel pattern thread** (https://uzu.lurk.org/t/strudel-pattern-thread/4044) | Category RSS: https://uzu.lurk.org/c/strudel/26.rss · JSON: https://uzu.lurk.org/c/strudel/l/latest.json | Several posts a month (latest 2026-10-28) | No license stated for posted code. Ask the author. |
| 11 | **Uzu Discord** (the Strudel channels) | https://discord.com/invite/HGEdXmRkzT | Live chat with share channels | Manual. Needs an account; not machine-monitored. | Daily | Not stated. Ask. |
| 12 | Matrix | **UNVERIFIED**. Codeberg's footer links a Matrix space, but that belongs to Codeberg. No official Strudel Matrix room was found. `https://matrix.to/#/#tidal:matrix.org` loads, but matrix.to returns 200 for any room. | – | – | – | – |
| 13 | **@strudel on Mastodon** (official) | https://social.toplap.org/@strudel · RSS: https://social.toplap.org/@strudel.rss | Announcements and reshares | RSS | Weekly or so | Per post |
| 14 | Mastodon hashtags | https://social.toplap.org/tags/strudel (RSS `…/tags/strudel.rss`) · https://mastodon.social/tags/strudel.rss · https://mastodon.social/tags/livecoding.rss · https://mastodon.social/tags/algorave.rss | Clips, links to shares | RSS reader | Daily | Per post. Ask. |
| 15 | Bluesky hashtag | https://bsky.app/hashtag/strudel · https://bsky.app/search?q=%23strudel | Clips and links | Manual, or the public Bluesky search API (`app.bsky.feed.searchPosts?q=%23strudel`) – **API endpoint UNVERIFIED** | Daily | Per post |
| 16 | **TOPLAP** | https://toplap.org/ · RSS https://toplap.org/feed/ · blog https://blog.toplap.org/ | Live-coding org: news, solstice/equinox streams | RSS | Monthly | Per item |
| 17 | **Eulerroom** (YouTube channel for TOPLAP / algorave streams) | https://www.youtube.com/@Eulerroom | Archived stream sets (e.g. TOPLAP Solstice 2024: Switch Angel, BuboBubo, Bogdan Vera) | YouTube RSS: `https://www.youtube.com/feeds/videos.xml?channel_id=<id>` (look up the ID from the channel page) | Around stream events | YouTube standard |
| 18 | **algorave.com** | https://algorave.com/ · RSS https://algorave.com/feed/ · upcoming gigs https://algorave.com/?feed=gigpress (iCal `?feed=gigpress-ical`) | Event listings (2012→), compilations | RSS / iCal | Weekly | Per item |
| 19 | **Flok** (collaborative editor; supports Strudel) | https://flok.cc/ · code https://codeberg.org/munshkr/flok (GitHub https://github.com/munshkr/flok is archived) | Live P2P sessions. The README lists Strudel as a target. There is no public gallery of sessions. | Codeberg repo RSS | – | GPL-3.0+ (software) |
| 20 | **Pastagang / nudel** (Strudel jam collective) | https://pastagang.cc/ · https://nudel.cc/ | Collective jams; YouTube sets on @eddyflux | Visit by hand | Irregular | Not stated |
| 21 | **YouTube – Switch Angel** (Strudel performer, 157K subscribers) | https://www.youtube.com/@Switch-Angel (older channel: https://www.youtube.com/@im_switch_angel) | Narrated "coding X from scratch" videos: trance, DnB, acid, EDM | RSS: `https://www.youtube.com/feeds/videos.xml?channel_id=UCmHz7DQbbkcY_UoWY8bBJLw` | Weekly (latest 2026-10-24) | YouTube standard. The code is not licensed. Her helper functions are at #30. |
| 22 | YouTube – eddyflux | https://www.youtube.com/@eddyflux | Strudel jams and algorave sets, pastagang | RSS `…channel_id=UCCzL14wczvJyJaVYjh4nfJQ` | Monthly to quarterly (latest 2025-12-13) | YouTube standard |
| 23 | YouTube – DJ_Dave | https://www.youtube.com/@dj_dave____ | Pop-leaning live-coded sets (note: `@djdave` and `@DJ_Dave` are **different, unrelated** channels) | Channel page | Irregular | YouTube standard |
| 24 | YouTube – typedbeats | https://www.youtube.com/@typedbeats-daily | "Coding <genre> in Strudel (from scratch)" series | Channel RSS | Several a week (2026-10) | YouTube standard |
| 25 | YouTube – Glossing | https://www.youtube.com/@gglossingg | Technique tutorials (e.g. "You Can Modulate ANYTHING in Strudel", https://www.youtube.com/watch?v=11frBA9L638) | Channel RSS | – | YouTube standard |
| 26 | YouTube – others found | https://www.youtube.com/@iganu-music (jungle) · https://www.youtube.com/@WaveCodr (numbered "Strudel Live Coding #N") · https://www.youtube.com/@deformat (ambient/acid/DnB jams) · https://www.youtube.com/@MariaAreadne1 (covers) · https://www.youtube.com/@groovining (beginner tutorial) · https://www.youtube.com/@tidalcycles (TidalCycles collective; inactive since 2018) | Genre performances | Channel RSS | Varies | YouTube standard |
| 27 | Felix Roos (froos) on YouTube | **UNVERIFIED as a personal channel.** `@felixroos` and `@froos` do not resolve to him. His sets live on Eulerroom (https://www.youtube.com/watch?v=IcMSocdKwvw) and Web Audio Conf (https://www.youtube.com/watch?v=KWIotFWVOi4). | – | – | – | – |
| 28 | **GitHub search** | Repos: https://github.com/search?q=strudel+songs&type=repositories · Topics: https://github.com/topics/strudel · https://github.com/topics/strudel-cc · Code: https://github.com/search?q=%22strudel.cc%22+path%3A*.strudel&type=code | Song and pattern repos | `gh search repos strudel --sort stars` / `--sort updated`; Atom per repo: `https://github.com/<owner>/<repo>/commits/main.atom` | Daily | Per repo. Most song repos have **no license**. |
| 29 | **eefano/strudel-songs-collection** (488★) | https://github.com/eefano/strudel-songs-collection | About 90 songs, mostly covers (Depeche Mode, Radiohead, Shostakovich…), each with `@by` headers | Atom https://github.com/eefano/strudel-songs-collection/commits/main.atom | Monthly (pushed 2026-10-03) | **No license**. Covers also carry composition copyright. |
| 30 | **switchangel/strudel-scripts** (530★) | https://github.com/switchangel/strudel-scripts | Switch Angel's custom helper functions (prebake), not songs | Atom feed | Active (2026-10-31) | **No license** |
| 31 | smaudd/strudel-sessions | https://github.com/smaudd/strudel-sessions | 17 REPL sketches (basic-techno, lofi-1, monster-bass, raw-kick…) | Atom feed | Pushed 2026-01-06 | **No license** |
| 32 | tzwaan/strudel-scripts | https://github.com/tzwaan/strudel-scripts | `songs/` folder of game and classical covers, plus a DJ script | Atom feed | 2026-10-07 | **No license** |
| 33 | Mariaareadne1/maria-live-codes | https://github.com/Mariaareadne1/maria-live-codes | Covers (Megalovania, Feel Good Inc…) | Atom feed | 2026-07-30 | **No license** (the description invites "copy, paste… and play") |
| 34 | honcoops/strudel_trance | https://github.com/honcoops/strudel_trance | Trance examples and concept notes (`examples/01_driving_bassline.js`…) | Atom feed | 2025-11-15 | **No license** |
| 35 | Codeberg search | https://codeberg.org/explore/repos?q=strudel&sort=recentupdate · API `https://codeberg.org/api/v1/repos/search?q=strudel&sort=updated` | Mostly forks of uzu/strudel. One gallery tool: https://codeberg.org/javierorosario/strudel-music-library | API | – | Per repo |
| 36 | **terryds/awesome-strudel** (1,241★) | https://github.com/terryds/awesome-strudel | Curated tracks table (covers, with strudel.cc links + source posts), repos, tutorials, sample banks | Atom https://github.com/terryds/awesome-strudel/commits/main.atom | Weekly (pushed 2026-10-26) | **No license** on the list. Each track keeps its own author's terms. |
| 37 | toplap/awesome-livecoding (3,278★) | https://github.com/toplap/awesome-livecoding | Broad live-coding list (tools, papers, communities) | Atom feed | 2026-08-26 | No license file detected by the GitHub API |
| 38 | terryds/learning-music-production-with-strudel | https://github.com/terryds/learning-music-production-with-strudel | Beginner course (Chapter 1 "Making Beats") | Atom feed | 2025-11-15 | No license |
| 39 | Reddit | **UNVERIFIED**. reddit.com returned 403 to the checker. No dedicated r/strudel was confirmed by search. | – | – | – | – |
| 40 | Press / overviews | https://hackaday.com/2025/10/16/live-coding-techno-with-strudel · ICLC 2023 paper https://iclc.toplap.org/2023/catalogue/paper/strudel-live-coding-patterns-on-the-web.html | Context and discovery | Search alerts | – | – |

---

## 2. Notable pieces to start the repertoire (25)

Genre labels come from the piece's title or name, or from the techniques it uses. They are not the author's own tags unless the title says so. "Stock" = `tunes.mjs` (https://codeberg.org/uzu/strudel/src/branch/main/website/src/repl/tunes.mjs); line anchors point to each tune's header. Stock tunes have no individual dates; the file was last changed on 2025-12-13.

| # | Title | Author / handle | URL | Date | Genre | License / reuse status | What a learner gets |
|---|---|---|---|---|---|---|---|
| 1 | Caverave | Felix Roos (froos) | …/tunes.mjs#L125 | stock | Techno / rave | **CC BY-NC-SA 4.0** (explicit) | `struct` + `mask` arrangement, `scaleTranspose`, pianoroll visual |
| 2 | Amensister | Felix Roos | …/tunes.mjs#L739 | stock | Jungle / breaks | CC BY-NC-SA 4.0 | Amen-style break handling, `off` layering, filter ranges |
| 3 | Belldub | Felix Roos | …/tunes.mjs#L604 | stock | Dub | CC BY-NC-SA 4.0. Also credit the bell sample: "Hand Bells, B, Single.wav" by InspectorJ (Freesound), named in the tune header. | `delay`/`room` dub space, `degradeBy`, `superimpose` |
| 4 | Flatrave | Felix Roos | …/tunes.mjs#L711 | stock | Acid / rave | CC BY-NC-SA 4.0 | Filter envelope (`lpenv`) and cutoff sweeps |
| 5 | Bass fuge | Felix Roos | …/tunes.mjs#L532 | stock | Classical-inspired (fugue) | CC BY-NC-SA 4.0 | Counterpoint by `off`/`add` transposition, `sometimes` |
| 6 | Random bells | Felix Roos | …/tunes.mjs#L387 | stock | Generative / ambient | CC BY-NC-SA 4.0 | Randomness in scales, `range`, long slow layers |
| 7 | Dinofunk | Felix Roos | …/tunes.mjs#L644 | stock | Funk | CC BY-NC-SA 4.0 | `clip`, `superimpose`, groove with probability |
| 8 | Lounge sponge | Felix Roos (with Steven Yi's livecode.orc) | …/tunes.mjs#L830 | stock | Lounge / jazz | CC BY-NC-SA 4.0 | Chord `voicing`, Csound instrument use |
| 9 | Giant Steps (Coltrane) | in stock file, no `@by` | …/tunes.mjs#L70 | stock | Jazz cover | No license line; **the composition is under copyright** – link only | Fast chord changes with `voicing` |
| 10 | Coding DRUM and BASS | Switch Angel | https://www.youtube.com/watch?v=AJ7atBkisOU | 2025-09-19 | Drum & bass | Unknown – ask the author | Building DnB drums and bass from scratch, narrated |
| 11 | Livecoding melodic DNB music in Strudel | Switch Angel | https://www.youtube.com/watch?v=aPsq5nqvhxg | 2025-09-19 | Melodic DnB | Unknown – ask | Harmony over breakbeats |
| 12 | 2 Minute Deep Acid in Strudel (from scratch) | Switch Angel | https://www.youtube.com/watch?v=HkgV_-nJOuE | 2025-08-25 | Acid | Unknown – ask | Quick 303-style line: resonance and envelope |
| 13 | Coding Trance Music: in the beginning | Switch Angel | https://www.youtube.com/watch?v=YFQm8Hk73ug | 2025-11-10 | Trance | Unknown – ask | Supersaw and build-up structure |
| 14 | Amen break SPEEDRUN | Switch Angel | https://www.youtube.com/watch?v=EyoeaiNvX5g | 2025-06-20 | Breakcore / jungle | Unknown – ask | Fast break slicing |
| 15 | Chopping jungle breaks in #STRUDEL | Iganu music | https://www.youtube.com/watch?v=r5Fwq_97omQ | 2026-03-20 | Jungle | Unknown – ask | `chop`/slice break edits |
| 16 | Coding a Lo-fi Hip Hop Beat in Strudel (from scratch) | typedbeats | https://www.youtube.com/watch?v=zof_KwkpEgg | 2026-10-04 | Hip-hop / lo-fi | Unknown – ask | Swing and laid-back drums, dusty keys |
| 17 | Coding AMBIENT Music in Strudel (from scratch) | typedbeats | https://www.youtube.com/watch?v=vaO9SIi-TpQ | 2026-10-12 | Ambient | Unknown – ask | Slow pads, reverb, sparse randomness |
| 18 | Strudel Live Coding #39: Dark Dub Techno | Wave Coder | https://www.youtube.com/watch?v=75CIjnDfCHo | 2026-04-20 | Dub techno | Unknown – ask | Chord stabs through delay feedback |
| 19 | Strudel coding house music | dadadada | https://www.youtube.com/watch?v=PZheVcQFT1c | 2025-07-12 | House | Unknown – ask | Four-on-the-floor plus off-beat hats and chords |
| 20 | you will not steve reich your way out of it | scinziato | https://www.youtube.com/watch?v=xpILnXcWyuo | 2024-01-06 | Minimal / phase music | Unknown – ask | Phasing and process music in patterns (on the official Showcase) |
| 21 | dough dream #1 – strudel jam 12/03/23 | eddyflux | https://www.youtube.com/watch?v=p0J7XrT9JEs | 2023-12-03 | Experimental jam | Unknown – ask | Improvised long-form development (on the Showcase) |
| 22 | DJ_Dave – Array [Lil Data Edit] (Strudel Version) | DJ_Dave / Lil Data (uploader) | https://www.youtube.com/watch?v=KUujFuTcuKc | 2023-11-02 | Pop / hyperpop | Unknown – ask | Song-form pop arrangement in code (on the Showcase) |
| 23 | Waltz #2 (Shostakovich, "cps function demo") | eefano | https://github.com/eefano/strudel-songs-collection/blob/main/waltzno2.js | file in a repo pushed 2026-10-03 | Classical cover | Script: no license – ask. Composition: Shostakovich (d. 1975), likely still under copyright in many places. | Tempo changes with `cps` functions |
| 24 | Enjoy The Silence (coda) | eefano (song by Depeche Mode) | https://github.com/eefano/strudel-songs-collection/blob/main/enjoythesilence.js | repo pushed 2026-10-03 | Pop cover | No license; composition copyright – link only | Transcribing a pop arrangement |
| 25 | New Order – Blue Monday (Strudel REPL) | Lewis (@lewispeel) | https://www.youtube.com/watch?v=ilF4t0jSBUo (listed in https://github.com/terryds/awesome-strudel) | 2025-06-21 | Synth-pop cover | Unknown script license; composition copyright – link only | `arrange` sections and an iconic drum fill |

(`…/tunes.mjs` = `https://codeberg.org/uzu/strudel/src/branch/main/website/src/repl/tunes.mjs`.)

**Gaps:** Boom bap is covered only by #16 (lo-fi). The YouTube search "strudel boom bap" returned mostly non-Strudel beats. Further sources to mine: the repo's drum-pattern grooves (#3 in the source table), and smaudd's `basic-techno.js` / `lofi-1.js` (no license – ask).

---

## 3. Citation format and reuse rule

**Metadata block on every in-app example** (shown in the UI and stored as a header comment):

```
title:        <piece title as the author gives it>
author:       <real name if public, else handle>
handle:       <@handle + platform, e.g. "Switch-Angel (YouTube)">
source_url:   <canonical URL: repo file permalink at commit, strudel.cc/?hash, or video URL>
date:         <publication / commit date, YYYY-MM-DD>
license:      <exact license name + URL, e.g. "CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/"; or "none stated – used with permission (date, channel)">
composition:  <original composer/rights holder for covers, else "original">
adapted_by:   <soda-strudel contributor>
changes:      <one line: what changed – tempo, samples swapped, sections cut, API updated>
retrieved:    <YYYY-MM-DD>
```

**Reuse rules:**

1. **Link and credit always.** Linking out to any piece with title, author and URL is always fine.
2. **CC BY-NC-SA 4.0 stock tunes:** we may adapt them only if soda-strudel is non-commercial. Credit Felix Roos, give the license link, mark the changes, and release the adaptation under CC BY-NC-SA 4.0. If soda-strudel ever charges money, these must go back to link-only.
3. **AGPL-3.0 material** (docs snippets, repo code): we may adapt it if soda-strudel itself complies with the AGPL: the source is published and the license is kept. Keep the copyright notices.
4. **No license stated** (Bakery shares, forum posts, YouTube code, most GitHub song repos): **ask the author before adapting**. Until they answer, link only. Record the permission (date and channel) in `license:`.
5. **Covers:** the composition copyright belongs to a third party whatever license the script has. Use link-only, or limit to short educational excerpts after a rights check. Prefer originals and public-domain compositions (e.g. Bach, which typedbeats used in https://www.youtube.com/watch?v=K6RC5Rck46Q).
6. **AI caution:** the strudel.cc FAQ forbids training AI models on contributed examples without permission, and the uzu POLICY.md discourages LLM-generated contributions. Use automated harvesting only to **discover and index** (title, author, URL, license). Do not feed community code into model training or automated rewriting without explicit permission.
7. **Samples:** when you reuse a piece, check the license of each sample bank it loads (e.g. https://github.com/felixroos/dough-samples).

---

## 4. Weekly-harvest search queries

**Feeds to pull first (no searching needed):**
- https://codeberg.org/uzu/strudel.rss and https://codeberg.org/uzu/strudel/rss/branch/main/website/src/repl/tunes.mjs
- https://uzu.lurk.org/c/strudel/26.rss
- https://social.toplap.org/@strudel.rss, https://social.toplap.org/tags/strudel.rss, https://mastodon.social/tags/strudel.rss, https://mastodon.social/tags/algorave.rss, https://mastodon.social/tags/livecoding.rss
- https://algorave.com/?feed=gigpress (upcoming shows: streams to watch)
- YouTube RSS: `https://www.youtube.com/feeds/videos.xml?channel_id=UCmHz7DQbbkcY_UoWY8bBJLw` (Switch Angel), `…UCCzL14wczvJyJaVYjh4nfJQ` (eddyflux), plus typedbeats, Wave Coder and Iganu (get each channel's ID from its page)
- GitHub Atom: `https://github.com/eefano/strudel-songs-collection/commits/main.atom`, `https://github.com/terryds/awesome-strudel/commits/main.atom`
- Manual: https://strudel.cc/bakery/#featured and `#latest`

**Web search (exact strings):**
- `"strudel.cc/?" song`
- `"made with strudel" OR "made in strudel" live coding`
- `strudel live coding <genre>`: run once per genre (techno, house, ambient, "drum and bass", jungle, acid, dub, "boom bap", trance, cover)
- `"@by" "@license" strudel`: finds pieces that carry a license header
- `site:uzu.lurk.org strudel`
- `strudel algorave set 2026`

**GitHub (CLI or web):**
- `gh search repos strudel --sort updated --limit 50`
- `gh search repos "strudel songs" --sort stars`
- `gh search code "@license" "strudel.cc"` and `gh search code "@by" extension:strudel`
- Web: https://github.com/search?q=strudel+songs&type=repositories · https://github.com/topics/strudel · https://github.com/search?q=%22strudel.cc%22+path%3A*.strudel&type=code

**Codeberg:** `https://codeberg.org/api/v1/repos/search?q=strudel&sort=updated&limit=50` (filter out plain forks of uzu/strudel)

**Mastodon / Bluesky tags:** `#strudel`, `#strudelcc`, `#livecoding`, `#algorave`, `#tidalcycles`, `#toplap`. Bluesky: https://bsky.app/hashtag/strudel and https://bsky.app/search?q=%23strudel (`#strudelcc` not verified).

**YouTube search strings:** `strudel live coding <genre>` · `coding <genre> in strudel from scratch` · `strudel.cc jam` · `strudel cover` · `TOPLAP solstice stream strudel` · `algorave strudel set`. Sort by upload date, keep anything from the last 7 days, then run oEmbed (`https://www.youtube.com/oembed?url=<video>&format=json`) to record the author and title.

---

## Unverified / not found
- No official Strudel **Matrix** room confirmed (§1 #12).
- No **Reddit** r/strudel confirmed (403 to checker; §1 #39).
- No personal **Felix Roos YouTube** channel confirmed (§1 #27).
- Bakery **Featured/Latest contents** were not enumerated. The page renders client-side, and automated reads of its backing database were not attempted.
- Bluesky search API endpoint not tested.
