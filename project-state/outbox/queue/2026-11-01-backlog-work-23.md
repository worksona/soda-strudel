# Decide: does soda.strudel keep loading Dirt-Samples by default?

**Lane:** work · **Priority:** P1 · **Who:** a person decides · **Mandate:** RES-M-001

The sound bank rights check (documents/inbox/harvest-2026-11-01-sound-banks.json) found that **tidalcycles/Dirt-Samples** – which soda.strudel loads at start through dough-samples, exactly as strudel.cc does (src/strudel/setup.js) – fails our reuse policy: no licence, the maintainer has said many samples are of unknown provenance, and it includes the Amen break and other breaks.

Options:
1. **Keep it** as the community-standard default (same as strudel.cc), and say so on the Credits page. Most Strudel code and our workshop tab expect these names (bd, sd, hh, …).
2. **Keep it, but flag it**: an "unknown provenance" note in Sounds and in exports.
3. **Drop it** from the defaults and map the common names to cleared banks (soda pack, VCSL, uzu-drumkit). Many shared patterns and workshop examples would sound different or break.

Recommendation: 2 – it matches how the whole Strudel community works today, while being honest about it; revisit if soda.strudel ever goes commercial.
