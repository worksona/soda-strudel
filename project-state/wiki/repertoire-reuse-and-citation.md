---
id: repertoire-reuse-and-citation
kind: wiki-page
title: Reuse and citation rules
tags:
- repertoire
- policy
- citation
parent: repertoire
created: '2026-11-01T17:30:00Z'
created_by: dolsson@aimqc.com
last_modified: '2026-11-01T17:50:00Z'
last_modified_by: dolsson@aimqc.com
---
# Reuse and citation rules

Part of [[repertoire]]. **Decided 2026-11-01** by David Olsson – decision `2026-11-01-repertoire-reuse-policy`.

## The policy
1. **Felix Roos's stock tunes (CC BY-NC-SA 4.0)** may be adapted as soda.strudel examples while soda.strudel stays free and non-commercial. Each carries `@by Felix Roos`, `@license CC BY-NC-SA 4.0`, `@source` and a changes note; the adaptation is CC BY-NC-SA 4.0 too. If soda.strudel ever earns money, revisit this first.
2. **No license stated** (Bakery shares, YouTube, most song repos): link and credit by default. Adapt only after the author agrees **in writing**, and record that permission with the citation. **Covers** stay link-only whatever the script license.
3. **Sound banks:** soda.strudel loads or ships only open-licensed banks (MIT, CC0, CC-BY, GPL/AGPL), with credit, after a contents check for samples of commercial recordings. Everything else stays a link.
4. **Our Claude-run research indexes and links only.** It reads public pages to cite and describe; it never stores, copies or feeds other people's code into AI tooling, and the strudel-vibe skill does not learn from harvested pieces.

## What we may do with a piece

| Status | Meaning |
|---|---|
| 🔗 link only | The composition is under copyright, or the script has no license. Link and credit; never copy the code. |
| ✉️ ask author | No license stated. Link and credit; adapt only after a written yes from the author, recorded with the citation. |
| ✅ adapt with credit (NC-SA) | CC BY-NC-SA 4.0 (Felix Roos's stock tunes). May adapt while soda.strudel stays non-commercial, with attribution, a changes note and the same license on the adaptation. |
| ✅ usable with credit | Open license (MIT, CC0, CC-BY, GPL/AGPL), contents checked for commercial samples. Credit the author; GPL/AGPL terms apply to code. |
| ⛔ do not ship | Rights unclear or restricted (e.g. "personal use only", samples of commercial records). |

## Facts behind the rules
- Strudel software: AGPL-3.0 – https://codeberg.org/uzu/strudel
- Stock tunes (`website/src/repl/tunes.mjs`): per-tune `@license CC BY-NC-SA 4.0`, `@by Felix Roos`.
- strudel.cc FAQ: contributed tracks are licensed apart from the software and must not be used to train AI models without permission – https://strudel.cc/learn/faq/
- Strudel POLICY.md (2026-10-28): declines LLM-generated contributions; discourages importing the projects into AI platforms – https://codeberg.org/uzu/strudel/src/branch/main/POLICY.md
- Bakery, forum and YouTube shares, and almost all song repositories, state no license.
- Covers carry the original composer's copyright whatever license the script has.
- Sample banks carry their own per-bank licenses.

So our research **links and describes**; it never collects other people's code.

## Citation format
Every catalogued item records: title · author/handle · original artist (covers) · source URL (opened, working) · date or "undated" · genre or resource type and level · script license · composition status · reuse status · where we found it · audit date. An adapted example adds `@by`, `@license`, `@source` and an "adapted by soda.strudel – changes: …" note in its header.
