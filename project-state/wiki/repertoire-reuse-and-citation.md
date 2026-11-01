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
last_modified: '2026-11-01T17:30:00Z'
last_modified_by: dolsson@aimqc.com
---
# Reuse and citation rules

Part of [[repertoire]]. Proposed default – the decision is on the backlog ("Decide the reuse policy").

## What we may do with a piece

| Status | Meaning |
|---|---|
| 🔗 link only | The composition is under copyright, or the script has no license. Link and credit; never copy the code. |
| ✉️ ask author | No license stated. Link and credit; ask before showing or adapting the code. |
| ✅ adapt with credit (NC-SA) | CC BY-NC-SA 4.0 (Felix Roos's stock tunes). May adapt while soda.strudel stays non-commercial, with attribution, a changes note and the same license on the adaptation. |
| ✅ usable with credit | Open license (MIT, CC0, GPL/AGPL). Credit the author; GPL/AGPL terms apply to code. |
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
