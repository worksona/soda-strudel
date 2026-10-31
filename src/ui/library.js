// Library drawer: Sounds · Media · Takes. Drag in files, tap an item to insert it.
import { h, toast, formatBytes } from './dom.js';
import { listSounds, listMediaItems, storageStatus } from '../storage/db.js';
import { listMedia } from '../soda/mediaRegistry.js';
import { importFiles, onLibraryChange, removeMedia, removeSound } from '../media/library.js';

export function createLibrary({ root, insert }) {
  let tab = 'sounds';
  let packs = { sounds: [], media: [] };
  Promise.all([fetch('/sounds.json').then((r) => r.json()), fetch('/media.json').then((r) => r.json())])
    .then(([s, m]) => {
      packs = { sounds: s.packs ?? [], media: m.packs ?? [] };
      render();
    })
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

  const preview = (blob) => {
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
    audio.onended = () => URL.revokeObjectURL(audio.src);
  };

  const soundRow = (rec) =>
    h(
      'li.item',
      {},
      h('button.name', { title: 'Insert into code', onclick: () => insert(`$: s("${rec.name}")\n`) }, rec.name),
      h('span.meta', {}, formatBytes(rec.bytes ?? rec.blob.size)),
      h('button.icon', { title: 'Preview', 'aria-label': `Preview ${rec.name}`, onclick: () => preview(rec.blob) }, '▶'),
      h('button.icon', { title: 'Delete from this browser', 'aria-label': `Delete ${rec.name}`, onclick: () => confirm(`Delete ${rec.name}?`) && removeSound(rec.name) }, '✕'),
    );

  async function render() {
    const body = h('div.lib-body');
    if (tab === 'sounds') {
      const mine = (await listSounds()).filter((s) => s.source !== 'take');
      body.append(
        h('div.drop', {}, 'Drop audio, images or video anywhere, or ', h('button.link', { onclick: () => picker.click() }, 'choose files'), '. They stay in this browser.'),
        h('h4', {}, 'Your sounds'),
        mine.length ? h('ul.list', {}, mine.map(soundRow)) : h('p.muted', {}, 'None yet.'),
        ...packs.sounds.map((p) =>
          h(
            'details',
            { open: true },
            h('summary', {}, `Pack ${p.id}`),
            h('div.chips', {}, Object.keys(p.sounds).map((name) => {
              const short = name.slice(p.bank.length + 1);
              return h('button.chip', { title: `${p.sounds[name]} variation(s)`, onclick: () => insert(`$: s("${short}").bank("${p.bank}")\n`) }, short);
            })),
          ),
        ),
        h('p.muted', {}, "Strudel's default banks are loaded too: bd sd hh cp…, .bank(\"RolandTR909\"), piano, gm_ soundfonts, synths (sine, sawtooth, supersaw…)."),
      );
    } else if (tab === 'media') {
      const mine = await listMediaItems();
      const hosted = listMedia().filter((m) => !m.local);
      const thumb = (name, url, type, del) =>
        h(
          'li.thumb',
          {},
          h(
            'button',
            { title: `Insert ${name}`, onclick: () => insert(`$: ${type === 'video' ? 'vid' : 'img'}("${name}").fade(.2)\n`) },
            type === 'video' ? h('video', { src: url, muted: true, playsInline: true }) : h('img', { src: url, alt: name, loading: 'lazy' }),
            h('span', {}, name),
          ),
          del && h('button.icon.del', { 'aria-label': `Delete ${name}`, onclick: () => confirm(`Delete ${name}?`) && removeMedia(name) }, '✕'),
        );
      const localUrls = new Map(listMedia().filter((m) => m.local).map((m) => [m.name, m.url]));
      body.append(
        h('div.drop', {}, 'Drop images or short videos, or ', h('button.link', { onclick: () => picker.click() }, 'choose files'), '.'),
        h('h4', {}, 'Your media'),
        mine.length ? h('ul.thumbs', {}, mine.map((m) => thumb(m.name, localUrls.get(m.name), m.type, true))) : h('p.muted', {}, 'None yet.'),
        h('h4', {}, 'Packs'),
        h('ul.thumbs', {}, hosted.map((m) => thumb(m.name, m.url, m.type, false))),
        h('h4', {}, 'Live'),
        h('div.chips', {}, h('button.chip', { onclick: () => insert('$: cam().mirror(1).opacity(.8)\n') }, 'cam()'), h('button.chip', { onclick: () => insert('.lpf(camMotion.range(200, 4000))') }, 'camMotion')),
      );
    } else {
      const takes = (await listSounds()).filter((s) => s.source === 'take');
      body.append(
        h('p.muted', {}, 'Tap 🎙 in the toolbar to record a take. Takes become sounds: s("take_…").'),
        takes.length ? h('ul.list', {}, takes.map(soundRow)) : h('p.muted', {}, 'No takes yet.'),
        h('p.muted', {}, 'Ideas: .slice(8, "0 3 2 7"), .chop(16), .loopAt(2), .speed("<1 -1>")'),
      );
    }
    const { usage, quota, persisted } = await storageStatus();
    body.append(h('p.storage', {}, `Browser storage: ${formatBytes(usage)}${quota ? ` of ${formatBytes(quota)}` : ''}${persisted ? ' · kept' : ''}`));
    root.replaceChildren(
      h(
        'div.tabs',
        { role: 'tablist' },
        ['sounds', 'media', 'takes'].map((t) =>
          h('button', { role: 'tab', 'aria-selected': String(t === tab), onclick: () => ((tab = t), render()) }, t[0].toUpperCase() + t.slice(1)),
        ),
      ),
      body,
      picker,
    );
  }

  onLibraryChange(render);
  return { render, show: (t) => ((tab = t), render()) };
}
