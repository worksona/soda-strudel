// Sketches page: save, open and delete your sketches (kept in IndexedDB with a
// stage thumbnail), or open a .soda file.
import { h, toast } from './dom.js';
import { icon } from './icons.js';
import { deleteSketch, listSketches } from '../storage/db.js';

const when = (ms) => new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function createSketches({ root, app }) {
  async function render() {
    const current = app.getSketch();
    const all = await listSketches();
    const title = h('input', {
      value: current.title ?? '',
      placeholder: 'Untitled',
      'aria-label': 'Title',
      oninput: (e) => app.setTitle(e.target.value),
    });
    root.replaceChildren(
      h('div.field', {}, h('span', {}, current.id ? 'This sketch' : 'This sketch (not saved yet)'), title),
      h(
        'div.row',
        {},
        h('button', { onclick: () => app.saveSketch().then(render) }, icon('save'), ' Save'),
        h('button', { onclick: () => app.saveSketch({ asNew: true }).then(render) }, icon('copy'), ' Save as new'),
        h('button', { onclick: () => app.newSketch() && render() }, icon('plus'), ' New'),
      ),
      h('p.muted', {}, 'ctrl+s saves. Sketches stay in this browser – Export › .soda file to move one elsewhere.'),
      h('h4', {}, `Saved (${all.length})`),
      all.length
        ? h(
            'ul.sketches',
            {},
            all.map((s) =>
              h(
                'li',
                { className: s.id === current.id ? 'current' : '' },
                h(
                  'button.open',
                  { title: `Open ${s.title || 'Untitled'}`, onclick: () => app.openSketch(s).then(render) },
                  s.thumb ? h('img', { src: s.thumb, alt: '' }) : h('span.nothumb'),
                  h('span.meta', {}, h('strong', {}, s.title || 'Untitled'), h('small', {}, `${s.aspect ?? 'free'} · ${when(s.updated)}`)),
                ),
                h(
                  'button.icon',
                  {
                    'aria-label': `Delete ${s.title || 'Untitled'}`,
                    title: 'Delete',
                    onclick: async () => {
                      if (!confirm(`Delete “${s.title || 'Untitled'}”? This can't be undone.`)) return;
                      await deleteSketch(s.id);
                      if (s.id === current.id) app.forgetSketchId();
                      toast('Sketch deleted.');
                      render();
                    },
                  },
                  icon('trash'),
                ),
              ),
            ),
          )
        : h('p.muted', {}, 'Nothing saved yet.'),
      h('h4', {}, 'From a file'),
      h('button', { onclick: () => app.openFile() }, icon('upload'), ' Open a .soda file'),
      h('p.muted', {}, 'Looking for ideas? ', h('button.link', { onclick: () => app.openPage('examples') }, 'Browse the examples'), '.'),
    );
  }
  return { render };
}
