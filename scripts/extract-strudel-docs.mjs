// Extracts Strudel's function reference (the jsdoc JSON bundled inside
// @strudel/codemirror) and writes:
//   public/strudel-docs.json                                  – Reference panel + editor hints
//   claude/skills/strudel-vibe/references/functions.md        – compact list for the skill
// soda's own functions (src/soda/docs.js) are appended to both.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { SODA_DOCS } from '../src/soda/docs.js';

const require = createRequire(import.meta.url);
const bundle = await readFile(join(dirname(require.resolve('@strudel/codemirror/package.json')), 'dist/index.mjs'), 'utf8');

// the docs are inlined as JSON.parse(`[...]`) – read the template literal by hand
const start = bundle.indexOf('JSON.parse(`');
if (start < 0) throw new Error('Strudel docs not found in @strudel/codemirror bundle');
let i = start + 12;
while (i < bundle.length && bundle[i] !== '`') i += bundle[i] === '\\' ? 2 : 1;
const raw = JSON.parse(new Function(`return ${bundle.slice(start + 11, i + 1)}`)());

const strip = (html = '') =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const seen = new Set();
const strudel = raw
  .filter((doc) => doc.description && !doc.undocumented && (doc.name || doc.longname))
  .map((doc) => ({
    name: doc.name || doc.longname,
    description: doc.description,
    params: (doc.params ?? []).map((p) => ({ name: p.name, type: p.type, description: p.description })),
    examples: doc.examples ?? [],
    synonyms: doc.synonyms,
    tags: doc.tags?.map((t) => t.originalTitle ?? t.title).filter(Boolean),
  }))
  .filter((doc) => !seen.has(doc.name) && seen.add(doc.name));

const docs = [...strudel, ...SODA_DOCS].sort((a, b) => a.name.localeCompare(b.name));
await writeFile(new URL('../public/strudel-docs.json', import.meta.url), JSON.stringify(docs));

const lines = docs.map((doc) => {
  const syn = doc.synonyms?.length ? ` (also ${doc.synonyms.join(', ')})` : '';
  const ex = doc.examples?.[0] ? ` – e.g. \`${doc.examples[0].replace(/\n\s*/g, ' ').slice(0, 110)}\`` : '';
  const desc = strip(doc.description).split(/(?<=\.)\s/)[0].slice(0, 160);
  return `- **${doc.name}**${syn}: ${desc}${ex}`;
});
await writeFile(
  new URL('../claude/skills/strudel-vibe/references/functions.md', import.meta.url),
  `# Function index\n\nGenerated from Strudel's own reference plus soda's functions (${docs.length} entries).\nOne line each: name, synonyms, first sentence, first example. Search this file for a name.\n\n${lines.join('\n')}\n`,
);
console.log(`docs: ${strudel.length} strudel + ${SODA_DOCS.length} soda`);
