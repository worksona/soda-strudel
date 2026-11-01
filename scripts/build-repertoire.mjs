// Builds public/repertoire.json – the Learn › Repertoire tab – from the research
// catalogue in project-state (documents/repertoire/catalogue.json, RES-M-001).
//   pnpm repertoire
// Reuse policy (decision 2026-11-01-repertoire-reuse-policy): the app links to
// other people's pieces and credits them; it never carries their code. Links that
// hold code in the URL (strudel.cc/#<base64>) are replaced by where we found them.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'project-state/documents/repertoire/catalogue.json';
const OUT = 'public/repertoire.json';
const cat = JSON.parse(readFileSync(SRC, 'utf8'));

const FAMILIES = {
  dance: 'Dance and electronic',
  bass: 'Bass, breaks and jungle',
  game: 'Video game and chiptune',
  pop: 'Pop, rock, metal and hip-hop',
  classical: 'Classical, jazz and traditional',
  ambient: 'Ambient, generative and experimental',
};

// a link that carries code (strudel.cc/#…) or was truncated in the catalogue is not shipped
const carriesCode = (u) => !u || u.includes('#Ly') || u.includes('…') || /strudel\.cc\/[^?]*#/.test(u) || u.length > 300;
const firstHttp = (...urls) => urls.find((u) => u && u.startsWith('http') && !carriesCode(u)) ?? null;
const foundIn = (e) => (e.cited_in ?? []).map((c) => c.match(/https?:\/\/\S+/)?.[0]).find(Boolean) ?? null;

const reuse = (r = '') =>
  r.startsWith('adapt') ? 'adapt' : r.startsWith('link') ? 'link' : r.startsWith('ask') ? 'ask' : r.startsWith('usable') ? 'open' : r.startsWith('do not') ? 'no' : r.startsWith('check') ? 'check' : 'ask';

const songs = cat.songs.map((s) => ({
  id: s.id,
  title: s.title,
  by: s.author,
  original: s.original_artist && !/not named|appears/.test(s.original_artist) ? s.original_artist : undefined,
  genre: s.genre,
  family: s.family,
  date: /^\d{4}-\d{2}-\d{2}$/.test(s.date ?? '') ? s.date : undefined,
  about: s.description,
  teaches: s.learn,
  license: s.script_license,
  reuse: reuse(s.reuse),
  key: s.key_starting || undefined,
  url: firstHttp(s.url, ...(s.sources ?? []).map((x) => x.url), foundIn(s)),
  source: firstHttp(...(s.sources ?? []).map((x) => x.url)),
}));

const learn = cat.resources.map((r) => ({
  id: r.id,
  title: r.title,
  by: r.author || undefined,
  type: r.type,
  level: r.level,
  about: r.description,
  license: r.license,
  url: r.url,
}));

const sounds = cat.sound_banks.map((b) => ({
  id: b.id,
  title: b.title,
  by: b.author,
  license: b.license,
  reuse: reuse(b.reuse),
  banks: b.bank_names?.slice(0, 12) ?? [],
  count: b.banks,
  note: b.rights_note ?? undefined,
  url: b.url,
}));

const out = {
  updated: cat.updated,
  credit: 'Researched and cited by soda.strudel (RES-M-001). Each piece belongs to its author; follow the link to hear or read it.',
  families: FAMILIES,
  songs,
  learn,
  sounds,
};
writeFileSync(OUT, JSON.stringify(out));
const missing = songs.filter((s) => !s.url).map((s) => s.id);
console.log(`repertoire: ${songs.length} songs, ${learn.length} learn, ${sounds.length} sound banks → ${OUT}${missing.length ? ` (no link: ${missing.join(', ')})` : ''}`);
