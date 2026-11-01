// Song repositories: GitHub or Codeberg repos where people keep their Strudel
// songs as files (eefano/strudel-songs-collection and many like it). soda lists
// the song files and opens any of them unchanged, credited to the repo's owner
// (decision 2026-11-01-open-public-songs-in-soda). GitHub answers the browser
// directly; Codeberg sends no CORS headers, so its listing and files come
// through /api/piece (codeberg.org only, text only, size-capped).

/** Song repositories found by the research (RES-M-001). `path` narrows a big repo to its songs. */
export const KNOWN_REPOS = [
  { id: 'github:eefano/strudel-songs-collection', title: "eefano's songs", note: '90+ songs: Cardiacs, Tim Smith and Sea Nymphs covers, originals, jam sessions.' },
  { id: 'github:Mariaareadne1/maria-live-codes', title: "MariaAreadne's covers", note: 'Live-coded covers: Megalovania, Feel Good Inc, Intro by The xx, Vardis Quo.' },
  { id: 'github:dotcomdudee/strudel-tracks', title: 'dotcomdudee tracks', note: 'Mostly techno, plus drum & bass.' },
  { id: 'github:ipkstef/strudel-sessions', title: 'ipkstef sessions', note: 'Liquid drum & bass and halftime by Stefanos Amanuel (several CC BY-NC-SA in the files).' },
  { id: 'github:smaudd/strudel-sessions', title: 'smaudd sessions', note: 'REPL sketches: basic techno, lo-fi and more.' },
  { id: 'github:kahlys/livecodingmusic', title: 'kahlys live coding', note: 'House, ambient and glitch ideas.' },
  { id: 'github:doctor-g/strudel_songs', title: 'doctor-g songs', note: "Paul Gestwicki's song experiments." },
  { id: 'github:lmorchard/starnet/audio-content/songs', title: 'Starnet game music', note: "Les Orchard's score for the game Starnet (AGPL-3.0)." },
  { id: 'github:semism/sonicism/strudel', title: 'semism', note: 'Glitch and wave sketches.' },
  { id: 'github:ikesau/ikesau.github.io/assets/strudel', title: 'ikesau', note: 'Footwork and jungle sketches by Ike Saunders.' },
  { id: 'codeberg:fcm/my-strudel-repo', title: 'fcm sessions', note: 'Sessions and patterns, CC BY-SA 4.0.' },
  { id: 'codeberg:taconi/sketches/musics', title: 'taconi sketches', note: 'Brazilian and generative sketches (CC BY-NC-SA in the files).' },
  { id: 'codeberg:ed_crub/ed-patterns-strudel', title: 'ed_crub patterns', note: 'Dub, ambient and more, 2024–2025.' },
];

const SONG_EXT = /\.(js|mjs|str|strudel|txt|tidal)$/i;
const NOT_SONGS = /(^|\/)(node_modules|\.github|\.vscode|dist|build|vendor|tests?|scripts?|lib|src\/components)\/|(^|\/)(package(-lock)?\.json|[\w.-]*config\.[cm]?js|eslint[\w.]*|vite\.[\w.]+|README[\w.]*|LICEN[CS]E[\w.]*|CHANGELOG[\w.]*|requirements\.txt|robots\.txt|CNAME)$/i;

/**
 * "github:owner/repo[/path]", "codeberg:owner/repo[/path]", "owner/repo", or a
 * github.com / codeberg.org URL (…/tree/<branch>/<path> or …/src/branch/<branch>/<path>).
 */
export function parseRepo(input) {
  let s = String(input ?? '').trim();
  if (!s) throw new Error('enter owner/repo or a GitHub or Codeberg link');
  let host = 'github';
  let branch = null;
  const url = s.match(/^https?:\/\/(?:www\.)?(github\.com|codeberg\.org)\/(.+)$/i);
  if (url) {
    host = url[1].toLowerCase().startsWith('codeberg') ? 'codeberg' : 'github';
    const parts = url[2].replace(/[#?].*$/, '').replace(/\/$/, '').split('/');
    const [owner, repo, kind, ...rest] = parts;
    let path = '';
    if (host === 'github' && (kind === 'tree' || kind === 'blob')) {
      branch = rest.shift() ?? null;
      path = rest.join('/');
    }
    if (host === 'codeberg' && kind === 'src') {
      rest.shift(); // branch | commit | tag
      branch = rest.shift() ?? null;
      path = rest.join('/');
    }
    if (!owner || !repo) throw new Error('expected a link to a repository');
    return { host, owner, repo: repo.replace(/\.git$/, ''), branch, path, id: `${host}:${owner}/${repo.replace(/\.git$/, '')}${path ? `/${path}` : ''}` };
  }
  const m = s.match(/^(github|codeberg):(.+)$/i);
  if (m) {
    host = m[1].toLowerCase();
    s = m[2];
  }
  const [owner, repo, ...path] = s.replace(/^\/|\/$/g, '').split('/');
  if (!owner || !repo || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) throw new Error('expected owner/repo');
  const p = path.join('/');
  return { host, owner, repo, branch, path: p, id: `${host}:${owner}/${repo}${p ? `/${p}` : ''}` };
}

/** True for files that look like songs (by extension, outside tooling folders). */
export const isSongFile = (path) => SONG_EXT.test(path) && !NOT_SONGS.test(path);

const titleOf = (path) =>
  decodeURIComponent(path.split('/').pop())
    .replace(/\.(strudel\.js|js|mjs|str|strudel|txt|tidal)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();

async function json(url) {
  const res = await fetch(url);
  if (res.status === 403 || res.status === 429) throw new Error('GitHub is limiting requests from this browser for a while – try again in an hour');
  if (res.status === 404) throw new Error('no such repository (or it is private)');
  if (!res.ok) throw new Error(`the repository could not be read (${res.status})`);
  return res.json();
}

const AUDIO = /\.(wav|mp3|ogg|flac|aif|aiff|m4a)$/i;
const IMAGE = /\.(png|jpe?g|gif|webp|svg)$/i;
const VIDEO = /\.(mp4|webm|mov)$/i;
/** A name Strudel accepts for a sound or a picture: letters, digits and _. */
export const soundName = (s) =>
  s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, '_$1') || 'sound';

/**
 * { info, songs, banks, audio, media }:
 *   songs – song files (open in the editor)
 *   banks – strudel.json sample maps ({ path, id } – id loads with samples('github:…'))
 *   audio – folders of audio with no strudel.json ({ folder, name, files: [raw urls] })
 *   media – pictures and videos ({ path, name, type, raw })
 */
export async function listRepo(input) {
  const r = typeof input === 'string' ? parseRepo(input) : input;
  let info;
  let tree;
  if (r.host === 'github') {
    const meta = await json(`https://api.github.com/repos/${r.owner}/${r.repo}`);
    const branch = r.branch ?? meta.default_branch;
    const t = await json(`https://api.github.com/repos/${r.owner}/${r.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    tree = t.tree.filter((e) => e.type === 'blob').map((e) => ({ path: e.path, size: e.size }));
    info = { title: meta.full_name, owner: meta.owner?.login ?? r.owner, license: meta.license?.spdx_id && meta.license.spdx_id !== 'NOASSERTION' ? meta.license.spdx_id : 'none stated', description: meta.description, url: meta.html_url, branch };
  } else {
    const res = await fetch(`/api/piece?${new URLSearchParams({ list: `codeberg:${r.owner}/${r.repo}`, ...(r.branch ? { branch: r.branch } : {}) })}`);
    if (!res.ok || /text\/html/.test(res.headers.get('content-type') ?? '')) throw new Error(res.ok ? 'Codeberg repositories need the deployed site' : (await res.text()) || `Codeberg answered ${res.status}`);
    const d = await res.json();
    tree = d.files;
    info = { ...d.info };
  }
  // a link to one file lists just that song; a folder lists what is under it
  const single = r.path && tree.some((f) => f.path === r.path) ? r.path : null;
  const base = r.path && !single ? `${r.path.replace(/\/$/, '')}/` : '';
  const songs = tree
    .filter((f) => (single ? f.path === single : !base || f.path.startsWith(base)) && isSongFile(f.path) && (f.size ?? 0) < 400_000)
    .map((f) => {
      const enc = f.path.split('/').map(encodeURIComponent).join('/');
      const html = r.host === 'github' ? `https://github.com/${r.owner}/${r.repo}/blob/${info.branch}/${enc}` : `https://codeberg.org/${r.owner}/${r.repo}/src/branch/${info.branch}/${enc}`;
      const raw = r.host === 'github' ? `https://raw.githubusercontent.com/${r.owner}/${r.repo}/${info.branch}/${enc}` : `https://codeberg.org/${r.owner}/${r.repo}/raw/branch/${info.branch}/${enc}`;
      const folder = single ? '' : f.path.slice(base.length).split('/').slice(0, -1).join('/');
      return { path: f.path, title: titleOf(f.path), folder, url: html, source: html, load: { url: raw } };
    })
    .sort((a, b) => a.folder.localeCompare(b.folder) || a.title.localeCompare(b.title));
  const inScope = (f) => !base || f.path.startsWith(base);
  const raw = (path) => {
    const enc = path.split('/').map(encodeURIComponent).join('/');
    return r.host === 'github' ? `https://raw.githubusercontent.com/${r.owner}/${r.repo}/${info.branch}/${enc}` : `https://codeberg.org/${r.owner}/${r.repo}/raw/branch/${info.branch}/${enc}`;
  };
  const dirOf = (path) => path.split('/').slice(0, -1).join('/');
  const jsons = single ? [] : tree.filter((f) => inScope(f) && /(^|\/)strudel\.json$/i.test(f.path));
  const banks = jsons.map((f) => {
    const dir = dirOf(f.path);
    return { path: f.path, folder: dir, id: r.host === 'github' ? `github:${r.owner}/${r.repo}/${info.branch}${dir ? `/${dir}` : ''}` : raw(f.path) };
  });
  const covered = (path) => jsons.some((j) => path.startsWith(dirOf(j.path) ? `${dirOf(j.path)}/` : ''));
  const audioByDir = new Map();
  if (!single)
    for (const f of tree) {
      if (!inScope(f) || !AUDIO.test(f.path) || covered(f.path)) continue;
      const dir = dirOf(f.path) || '.';
      if (!audioByDir.has(dir)) audioByDir.set(dir, []);
      audioByDir.get(dir).push(raw(f.path));
    }
  const used = new Set();
  const audio = [...audioByDir.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([folder, files]) => {
      // the last two folder levels name it (glockenspiel/fast → glockenspiel_fast), numbered if taken
      const rel = folder === '.' ? r.repo : folder.slice(base.length) || folder;
      let name = soundName(rel.split('/').slice(-2).join('_'));
      for (let n = 2; used.has(name); n++) name = `${soundName(rel.split('/').slice(-2).join('_'))}_${n}`;
      used.add(name);
      return { folder, name, files: files.sort() };
    });
  const media = single
    ? []
    : tree
        .filter((f) => inScope(f) && (IMAGE.test(f.path) || VIDEO.test(f.path)) && (f.size ?? 0) < 25_000_000 && !/(^|\/)(icons?|favicon|logo|screenshots?|\.github)(\/|[.-])/i.test(f.path))
        .map((f) => ({ path: f.path, name: soundName(f.path.split('/').pop()), type: VIDEO.test(f.path) ? 'video' : 'image', raw: raw(f.path) }));
  return { repo: r, info, songs, banks, audio, media };
}

/** The item soda opens: credited to the repository owner, with the repo's licence. */
export const repoSongItem = (listing, song) => ({
  kind: 'song',
  title: song.title,
  by: listing.info.owner,
  license: listing.info.license === 'none stated' ? 'not stated in the repository – check the file' : listing.info.license,
  reuse: /^(CC-BY|CC0|MIT|AGPL|GPL|Unlicense|Apache|BSD)/i.test(listing.info.license) ? 'open' : 'public',
  url: song.url,
  source: song.source,
  load: song.load,
});
