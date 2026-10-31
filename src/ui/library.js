// The Sounds and Media pages.
// Sounds is the one place for every sound – yours (uploads and mic takes), the
// soda pack, GitHub libraries and Strudel's own banks, synths and soundfonts –
// with one rule: click to hear, double-click (or Enter) to insert into the code.
import { h, toast, formatBytes } from './dom.js';
import { icon } from './icons.js';
import { listSounds, listMediaItems, storageStatus } from '../storage/db.js';
import { listMedia } from '../soda/mediaRegistry.js';
import { importFiles, onLibraryChange, removeMedia, removeSound } from '../media/library.js';
import { CURATED, forgetLibrary, githubLibraryOf, loadLibrary, loadedLibraries, onGithubChange } from '../media/github.js';
import { getAudioContext, soundMap, superdough } from '@strudel/webaudio';

export function createLibrary({ root, app, isVisible = () => null }) {
  let query = '';
  let pitchedSoda = new Set();
  fetch('/sounds.json')
    .then((r) => r.json())
    .then((s) => (pitchedSoda = new Set((s.packs ?? []).flatMap((p) => p.pitched ?? []))))
    .catch(() => {});

  const picker = h('input', {
    type: 'file',
    multiple: true,
    accept: 'audio/*,image/*,video/*',
    hidden: true,
    onchange: async () => {
      const added = await importFiles([...picker.files]);
      picker.value = '';
      toast(added.length ? `Added ${added.map((a) => a.name).join(', ')}` : 'Nothing importable in those files');
    },
  });
  const drop = (what) => h('div.drop', {}, `Drop ${what} anywhere, or `, h('button.link', { onclick: () => picker.click() }, 'choose files'), '. They stay in this browser.');

  // ---------- one way to hear and insert any sound ----------
  async function hear(name, pitched) {
    try {
      await app.ensureAudio();
      await superdough({ s: name, n: 0, ...(pitched ? { note: 48 } : {}) }, getAudioContext().currentTime + 0.05, 0.6);
    } catch (e) {
      toast(`Could not play ${name}: ${e.message}`, { error: true });
    }
  }
  // the last sound you tapped – a bar at the bottom of the page offers Insert,
  // so touch screens (no double-click) can insert too
  const pickBar = h('div.pick-bar', { hidden: true });
  function pick(label, code) {
    pickBar.replaceChildren(
      h('span.pick-name', {}, icon('sounds', 16), ` ${label}`),
      h('code', {}, code.replace(/^\$: /, '').trim()),
      h('button.primary', { onclick: () => app.insert(code) }, icon('plus', 16), ' Insert'),
    );
    pickBar.hidden = false;
  }

  /** A sound chip: label, what it plays, and the code it inserts. */
  const chip = ({ label, sound, code, pitched = false, title }) =>
    h(
      'button.chip',
      {
        className: pitched ? 'chip pitched' : 'chip',
        title: `${title ?? sound}\nclick: hear · double-click / Enter: insert`,
        onclick: () => (hear(sound, pitched), pick(label, code)),
        ondblclick: () => app.insert(code),
        onkeydown: (e) => e.key === 'Enter' && (e.preventDefault(), app.insert(code)),
      },
      label,
    );
  const matches = (name) => !query || name.toLowerCase().includes(query.toLowerCase());
  const section = (title, count, build, { open = false } = {}) => {
    // big sections fill in when opened, so the panel stays fast
    const details = h('details', { open: open || !!query }, h('summary', {}, `${title} (${count})`));
    const fill = () => details.dataset.filled || (details.append(...[build()].flat()), (details.dataset.filled = '1'));
    if (details.open) fill();
    else details.addEventListener('toggle', fill, { once: true });
    return details;
  };

  // ---------- GitHub libraries ----------
  function githubSection() {
    const input = h('input', { placeholder: 'user/repo or strudel.json URL', 'aria-label': 'GitHub library', name: 'lib' });
    const add = async (id, button) => {
      if (button) button.disabled = true;
      try {
        const lib = await loadLibrary(id);
        toast(`Loaded ${lib.id}: ${lib.names.length} sounds.`);
      } catch (e) {
        toast(e.message, { error: true });
        if (button) button.disabled = false;
      }
    };
    const loaded = loadedLibraries();
    const loadedIds = new Set(loaded.map((l) => l.id));
    return h(
      'section.github',
      {},
      h('h4', {}, 'GitHub libraries'),
      h('form.addlib', { onsubmit: (e) => (e.preventDefault(), add(input.value).then(() => (input.value = ''))) }, input, h('button', { type: 'submit' }, icon('github'), ' Load')),
      ...loaded.map((lib) => {
        const names = lib.names.filter(matches);
        return section(lib.id, names.length, () => [
          h(
            'div.row',
            {},
            h('button', { type: 'button', onclick: () => app.prepend(lib.code) }, icon('plus'), ' Add to sketch'),
            h('button.icon', { type: 'button', title: 'Forget', 'aria-label': `Forget ${lib.id}`, onclick: () => forgetLibrary(lib.id) }, icon('trash')),
          ),
          h('div.chips', {}, names.slice(0, 300).map((name) => chip({ label: name, sound: name, code: `$: s("${name}")\n` }))),
        ]);
      }),
      query
        ? null
        : section('Suggested libraries', CURATED.filter((c) => !loadedIds.has(c.id)).length, () =>
            h(
              'ul.curated',
              {},
              CURATED.filter((c) => !loadedIds.has(c.id)).map((c) =>
                h(
                  'li',
                  {},
                  h('div.meta', {}, h('strong', {}, c.title), h('small', {}, c.note), h('small.muted', {}, c.id)),
                  h('button', { type: 'button', onclick: (e) => add(c.id, e.currentTarget) }, 'Load'),
                ),
              ),
            ),
          ),
      h('p.muted', {}, '“Add to sketch” writes samples(…) into the code so shared links load the library too. Check each library’s licence before publishing.'),
    );
  }

  // ---------- Sounds ----------
  async function soundsView() {
    const map = soundMap.get();
    const all = Object.keys(map).sort();
    // uploads and takes together, newest first
    const mine = (await listSounds()).sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
    const mineNames = new Set(mine.map((s) => s.name));
    const groups = { soda: [], drums: new Map(), samples: [], synths: [], soundfonts: [], wavetables: [] };
    for (const name of all) {
      if (mineNames.has(name) || githubLibraryOf(name)) continue;
      const data = map[name]?.data ?? {};
      if (name.startsWith('soda_')) groups.soda.push(name);
      else if (data.tag === 'drum-machines') {
        const i = name.lastIndexOf('_');
        const bank = i > 0 ? name.slice(0, i) : 'kit';
        if (!groups.drums.has(bank)) groups.drums.set(bank, []);
        groups.drums.get(bank).push(name);
      } else if (name.startsWith('gm_') || data.type === 'soundfont') groups.soundfonts.push(name);
      else if (name.startsWith('wt_')) groups.wavetables.push(name);
      else if (data.type === 'synth') groups.synths.push(name);
      else groups.samples.push(name);
    }
    const search = h('input', {
      type: 'search',
      value: query,
      placeholder: `Search ${all.length} sounds`,
      'aria-label': 'Search sounds',
      oninput: (e) => {
        query = e.target.value;
        render('sounds', { focus: 'input[type=search]' });
      },
    });
    const soda = groups.soda.filter(matches);
    const drumBanks = [...groups.drums].map(([bank, list]) => [bank, list.filter(matches)]).filter(([, list]) => list.length);
    const drumCount = drumBanks.reduce((n, [, l]) => n + l.length, 0);
    const pitchedSet = (list) => list.filter(matches);
    return [
      h('label.search', {}, icon('search'), search),
      h('p.muted', {}, 'Tap a sound to hear it, then Insert · double-click or Enter inserts straight away · outlined = pitched (use note()).'),
      drop('audio files – or record a take with the mic'),
      h('h4', {}, `Your sounds (${mine.filter((s) => matches(s.name)).length})`),
      mine.length
        ? h(
            'ul.list',
            {},
            mine.filter((s) => matches(s.name)).map((rec) =>
              h(
                'li.item',
                {},
                h('button.name', { title: 'click: hear · double-click: insert', onclick: () => hear(rec.name), ondblclick: () => app.insert(`$: s("${rec.name}")\n`) }, rec.name),
                h('span.meta', {}, rec.source === 'take' ? 'take · ' : '', formatBytes(rec.bytes ?? rec.blob.size)),
                h('button.icon', { title: 'Insert', 'aria-label': `Insert ${rec.name}`, onclick: () => app.insert(`$: s("${rec.name}")\n`) }, icon('plus')),
                h('button.icon', { title: 'Delete from this browser', 'aria-label': `Delete ${rec.name}`, onclick: () => confirm(`Delete ${rec.name}?`) && removeSound(rec.name) }, icon('trash')),
              ),
            ),
          )
        : h('p.muted', {}, 'None yet.'),
      mine.some((r) => r.source === 'take') ? h('p.muted', {}, 'Takes chop well: .slice(8, "0 3 2 7"), .chop(16), .loopAt(2), .speed("<1 -1>")') : null,
      section(
        'soda pack',
        soda.length,
        () =>
          h(
            'div.chips',
            {},
            soda.map((name) => {
              const short = name.slice(5);
              const pitched = pitchedSoda.has(name);
              return chip({
                label: short,
                sound: name,
                pitched,
                code: pitched ? `$: note("c3 eb3 g3 bb3").s("${short}").bank("soda")\n` : `$: s("${short}").bank("soda")\n`,
                title: `${short} · bank("soda")${pitched ? ' · pitched' : ' · variations with :n'}`,
              });
            }),
          ),
        { open: true },
      ),
      githubSection(),
      h('h4', {}, 'Strudel’s sounds'),
      section(`Drum machines · ${drumBanks.length} kits`, drumCount, () =>
        drumBanks.map(([bank, list]) =>
          section(bank, list.length, () =>
            h('div.chips', {}, list.map((name) => {
              const short = name.slice(bank.length + 1);
              return chip({ label: short, sound: name, code: `$: s("${short}").bank("${bank}")\n`, title: `${short} · bank("${bank}")` });
            })),
          ),
        ),
      ),
      section('Samples', pitchedSet(groups.samples).length, () => h('div.chips', {}, pitchedSet(groups.samples).map((name) => chip({ label: name, sound: name, code: `$: s("${name}")\n` })))),
      section('Synths', pitchedSet(groups.synths).length, () =>
        h('div.chips', {}, pitchedSet(groups.synths).map((name) => chip({ label: name, sound: name, pitched: true, code: `$: note("c3 e3 g3").s("${name}")\n` }))),
      ),
      section('Soundfonts (General MIDI)', pitchedSet(groups.soundfonts).length, () =>
        h('div.chips', {}, pitchedSet(groups.soundfonts).map((name) => chip({ label: name.replace(/^gm_/, ''), sound: name, pitched: true, code: `$: note("c3 e3 g3").s("${name}")\n`, title: name }))),
      ),
      groups.wavetables.length
        ? section('Wavetables', pitchedSet(groups.wavetables).length, () =>
            h('div.chips', {}, pitchedSet(groups.wavetables).map((name) => chip({ label: name, sound: name, pitched: true, code: `$: note("c3 e3 g3").s("${name}")\n` }))),
          )
        : null,
    ];
  }

  // ---------- Media ----------
  async function mediaView() {
    const mine = await listMediaItems();
    const hosted = listMedia().filter((m) => !m.local);
    const localUrls = new Map(listMedia().filter((m) => m.local).map((m) => [m.name, m.url]));
    const thumb = (name, url, type, del) =>
      h(
        'li.thumb',
        {},
        h(
          'button',
          { title: `Insert ${name}`, onclick: () => app.insert(`$: ${type === 'video' ? 'vid' : 'img'}("${name}").fade(.2)\n`) },
          type === 'video' ? h('video', { src: url, muted: true, playsInline: true }) : h('img', { src: url, alt: name, loading: 'lazy' }),
          h('span', {}, name),
        ),
        del && h('button.icon.del', { 'aria-label': `Delete ${name}`, onclick: () => confirm(`Delete ${name}?`) && removeMedia(name) }, icon('trash')),
      );
    return [
      h('p.muted', {}, 'Click an image or video to insert it into the code.'),
      drop('images or short videos'),
      h('h4', {}, 'Your media'),
      mine.length ? h('ul.thumbs', {}, mine.map((m) => thumb(m.name, localUrls.get(m.name), m.type, true))) : h('p.muted', {}, 'None yet.'),
      h('h4', {}, 'soda media pack'),
      h('ul.thumbs', {}, hosted.map((m) => thumb(m.name, m.url, m.type, false))),
      h('h4', {}, 'Live'),
      h(
        'div.chips',
        {},
        h('button.chip', { onclick: () => app.insert('$: cam().mirror(1).opacity(.8)\n') }, 'cam()'),
        h('button.chip', { onclick: () => app.insert('.lpf(camMotion.range(200, 4000))') }, 'camMotion'),
      ),
    ];
  }

  async function render(page, { focus } = {}) {
    const body = await (page === 'media' ? mediaView() : soundsView());
    const { usage, quota, persisted } = await storageStatus();
    if (page !== 'sounds') pickBar.hidden = true;
    root.replaceChildren(
      ...body.filter(Boolean),
      h('p.storage', {}, `Browser storage: ${formatBytes(usage)}${quota ? ` of ${formatBytes(quota)}` : ''}${persisted ? ' · kept' : ''}`),
      picker,
      pickBar,
    );
    if (focus) {
      const el = root.querySelector(focus);
      el?.focus();
      el?.setSelectionRange?.(el.value.length, el.value.length);
    }
  }

  // only redraw while one of our pages is showing; isVisible() returns its name
  onLibraryChange(() => isVisible() && render(isVisible()));
  onGithubChange(() => isVisible() === 'sounds' && render('sounds'));
  return { render };
}
