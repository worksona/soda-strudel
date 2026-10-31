// The File pulldown: New · Open .soda file… · Save · Save as new · Rename… ·
// Download .soda file · Your sketches (all of them, newest first; click to open,
// trash to delete with Undo).
import { h, toast } from './dom.js';
import { icon } from './icons.js';
import { createDropdown, menuItem, menuSeparator } from './menu.js';
import { deleteSketch, listSketches, restoreSketch } from '../storage/db.js';

const when = (ms) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function createFileMenu({ button, menu, app }) {
  const dropdown = createDropdown({
    button,
    menu,
    async build({ close }) {
      const sketch = app.getSketch();
      const all = await listSketches();
      const item = (iconName, label, run, opts) => menuItem(iconName, label, run, { ...opts, close });
      const sketchRow = (s) =>
        h(
          'div.sketch-row',
          { className: s.id === sketch.id ? 'sketch-row current' : 'sketch-row' },
          h(
            'button.recent',
            {
              role: 'menuitem',
              tabIndex: -1,
              onclick: () => {
                close();
                app.openSketch(s);
              },
            },
            s.thumb ? h('img', { src: s.thumb, alt: '' }) : h('span.nothumb'),
            h('span.mi-label', {}, s.title || 'Untitled'),
            h('small', {}, when(s.updated)),
          ),
          h(
            'button.icon.row-delete',
            {
              tabIndex: -1,
              title: 'Delete',
              'aria-label': `Delete ${s.title || 'Untitled'}`,
              onclick: async () => {
                await deleteSketch(s.id);
                if (s.id === sketch.id) app.forgetSketchId();
                await dropdown.refresh();
                toast(`Deleted “${s.title || 'Untitled'}”.`, {
                  ms: 8000,
                  action: { label: 'Undo', run: async () => (await restoreSketch(s), toast('Sketch restored.')) },
                });
              },
            },
            icon('trash', 15),
          ),
        );
      return [
        item('plus', 'New sketch', () => app.newSketch()),
        item('upload', 'Open .soda file…', () => app.openFile()),
        menuSeparator(),
        item('save', 'Save', () => app.saveSketch(), { kbd: 'ctrl+s' }),
        item('copy', 'Save as new', () => app.saveSketch({ asNew: true })),
        item('rename', 'Rename…', () => {
          const title = prompt('Rename this sketch', sketch.title || 'Untitled');
          if (title === null) return;
          app.setTitle(title.trim());
          if (sketch.id) app.saveSketch();
        }),
        item('package', 'Download .soda file', () => app.downloadSoda()),
        menuSeparator(),
        all.length
          ? [h('div.menu-heading', {}, `Your sketches (${all.length})`), h('div.menu-scroll', {}, all.map(sketchRow))]
          : [h('div.menu-heading', {}, 'Your sketches'), h('p.menu-empty', {}, 'Nothing saved yet – File › Save keeps a sketch in this browser.')],
      ];
    },
  });
  return dropdown;
}
