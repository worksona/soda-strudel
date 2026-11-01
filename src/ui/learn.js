// Page views: About (with the log), Examples, Reference, and the Editor section
// of Settings. Each returns an element; `rerender` redraws the page.
import { $, h } from './dom.js';
import { icon } from './icons.js';
import { CATEGORIES, EXAMPLES } from '../examples.js';
import { WORKSHOP } from '../workshop.js';
import { docText, findDoc, getDocs, loadDocs, renderDoc, applyEditorSettings, getEditorSettings } from '../editor/assist.js';
import { themes } from '@strudel/codemirror';
import { EDITOR_THEME_FOR, resolvedTheme } from '../theme.js';
import { lsGet, lsSet } from './dom.js';
import { KNOWN_REPOS, listRepo, parseRepo, repoSongItem } from '../share/repos.js';
import { loadLibrary, loadSampleFolder, loadedLibraries } from '../media/github.js';

// ---------- console: collect Strudel's log from the start ----------
const logs = [];
const logListeners = new Set();
document.addEventListener('strudel.log', (e) => {
  const { message, type } = e.detail ?? {};
  logs.push({ time: new Date(), message: String(message), type: type ?? 'info' });
  if (logs.length > 400) logs.shift();
  logListeners.forEach((fn) => fn());
});
export const onLog = (fn) => (logListeners.add(fn), () => logListeners.delete(fn));

const link = (href, text) => h('a', { href, target: '_blank', rel: 'noopener' }, text);
const kbd = (k) => h('kbd', {}, k);
const table = (rows, code = false) =>
  h('table.keys', {}, rows.map(([k, v]) => h('tr', {}, h('td', {}, code ? h('code', {}, k) : kbd(k)), h('td', {}, v))));

// ---------- About ----------
const VERSION = '0.0.1';
let logOpen = false;
export function aboutView(rerender, app) {
  return h(
    'div.about',
    {},
    h('p.lead', {}, h('strong', {}, 'soda.strudel'), ' – live-code music, pictures, camera and story in your browser, built on ', link('https://strudel.cc', 'Strudel'), '. Everything runs on your device; sketches share as links.'),
    h(
      'p.credit',
      {},
      'A personal project by David · ',
      h('a', { href: 'mailto:david@atomic47.co' }, 'david@atomic47.co'),
      ' · ',
      link('https://sodanovels.com', 'sodanovels.com'),
    ),
    h('h4', {}, 'How it works'),
    h(
      'ol.steps',
      {},
      h('li', {}, h('strong', {}, 'Write or open a sketch. '), 'Start from an Example, or type in the editor. Each ', h('code', {}, '$:'), ' line is a layer.'),
      h('li', {}, h('strong', {}, 'Press Play. '), 'ctrl+enter (cmd+enter on a Mac) plays your changes in time; ctrl+. stops.'),
      h('li', {}, h('strong', {}, 'Add pictures and words. '), h('code', {}, 'img()'), ', ', h('code', {}, 'cam()'), ', ', h('code', {}, 'visual()'), ' and ', h('code', {}, 'captions()'), ' are patterns too – they change with the music.'),
      h('li', {}, h('strong', {}, 'Save, share, export. '), 'File › Save keeps your work in this browser (your sketches are listed in the File menu), Share copies a link, Export makes a video, a WAV or a .soda file.'),
    ),
    h('h4', {}, 'Keys'),
    table([
      ['ctrl / cmd + enter', 'play / update (alt+enter too)'],
      ['ctrl / cmd + .', 'stop (alt+. too)'],
      ['ctrl / cmd + s', 'save the sketch'],
      ['ctrl / cmd + z', 'undo · add shift to redo'],
      ['ctrl / cmd + c · x · v', 'copy · cut · paste'],
      ['ctrl / cmd + f', 'find and replace'],
      ['ctrl / cmd + /', 'comment a line'],
      ['ctrl+space', 'show completions'],
      ['alt+w · alt+q', 'jump to the next / previous $: block'],
      ['point at a name', 'a hint: docs for a function, what a sound, effector, note or mini-notation symbol is'],
    ]),
    h('h4', {}, 'Mini-notation (inside double quotes)'),
    table(
      [
        ['"a b c"', 'a sequence in one cycle'],
        ['"[a b]"', 'squeeze into one step'],
        ['"<a b>"', 'one per cycle'],
        ['"a*4" / "a/2"', 'faster / slower'],
        ['"~"', 'rest'],
        ['"a, b"', 'together'],
        ['"a(3,8)"', 'Euclidean rhythm'],
        ['"a:2"', 'sample variation'],
        ['"a?"  "a|b"', 'maybe / random choice'],
      ],
      true,
    ),
    h('h4', {}, 'Picture'),
    h('pre', {}, `$: img("<night sea>").slow(4).fade(.3)
$: img("neon").lpf(sine.range(300, 8000)).room(.6)   // audio effects shape pictures too
$: cam().mirror(1).fx("posterize")
$: visual("particles").hue(200)
$: captions(['line one', '', 'line two'])`),
    h('h4', {}, 'Links'),
    h(
      'ul.links',
      {},
      h('li', {}, link('https://strudel.cc/workshop/getting-started/', 'Strudel workshop')),
      h('li', {}, link('https://strudel.cc/learn/mini-notation/', 'Mini-notation in depth')),
      h('li', {}, link('https://github.com/worksona/soda-strudel', 'Source code (AGPL-3.0)')),
      h('li', {}, h('a', { href: '/strudel-vibe.zip', download: 'strudel-vibe.zip' }, 'Claude skill (strudel-vibe.zip)')),
    ),
    h(
      'details.log-section',
      { open: logOpen, ontoggle: (e) => (logOpen = e.target.open) },
      h('summary', {}, `Log (${logs.length})`),
      consoleView(rerender),
    ),
    h('p.muted.version', {}, `soda.strudel ${VERSION} · `, h('button.link', { onclick: () => app?.showWelcome?.() }, 'Show the welcome again')),
  );
}

// ---------- Vibe: the strudel-vibe Claude skill ----------
const SKILL_REPO = 'https://github.com/worksona/strudel-vibe';
export function vibeView(app) {
  const step = (n, title, ...body) => h('li', {}, h('strong', {}, title), ' ', ...body);
  const prompt = (text) => h('li', {}, h('button.prompt', { title: 'Copy this prompt', onclick: () => navigator.clipboard?.writeText(text).then(() => app.toast('Prompt copied – paste it into Claude.')) }, `“${text}”`));
  return h(
    'div.vibe',
    {},
    h(
      'p.lead',
      {},
      h('strong', {}, 'Vibe it with Claude.'),
      ' Describe a mood, a story or a picture – the ',
      h('strong', {}, 'strudel-vibe'),
      ' skill writes the music, pictures and words as a soda.strudel sketch, checks it with Strudel’s real engine, and hands you a link that plays here.',
    ),
    h(
      'div.vibe-actions',
      {},
      h('a.button.primary', { href: '/strudel-vibe.zip', download: 'strudel-vibe.zip' }, icon('download', 16), ' Download the skill'),
      h('a.button', { href: SKILL_REPO, target: '_blank', rel: 'noopener' }, icon('external', 16), ' Skill on GitHub'),
      h('button', { onclick: () => $('#claude').click() }, icon('claude', 16), ' Copy this sketch for Claude'),
    ),
    h('h4', {}, 'Install'),
    h(
      'ol.steps',
      {},
      step(1, 'claude.ai –', 'download the skill above, then Settings › Capabilities › Skills › Upload.'),
      step(2, 'Claude Code –', h('code', {}, '/plugin marketplace add worksona/strudel-vibe'), ' then ', h('code', {}, '/plugin install strudel-vibe@strudel-vibe'), '.'),
      step(3, 'By hand –', 'unzip into ', h('code', {}, '~/.claude/skills/'), '.'),
    ),
    h('h4', {}, 'Ask for'),
    h(
      'ul.prompts',
      {},
      prompt('A 9:16 lo-fi piece about the last bus home, with captions.'),
      prompt('Something like a sunrise over the sea – ambient, no drums.'),
      prompt('Set this poem to music with pictures: …'),
      prompt('Make it darker, and add a breakbeat from clean-breaks.'),
    ),
    h('h4', {}, 'How it works'),
    h(
      'ol.steps',
      {},
      h('li', {}, 'Claude reads the vibe and picks tempo, sounds, pictures and shape.'),
      h('li', {}, 'It writes the sketch and validates it – syntax, sounds (including GitHub libraries), visuals, captions.'),
      h('li', {}, 'You get a link: open it, tap play, Remix to change it.'),
      h('li', {}, 'To keep going, press ', h('strong', {}, 'Claude'), ' in the toolbar – it copies your code, any error and your own sound names – and paste it into the chat.'),
    ),
    h('h4', {}, 'Links'),
    h(
      'ul.links',
      {},
      h('li', {}, link(SKILL_REPO, 'strudel-vibe on GitHub')),
      h('li', {}, link(`${SKILL_REPO}#readme`, 'Skill README – install, use, configure')),
      h('li', {}, link('https://strudel.cc/workshop/getting-started/', 'Strudel workshop')),
      h('li', {}, link('https://github.com/worksona/soda-strudel', 'soda.strudel source (AGPL-3.0)')),
    ),
  );
}

// ---------- Examples (two tabs: ours · Strudel's workshop) ----------
let examplesTab = 'examples';
const tabs = (current, items, onPick) =>
  h(
    'div.subtabs.segmented',
    { role: 'tablist' },
    items.map(([key, label]) => h('button', { role: 'tab', 'aria-selected': String(key === current), onclick: () => onPick(key) }, label)),
  );

// Listen buttons: hear something without touching the editor; the button turns
// into Stop while it plays, and back when anything else stops it.
let listening = null; // the Listen button that is playing now
let starting = false; // starting a Listen stops the editor first – ignore that stop
addEventListener('soda:playing', (e) => {
  if (!e.detail.previewing && listening && !starting) {
    listening.replaceChildren(icon('listen', listening.dataset.size ? Number(listening.dataset.size) : undefined), ' Listen');
    listening.setAttribute('aria-pressed', 'false');
    listening = null;
  }
});
function listenButton(app, start, size) {
  const b = h('button', { type: 'button', title: 'Hear it without changing your code', 'aria-pressed': 'false', ...(size ? { dataset: { size } } : {}) }, icon('listen', size), ' Listen');
  b.onclick = async () => {
    if (listening === b) return app.stop();
    if (listening) listening.replaceChildren(icon('listen', listening.dataset.size ? Number(listening.dataset.size) : undefined), ' Listen');
    listening = b;
    b.replaceChildren(icon('stop', size), ' Stop');
    b.setAttribute('aria-pressed', 'true');
    starting = true;
    try {
      await start();
    } finally {
      starting = false;
    }
  };
  return b;
}

const exampleActions = (app, code, ex) =>
  h(
    'div.ex-actions',
    {},
    listenButton(app, () => app.previewCode(code)),
    h('button', { title: 'Replace the editor with this example', onclick: () => app.loadExample(ex) }, icon('code'), ' Open'),
  );

/** "After Breath of Strudel by vakofmaya (CC BY 4.0)" – credit for examples made after someone else's work. */
const exampleCredit = (ex) =>
  ex.credit?.length
    ? h(
        'small.credit',
        {},
        'After ',
        ...ex.credit.flatMap((c, i) => [i ? '; ' : '', link(c.url, c.title), ` by ${c.by} (${c.license})${c.note ? ` – ${c.note}` : ''}`]),
      )
    : null;

function ourExamples(app) {
  return [
    h('p.muted', {}, 'Pieces that show what soda.strudel can do – music with pictures, words and story. Listen leaves your code alone; Open loads it.'),
    ...CATEGORIES.map((category) => {
      const list = EXAMPLES.filter((ex) => ex.category === category);
      if (!list.length) return null;
      return h(
        'section',
        {},
        h('h4', {}, category),
        h(
          'ul.examples',
          {},
          list.map((ex) =>
            h(
              'li',
              {},
              h('div.meta', {}, h('strong', {}, ex.title), h('small', {}, ex.about), exampleCredit(ex), h('small.shape', {}, ex.aspect === 'free' ? 'any shape' : `made for ${ex.aspect}`)),
              exampleActions(app, ex.code, ex),
            ),
          ),
        ),
      );
    }),
  ];
}

function workshop(app) {
  return [
    h(
      'p.muted',
      {},
      'Every example from the ',
      link('https://strudel.cc/workshop/getting-started/', 'Strudel workshop'),
      ', in order – the best way to learn Strudel step by step. Read along on the workshop pages; play and change the code here. (Strudel contributors, AGPL-3.0.)',
    ),
    ...WORKSHOP.map((chapter, ci) => {
      const details = h('details.chapter', { open: ci === 0 }, h('summary', {}, `${chapter.title} (${chapter.items.length})`));
      // chapters fill in when opened – there are ~150 examples
      const fill = () => {
        if (details.dataset.filled) return;
        details.dataset.filled = '1';
        let lastHeading = '';
        const list = h('ul.workshop', {});
        chapter.items.forEach((item, i) => {
          if (item.heading !== lastHeading) list.append(h('li.ws-heading', {}, item.heading));
          lastHeading = item.heading;
          const ex = { title: `${chapter.title} · ${item.heading}`, code: item.code, aspect: 'free' };
          list.append(h('li.ws-item', {}, h('pre', {}, item.code), exampleActions(app, item.code, ex)));
        });
        details.append(h('p', {}, link(chapter.url, `Read “${chapter.title}” on strudel.cc`)), list);
      };
      if (details.open) fill();
      else details.addEventListener('toggle', fill, { once: true });
      return details;
    }),
  ];
}

// ---------- Repertoire: Strudel pieces, lessons and sound banks by other people ----------
// Researched and cited in project-state (RES-M-001); built by `pnpm repertoire`.
// Policy (decision 2026-11-01-repertoire-reuse-policy): link and credit, never
// carry anyone's code – every card opens the original where its author put it.
let repertoire = null; // the loaded catalogue, or a promise while it loads
const rep = { view: 'collections', family: 'all', level: 'all', query: '', collection: null, shared: null, repo: null };
const repoCache = new Map(); // id -> listing | Promise | { error }
const SHORT = { dance: 'Dance', bass: 'Bass & breaks', game: 'Games', pop: 'Pop & rock', classical: 'Classical & jazz', ambient: 'Ambient' };
const REUSE = {
  adapt: ['Open licence (non-commercial)', 'CC BY-NC-SA – may be adapted with credit while soda.strudel is non-commercial'],
  open: ['Open licence', 'May be used with credit'],
  link: ['Listen at the source', "Someone else's song – listen and learn there"],
  ask: ['Ask the author', 'No licence stated – listen and learn there; ask the author before reusing'],
  check: ['Check first', 'Open licence, but check the contents before using'],
  no: ['Rights unclear', 'Listed for reference only'],
  ref: ['Link only', 'No open licence – listed for reference'],
  public: ['Opens here', 'Shared publicly by its author – opens here unchanged, with credit; ask them before reusing it'],
};
const matches = (item) => {
  const q = rep.query.trim().toLowerCase();
  return !q || [item.title, item.by, item.original, item.genre, item.about, item.teaches, item.type, ...(item.banks ?? [])].some((v) => v && String(v).toLowerCase().includes(q));
};
const repBadge = (reuse) => {
  const [label, title] = REUSE[reuse] ?? REUSE.ask;
  return h(`span.rep-badge.rep-${reuse}`, { title }, label);
};
const isYouTube = (url) => /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url ?? '');
const loadKey = (l) => (l.export ? `${l.url}#${l.export}` : l.track ? `${l.url}@${l.track}` : l.url);
const canOpen = (data, it) => !!it.load && (data.allow ?? []).includes(loadKey(it.load));
const listenPieceButton = (app, it) => listenButton(app, () => app.listenPiece(it), 14);
const openButton = (app, it) => h('button', { title: 'Open the song here, unchanged, with the credit on top', onclick: () => app.openPiece(it) }, icon('code', 14), ' Open here');
const watchButton = (app, it) => h('button', { title: 'Play the video beside the editor', onclick: () => app.watch(it) }, icon('play', 14), ' Watch here');
const repOpen = (url, label = 'Open') => (url ? h('a.rep-open', { href: url, target: '_blank', rel: 'noopener', title: url }, label, ' ', icon('external', 13)) : null);

const KIND = { song: 'Song', video: 'Video', lesson: 'Lesson', tool: 'Tool', bank: 'Sounds', example: 'soda example', event: 'Event' };

/** Opens Examples › Repertoire › Repositories › a repository (GitHub or Codeberg). */
export function showRepo(id) {
  examplesTab = 'repertoire';
  rep.view = 'repos';
  rep.query = '';
  rep.repo = id;
}

const userRepos = () => lsGet('soda.repos', []);

function reposView(app, rerender, data) {
  if (!rep.repo) {
    const input = h('input', { placeholder: 'owner/repo or a GitHub / Codeberg link', 'aria-label': 'Song repository', name: 'repo' });
    const add = (e) => {
      e.preventDefault();
      try {
        const r = parseRepo(input.value);
        lsSet('soda.repos', [...new Set([r.id, ...userRepos()])].slice(0, 30));
        rep.repo = r.id;
        rerender();
      } catch (err) {
        app.toast(err.message, { error: true });
      }
    };
    const card = (r, removable) =>
      h(
        'li',
        {},
        h(
          'button.rep-collection',
          { onclick: () => ((rep.repo = r.id), rerender()) },
          h('strong', {}, r.title ?? r.id.replace(/^\w+:/, '')),
          r.note ? h('small', {}, r.note) : null,
          h('small.rep-count', {}, r.id),
        ),
        removable ? h('button.icon', { title: 'Forget', 'aria-label': `Forget ${r.id}`, onclick: () => (lsSet('soda.repos', userRepos().filter((x) => x !== r.id)), rerender()) }, icon('trash', 14)) : null,
      );
    const mine = userRepos().filter((id) => !KNOWN_REPOS.some((k) => k.id === id));
    return [
      h('p.muted', {}, 'Many people keep their Strudel songs as files in a GitHub or Codeberg repository. Pick one – or add any repository – and every song in it opens here, credited to its owner.'),
      h('form.addlib', { onsubmit: add }, input, h('button', { type: 'submit' }, icon('github'), ' Open')),
      mine.length ? h('h4', {}, 'Added by you') : null,
      mine.length ? h('ul.rep-collections', {}, mine.map((id) => card({ id }, true))) : null,
      h('h4', {}, 'Found by our research'),
      h('ul.rep-collections', {}, KNOWN_REPOS.map((r) => card(r, false))),
    ];
  }
  const known = KNOWN_REPOS.find((k) => k.id === rep.repo);
  let entry = repoCache.get(rep.repo);
  if (!entry) {
    entry = listRepo(rep.repo).then(
      (listing) => (repoCache.set(rep.repo, listing), rerender()),
      (err) => (repoCache.set(rep.repo, { error: err.message }), rerender()),
    );
    repoCache.set(rep.repo, entry);
  }
  const back = h('button.icon', { title: 'All repositories', 'aria-label': 'All repositories', onclick: () => ((rep.repo = null), rerender()) }, icon('back', 16));
  const share = async () => {
    const url = `${location.origin}/#repo=${encodeURIComponent(rep.repo)}`;
    await navigator.clipboard?.writeText(url).then(() => app.toast('Repository link copied.'), () => prompt('Copy this link:', url));
  };
  const head = (title) => h('div.rep-coll-head', {}, back, h('h4', {}, title), h('button', { title: 'Copy a link that opens this repository in soda', onclick: share }, icon('share', 14), ' Share'));
  if (entry instanceof Promise) return [head(known?.title ?? rep.repo), h('p.muted', {}, 'Reading the repository…')];
  if (entry.error) return [head(known?.title ?? rep.repo), h('p.muted', {}, `Could not read it: ${entry.error}.`), h('button', { onclick: () => (repoCache.delete(rep.repo), rerender()) }, 'Try again')];
  const listing = entry;
  const q = rep.query.trim().toLowerCase();
  const songs = listing.songs.filter((s) => !q || s.title.toLowerCase().includes(q) || s.folder.toLowerCase().includes(q));
  const folders = [...new Set(songs.map((s) => s.folder))];
  return [
    head(known?.title ?? listing.info.title),
    h(
      'p.muted',
      {},
      listing.info.description ? `${listing.info.description} · ` : '',
      `${listing.songs.length} song files by ${listing.info.owner} · licence: ${listing.info.license} · `,
      h('a', { href: listing.info.url, target: '_blank', rel: 'noopener' }, 'on ', rep.repo.startsWith('codeberg') ? 'Codeberg' : 'GitHub'),
    ),
    listing.info.license === 'none stated' ? h('p.muted', {}, 'No licence stated: songs open here unchanged with the owner credited – ask them before reusing one.') : null,
    ...folders.map((folder) =>
      h(
        'section',
        {},
        folder ? h('h4', {}, folder) : null,
        h(
          'ul.rep-list',
          {},
          songs
            .filter((s) => s.folder === folder)
            .map((s) => {
              const item = repoSongItem(listing, s);
              return h('li', {}, h('div.meta', {}, h('strong', {}, s.title), h('small', {}, s.path), h('div.rep-foot', {}, listenPieceButton(app, item), openButton(app, item), repOpen(s.url, 'Source'))));
            }),
        ),
      ),
    ),
    songs.length ? null : h('p.muted', {}, q ? 'No song matches.' : listing.banks.length || listing.audio.length || listing.media.length ? 'No song files here – see the sounds and pictures below.' : 'No song files found here.'),
    ...repoResources(app, rerender, listing),
  ];
}

// sounds and pictures in a repository: strudel.json banks, loose audio folders, images and videos
function repoResources(app, rerender, listing) {
  const github = listing.repo.host === 'github';
  const isLoaded = (id) => loadedLibraries().some((l) => l.id === id);
  const busy = (b, fn) => async () => {
    b.disabled = true;
    try {
      await fn();
    } catch (e) {
      app.toast(e.message, { error: true });
    }
    rerender();
  };
  const out = [];
  if (listing.banks.length || listing.audio.length) {
    out.push(h('h4', {}, 'Sounds in this repository'));
    if (!github) out.push(h('p.muted', {}, 'Codeberg does not let browsers load its audio, so these sounds only open on Codeberg.'));
    const list = h('ul.rep-list', {});
    for (const bank of listing.banks) {
      const lib = loadedLibraries().find((l) => l.id === bank.id || l.id === bank.id.replace(/\/main$/, ''));
      const load = h('button', { type: 'button' }, icon('sounds', 14), ' Load sounds');
      load.onclick = busy(load, async () => {
        const l = await loadLibrary(bank.id);
        app.toast(`Loaded ${l.names.length} sounds from ${bank.folder || listing.info.title}.`);
      });
      list.append(
        h(
          'li',
          {},
          h(
            'div.meta',
            {},
            h('strong', {}, bank.folder || 'Sample bank (strudel.json)'),
            h('small', {}, lib ? `${lib.names.length} sounds: ${lib.names.slice(0, 12).join(', ')}${lib.names.length > 12 ? '…' : ''}` : bank.path),
            h(
              'div.rep-foot',
              {},
              github && !lib ? load : null,
              lib ? listenButton(app, () => app.previewCode(`$: s("<${lib.names.slice(0, 8).join(' ')}>").fast(2)`), 14) : null,
              lib ? h('button', { type: 'button', title: `Adds ${lib.code} to the top of your sketch`, onclick: () => app.prepend(lib.code) }, icon('plus', 14), ' Add to sketch') : null,
            ),
          ),
        ),
      );
    }
    for (const folder of listing.audio) {
      const id = `${listing.repo.id}#${folder.folder}`;
      const done = isLoaded(id);
      const load = h('button', { type: 'button' }, icon('sounds', 14), ' Load sounds');
      load.onclick = busy(load, async () => {
        await loadSampleFolder(id, folder.name, folder.files);
        app.toast(`Loaded ${folder.files.length} samples as "${folder.name}" – try s("${folder.name}:0").`);
      });
      list.append(
        h(
          'li',
          {},
          h(
            'div.meta',
            {},
            h('strong', {}, folder.folder === '.' ? 'Audio files' : folder.folder),
            h('small', {}, `${folder.files.length} audio files → s("${folder.name}") with :0…:${folder.files.length - 1}`),
            h(
              'div.rep-foot',
              {},
              github && !done ? load : null,
              done ? listenButton(app, () => app.previewCode(`$: s("${folder.name}").n("<${[...Array(Math.min(8, folder.files.length)).keys()].join(' ')}>").fast(2)`), 14) : null,
              done ? h('button', { type: 'button', onclick: () => app.insert(`$: s("${folder.name}").n("<${[...Array(Math.min(4, folder.files.length)).keys()].join(' ')}>")\n`) }, icon('plus', 14), ' Try it') : null,
            ),
          ),
        ),
      );
    }
    out.push(list);
  }
  if (listing.media.length) {
    out.push(h('h4', {}, `Pictures and videos (${listing.media.length})`));
    if (!github) out.push(h('p.muted', {}, 'Codeberg does not let the stage draw its pictures – open them on Codeberg.'));
    out.push(
      h(
        'ul.rep-media',
        {},
        listing.media.slice(0, 60).map((m) =>
          h(
            'li',
            {},
            m.type === 'image' ? h('img', { src: m.raw, alt: m.name, loading: 'lazy' }) : h('div.rep-video', {}, icon('film', 22)),
            h('small', {}, m.name),
            github
              ? h(
                  'button',
                  {
                    type: 'button',
                    title: `Adds media({ ${m.name}: … }) and ${m.type === 'video' ? 'vid' : 'img'}("${m.name}") to your sketch`,
                    onclick: () => {
                      app.prepend(`media({ ${m.name}: '${m.raw}' })`);
                      app.append(`$: ${m.type === 'video' ? 'vid' : 'img'}("${m.name}")\n`);
                    },
                  },
                  icon('plus', 14),
                  ' Use',
                )
              : null,
          ),
        ),
      ),
    );
  }
  return out;
}

/** Opens Examples › Repertoire › a collection: a built-in one by id, or a shared one. */
export function showCollection(c) {
  examplesTab = 'repertoire';
  rep.view = 'collections';
  rep.query = '';
  if (c?.items) {
    rep.shared = c;
    rep.collection = 'shared';
  } else rep.collection = c?.id ?? null;
}

function collectionItem(app, data, it) {
  const loadable = canOpen(data, it);
  const actions = [];
  if (loadable) actions.push(listenPieceButton(app, it), openButton(app, it));
  if (isYouTube(it.url)) actions.push(watchButton(app, it));
  if (it.example) {
    const ex = EXAMPLES.find((e) => e.title === it.example);
    if (ex) actions.push(listenButton(app, () => app.previewCode(ex.code), 14), h('button', { onclick: () => app.loadExample(ex) }, icon('code', 14), ' Open'));
  }
  if (it.try) actions.push(listenButton(app, () => app.previewCode(it.try), 14), h('button', { title: 'Adds a line that uses these sounds to your sketch', onclick: () => app.insert(it.try) }, icon('sounds', 14), ' Try it'));
  else if (it.samples) actions.push(h('button', { title: `Adds ${it.samples} to the top of your sketch`, onclick: () => app.prepend(it.samples) }, icon('sounds', 14), ' Use sounds'));
  if (it.url) actions.push(repOpen(it.url, isYouTube(it.url) ? 'YouTube' : 'Source'));
  const badge = it.example ? null : repBadge(loadable ? (it.reuse === 'open' ? (/NC/.test(it.license ?? '') ? 'adapt' : 'open') : 'public') : it.reuse === 'open' ? 'open' : it.reuse ?? 'link');
  return h(
    'li',
    {},
    h(
      'div.meta',
      {},
      h('strong', {}, it.title),
      h('small', {}, [KIND[it.kind] ?? it.kind, it.by && `by ${it.by}`, it.original && `original: ${it.original}`, it.genre, it.level, it.date].filter(Boolean).join(' · ')),
      it.note ? h('small', {}, it.note) : null,
      h('div.rep-foot', {}, badge, ...actions),
    ),
  );
}

function collectionsView(app, rerender, data) {
  const list = data.collections ?? [];
  const current = rep.collection === 'shared' ? rep.shared : list.find((c) => c.id === rep.collection);
  if (!current) {
    return [
      h('p.muted', {}, 'Hand-picked sets from our research. Pieces with an open licence open right here, with the credit on top; the rest open where their authors shared them.'),
      h(
        'ul.rep-collections',
        {},
        list.map((c) => {
          const open = c.items.filter((it) => it.load || it.example || it.try).length;
          return h(
            'li',
            {},
            h(
              'button.rep-collection',
              { onclick: () => ((rep.collection = c.id), rerender()) },
              h('strong', {}, c.title),
              h('small', {}, c.blurb),
              h('small.rep-count', {}, `${c.items.length} items${open ? ` · ${open} open here` : ''}${c.level && c.level !== 'all' ? ` · ${c.level}` : ''}`),
            ),
          );
        }),
      ),
    ];
  }
  const share = async () => {
    const { encodeCollection } = await import('../share/sketch.js');
    const frag = rep.collection === 'shared' ? await encodeCollection(current) : `collection=${current.id}`;
    const url = `${location.origin}/#${frag}`;
    await navigator.clipboard?.writeText(url).then(
      () => app.toast('Collection link copied.'),
      () => prompt('Copy this link:', url),
    );
  };
  return [
    h(
      'div.rep-coll-head',
      {},
      h('button.icon', { title: 'All collections', 'aria-label': 'All collections', onclick: () => ((rep.collection = null), (rep.shared = null), rerender()) }, icon('back', 16)),
      h('h4', {}, current.title, rep.collection === 'shared' ? h('small.rep-shared', {}, ' shared with you') : null),
      h('button', { title: 'Copy a link that opens this collection', onclick: share }, icon('share', 14), ' Share'),
    ),
    current.blurb ? h('p.muted', {}, current.blurb) : null,
    h('ul.rep-list', {}, current.items.map((it) => collectionItem(app, data, it))),
  ];
}

function repertoireView(app, rerender) {
  if (!repertoire) {
    repertoire = fetch('/repertoire.json')
      .then((r) => r.json())
      .then((data) => ((repertoire = data), rerender()))
      .catch(() => ((repertoire = { error: true }), rerender()));
  }
  if (repertoire instanceof Promise) return [h('p.muted', {}, 'Loading the repertoire…')];
  if (repertoire.error) return [h('p.muted', {}, 'The repertoire could not be loaded – check your connection.')];
  const data = repertoire;
  const search = h('input.rep-search', {
    type: 'search',
    placeholder: 'Search titles, artists, genres, techniques…',
    value: rep.query,
    'aria-label': 'Search the repertoire',
    oninput: (e) => {
      rep.query = e.target.value;
      clearTimeout(search.timer);
      search.timer = setTimeout(() => {
        rerender();
        const again = $('.rep-search');
        again?.focus();
        again?.setSelectionRange(rep.query.length, rep.query.length);
      }, 200);
    },
  });
  const chip = (key, label, current, onPick) => h('button.chip', { 'aria-pressed': String(key === current), onclick: () => (onPick(key), rerender()) }, label);
  const head = [
    h('p.muted', {}, 'Strudel songs, lessons and sound banks made by other people – found, checked and credited by our research. Each one opens where its author shared it.'),
    tabs(rep.view, [
      ['collections', `Collections (${data.collections?.length ?? 0})`],
      ['repos', 'Repositories'],
      ['songs', `Songs (${data.songs.length})`],
      ['learn', `Learn (${data.learn.length})`],
      ['sounds', `Sounds (${data.sounds.length})`],
    ], (t) => ((rep.view = t), rerender())),
    rep.view === 'collections' || (rep.view === 'repos' && !rep.repo) ? null : search,
  ];
  let body;
  if (rep.view === 'collections') {
    body = collectionsView(app, rerender, data);
  } else if (rep.view === 'repos') {
    body = reposView(app, rerender, data);
  } else if (rep.view === 'songs') {
    const fams = Object.entries(data.families);
    const list = data.songs.filter((s) => (rep.family === 'all' || s.family === rep.family) && matches(s));
    body = [
      h('div.chips', {}, chip('all', 'All', rep.family, (k) => (rep.family = k)), ...fams.map(([k, label]) => chip(k, SHORT[k] ?? label, rep.family, (f) => (rep.family = f)))),
      ...fams
        .filter(([k]) => rep.family === 'all' || rep.family === k)
        .map(([k, label]) => {
          const items = list.filter((s) => s.family === k).sort((a, b) => (b.key ? 1 : 0) - (a.key ? 1 : 0) || a.title.localeCompare(b.title));
          if (!items.length) return null;
          return h(
            'section',
            {},
            h('h4', {}, label),
            h(
              'ul.rep-list',
              {},
              items.map((s) =>
                h(
                  'li',
                  {},
                  h(
                    'div.meta',
                    {},
                    h('strong', {}, s.title, s.key ? h('span.rep-star', { title: 'A good place to start' }, ' ★') : null),
                    h('small', {}, [`by ${s.by}`, s.original ? `original: ${s.original}` : null, s.genre, s.date].filter(Boolean).join(' · ')),
                    h('small', {}, s.teaches ? `Teaches: ${s.teaches}` : s.about),
                    h(
                      'div.rep-foot',
                      {},
                      repBadge(canOpen(data, s) && s.reuse !== 'adapt' && s.reuse !== 'open' ? 'public' : s.reuse),
                      canOpen(data, s) ? listenPieceButton(app, s) : null,
                      canOpen(data, s) ? openButton(app, s) : null,
                      isYouTube(s.url) ? watchButton(app, s) : null,
                      repOpen(s.url, isYouTube(s.url) ? 'YouTube' : 'Source'),
                      s.source && s.source !== s.url ? repOpen(s.source, 'Source') : null,
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
    ];
    if (!list.length) body.push(h('p.muted', {}, 'Nothing matches – try another word or genre.'));
  } else if (rep.view === 'learn') {
    const levels = [
      ['first steps', 'First steps'],
      ['intermediate', 'Intermediate'],
      ['performer', 'Performer'],
      ['all', 'For everyone'],
    ];
    const list = data.learn.filter((r) => (rep.level === 'all' || r.level === rep.level || r.level === 'all') && matches(r));
    body = [
      h('div.chips', {}, chip('all', 'All levels', rep.level, (k) => (rep.level = k)), ...levels.slice(0, 3).map(([k, label]) => chip(k, label, rep.level, (l) => (rep.level = l)))),
      ...levels.map(([lv, label]) => {
        const items = list.filter((r) => r.level === lv);
        if (!items.length) return null;
        return h(
          'section',
          {},
          h('h4', {}, label),
          h(
            'ul.rep-list',
            {},
            items.map((r) =>
              h(
                'li',
                {},
                h(
                  'div.meta',
                  {},
                  h('strong', {}, r.title),
                  h('small', {}, [r.type, r.by, r.license && r.license !== 'not stated' ? r.license : null].filter(Boolean).join(' · ')),
                  h('small', {}, r.about),
                  h('div.rep-foot', {}, isYouTube(r.url) ? watchButton(app, r) : null, repOpen(r.url, isYouTube(r.url) ? 'YouTube' : 'Open')),
                ),
              ),
            ),
          ),
        );
      }),
    ];
  } else {
    const list = data.sounds.filter(matches);
    body = [
      h('p.muted', {}, 'Sample banks on GitHub. Banks marked Open licence can be loaded with credit: ', h('code', {}, "samples('github:owner/repo')"), '.'),
      h(
        'ul.rep-list',
        {},
        list.map((b) =>
          h(
            'li',
            {},
            h(
              'div.meta',
              {},
              h('strong', {}, b.title),
              h('small', {}, `${b.license} · ${b.count} sounds${b.banks.length ? `: ${b.banks.slice(0, 8).join(', ')}${b.count > 8 ? '…' : ''}` : ''}`),
              b.note ? h('small', {}, b.note) : null,
              b.load ? h('code.rep-load', {}, b.load) : null,
              h('div.rep-foot', {}, repBadge(b.reuse), h('button', { type: 'button', title: 'See what is in this repository, and load its sounds', onclick: () => (showRepo(`github:${b.title}`), rerender()) }, icon('library', 14), ' Browse'), repOpen(b.url)),
            ),
          ),
        ),
      ),
    ];
  }
  return [...head, ...body, h('p.muted.rep-credit', {}, data.credit, ` Updated ${data.updated}.`)].filter(Boolean);
}

export function examplesView(app, rerender) {
  return h(
    'div.examples-wrap',
    {},
    tabs(examplesTab, [
      ['examples', 'Examples'],
      ['workshop', 'Workshop'],
      ['repertoire', 'Repertoire'],
    ], (t) => ((examplesTab = t), rerender())),
    ...(examplesTab === 'workshop' ? workshop(app) : examplesTab === 'repertoire' ? repertoireView(app, rerender) : ourExamples(app)).filter(Boolean),
  );
}

// ---------- Reference ----------
const ref = { query: '', selected: 'note' };
export function referenceView(app, rerender) {
  const all = getDocs();
  if (!all.length) {
    loadDocs().then(rerender);
    return h('p.muted', {}, 'Loading reference…');
  }
  const q = ref.query.toLowerCase();
  const matches = all.filter(
    (d) => !q || d.name.toLowerCase().includes(q) || d.synonyms?.some((s) => s.toLowerCase().includes(q)) || (q.length > 3 && docText(d.description).toLowerCase().includes(q)),
  );
  // keep the selection while it still matches the search, otherwise show the first match
  const selected = matches.some((d) => d.name === ref.selected) ? findDoc(ref.selected) : matches[0];
  const search = h('input', {
    type: 'search',
    value: ref.query,
    placeholder: `Search ${all.length} functions`,
    'aria-label': 'Search functions',
    oninput: (e) => {
      ref.query = e.target.value;
      rerender({ focus: 'input[type=search]' });
    },
  });
  return h(
    'div.reference',
    {},
    h('label.search', {}, icon('search'), search),
    h(
      'div.ref-split',
      {},
      h(
        'ul.ref-list',
        {},
        matches.slice(0, 300).map((d) =>
          h('li', {}, h('button', { className: d.name === selected?.name ? 'current' : '', onclick: () => ((ref.selected = d.name), rerender()) }, d.name, d.tags?.includes('soda') ? h('small', {}, ' soda') : null)),
        ),
      ),
      selected
        ? h(
            'div.ref-doc',
            {},
            renderDoc(selected, { examples: false }),
            selected.synonyms?.length ? h('p.muted', {}, `Also: ${selected.synonyms.join(', ')}`) : null,
            ...(selected.examples ?? []).map((ex) =>
              h(
                'div.example',
                {},
                h('pre', {}, ex),
                h(
                  'div.row',
                  {},
                  h('button', { onclick: () => app.previewCode(ex) }, icon('listen'), ' Listen'),
                  h('button', { onclick: () => app.insert(`\n$: ${ex.replace(/\n/g, '\n  ')}\n`) }, icon('plus'), ' Insert'),
                ),
              ),
            ),
          )
        : h('p.muted', {}, 'No match.'),
    ),
  );
}

// ---------- Console ----------
export function consoleView(rerender) {
  // shown inside About › Log
  return h(
    'div.console',
    {},
    h('div.row', {}, h('button', { onclick: () => ((logs.length = 0), rerender()) }, icon('trash'), ' Clear')),
    logs.length
      ? h('ol.log', {}, [...logs].reverse().map((l) => h('li', { className: l.type }, h('time', {}, l.time.toLocaleTimeString()), ' ', l.message)))
      : h('p.muted', {}, 'Strudel messages (loading, evaluation, errors) appear here.'),
  );
}

// ---------- Editor (a section of Settings) ----------
/** 'auto' follows the app's light / dark theme; anything else is a fixed Strudel theme. */
export const editorThemeChoice = () => lsGet('soda.editorTheme', 'auto');

export function editorView(app, rerender) {
  const s = getEditorSettings();
  const set = (patch) => {
    applyEditorSettings(app.mirror, patch);
    rerender();
  };
  const toggle = (key, label) => h('label.toggle', {}, h('input', { type: 'checkbox', checked: !!s[key], onchange: (e) => set({ [key]: e.target.checked }) }), label);
  return h(
    'div.editor-settings',
    {},
    h(
      'label.field',
      {},
      'Editor theme',
      h(
        'select',
        {
          onchange: (e) => {
            const choice = e.target.value;
            lsSet('soda.editorTheme', choice);
            set({ theme: choice === 'auto' ? EDITOR_THEME_FOR[resolvedTheme()] : choice });
          },
        },
        h('option', { value: 'auto', selected: editorThemeChoice() === 'auto' }, 'Match the app (light / dark)'),
        Object.keys(themes).map((t) => h('option', { value: t, selected: editorThemeChoice() === t }, t)),
      ),
    ),
    h(
      'label.field',
      {},
      'Keys (play, stop, undo, copy and paste work in every mode)',
      h(
        'select',
        { onchange: (e) => set({ keybindings: e.target.value }) },
        Object.entries({ codemirror: 'Standard', vscode: 'VS Code', vim: 'Vim', emacs: 'Emacs' }).map(([k, label]) => h('option', { value: k, selected: k === s.keybindings }, label)),
      ),
    ),
    h('label.field', {}, `Font size (${s.fontSize}px)`, h('input', { type: 'range', min: 10, max: 32, value: s.fontSize, onchange: (e) => set({ fontSize: Number(e.target.value) }) })),
    h(
      'label.field',
      {},
      'Font',
      h(
        'select',
        { onchange: (e) => set({ fontFamily: e.target.value }) },
        ['monospace', 'ui-monospace, SFMono-Regular, Menlo, monospace', 'Courier New, monospace', 'Consolas, monospace'].map((f) => h('option', { value: f, selected: f === s.fontFamily }, f.split(',')[0])),
      ),
    ),
    toggle('isAutoCompletionEnabled', 'Autocomplete functions, sounds and media'),
    toggle('isBracketClosingEnabled', 'Close brackets'),
    toggle('isBracketMatchingEnabled', 'Match brackets'),
    toggle('isLineNumbersDisplayed', 'Line numbers'),
    toggle('isLineWrappingEnabled', 'Wrap long lines (always on for phones)'),
    toggle('isActiveLineHighlighted', 'Highlight the current line'),
    toggle('isPatternHighlightingEnabled', 'Highlight events as they play'),
    toggle('isFlashEnabled', 'Flash on evaluate'),
    toggle('isTabIndentationEnabled', 'Tab key indents'),
    toggle('isMultiCursorEnabled', 'Multiple cursors (ctrl/cmd + click)'),
  );
}
