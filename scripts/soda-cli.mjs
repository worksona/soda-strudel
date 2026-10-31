// Source of claude/skills/strudel-vibe/scripts/soda.mjs (bundled by scripts/build-skill.mjs).
//
//   node soda.mjs check  <sketch.json|code.js|->  [--title T] [--aspect 9:16]
//   node soda.mjs link   <sketch.json|code.js|->  [--title T] [--aspect 9:16] [--by NAME] [--site URL] [--force]
//   node soda.mjs decode <url>
//   node soda.mjs sounds [filter]
//   node soda.mjs media
import './quiet.mjs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSketch } from '../src/soda/validate.js';
import { decodeSketch, normalizeSketch, sketchUrl, LONG_LINK_WARNING } from '../src/share/sketch.js';
import { VISUALS, FX, BLENDS } from '../src/soda/catalog.js';

const here = dirname(fileURLToPath(import.meta.url));
const skillDir = join(here, '..');
const readJson = (name, fallback) => {
  try {
    return JSON.parse(readFileSync(join(skillDir, name), 'utf8'));
  } catch {
    return fallback;
  }
};

const [, , cmd, ...rest] = process.argv;
const flags = {};
const args = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) {
    const key = rest[i].slice(2);
    flags[key] = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
  } else args.push(rest[i]);
}

function readInput(path) {
  const text = !path || path === '-' ? readFileSync(0, 'utf8') : readFileSync(path, 'utf8');
  let sketch;
  try {
    const parsed = JSON.parse(text);
    sketch = typeof parsed === 'string' ? { code: parsed } : parsed;
  } catch {
    sketch = { code: text };
  }
  for (const k of ['title', 'aspect', 'by']) if (typeof flags[k] === 'string') sketch[k] = flags[k];
  return normalizeSketch(sketch);
}

const out = (obj) => process.stdout.write(`${JSON.stringify(obj, null, 2)}\n`);
const sounds = readJson('sounds.json', {});
const media = readJson('media.json', {});
const config = readJson('config.json', {});

async function main() {
  switch (cmd) {
    case 'check': {
      const sketch = readInput(args[0]);
      out(await validateSketch(sketch, { sounds, media }));
      break;
    }
    case 'link': {
      const sketch = readInput(args[0]);
      const result = await validateSketch(sketch, { sounds, media });
      if (!result.ok && !flags.force) {
        out({ ...result, link: null, hint: 'fix the errors (or pass --force) to get a link' });
        process.exitCode = 1;
        break;
      }
      const site = typeof flags.site === 'string' ? flags.site : process.env.SODA_SITE_URL ?? config.siteUrl;
      const link = await sketchUrl(sketch, site);
      out({ ...result, link, linkLength: link.length, longLink: link.length > LONG_LINK_WARNING });
      break;
    }
    case 'decode': {
      out(await decodeSketch(args[0]));
      break;
    }
    case 'sounds': {
      const filter = (args[0] ?? '').toLowerCase();
      const match = (n) => !filter || n.toLowerCase().includes(filter);
      out({
        synths: sounds.synths?.filter(match),
        packs: sounds.packs?.map((p) => ({ id: p.id, bank: p.bank, licence: p.licence, sounds: Object.keys(p.sounds).filter(match) })),
        defaults: sounds.defaults?.map((b) => ({ from: b.url.split('/').slice(-2).join('/'), sounds: Object.keys(b.sounds).filter(match).slice(0, filter ? 400 : 60) })),
        bankAliases: filter ? Object.fromEntries(Object.entries(sounds.bankAliases ?? {}).filter(([k, v]) => match(k) || match(v))) : undefined,
        note: 'Soundfonts: any gm_* name, e.g. gm_epiano1, gm_acoustic_bass. Banks: s("bd sd").bank("RolandTR909") == RolandTR909_bd. Pass a filter to search.',
      });
      break;
    }
    case 'media': {
      out({ packs: media.packs, visuals: VISUALS, fx: FX, blends: BLENDS });
      break;
    }
    default:
      process.stdout.write(`usage:
  node soda.mjs check  <sketch.json|code.js|->  [--title T] [--aspect free|9:16|1:1|16:9]
  node soda.mjs link   <sketch.json|code.js|->  [--title T] [--aspect …] [--by NAME] [--site URL] [--force]
  node soda.mjs decode <url>
  node soda.mjs sounds [filter]
  node soda.mjs media\n`);
      process.exitCode = cmd ? 1 : 0;
  }
}

main()
  .catch((e) => {
    out({ ok: false, errors: [e.message] });
    process.exitCode = 1;
  })
  // Strudel's scheduler leaves timers around; exit explicitly once output is written.
  .finally(() => setTimeout(() => process.exit(), 10));
