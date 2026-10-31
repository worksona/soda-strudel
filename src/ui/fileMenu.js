// The File pulldown, left of Play: New · Open… · Open .soda file… · Save · Save as
// new · Rename… · Download .soda file · recent sketches. Keyboard: Enter/Space or
// ↓ opens, ↑/↓ moves, Esc closes; clicking outside closes too.
import { h } from './dom.js';
import { icon } from './icons.js';
import { listSketches } from '../storage/db.js';

const when = (ms) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function createFileMenu({ button, menu, app }) {
  const item = (iconName, label, run, { kbd, disabled } = {}) =>
    h(
      'button',
      {
        role: 'menuitem',
        tabIndex: -1,
        disabled,
        onclick: () => {
          close();
          run();
        },
      },
      icon(iconName, 16),
      h('span.mi-label', {}, label),
      kbd ? h('kbd', {}, kbd) : null,
    );
  const sep = () => h('div.sep', { role: 'separator' });

  async function build() {
    const sketch = app.getSketch();
    const recent = (await listSketches()).slice(0, 6);
    menu.replaceChildren(
      item('plus', 'New sketch', () => app.newSketch()),
      item('sketches', 'Open…', () => app.openPage('sketches')),
      item('upload', 'Open .soda file…', () => app.openFile()),
      sep(),
      item('save', 'Save', () => app.saveSketch(), { kbd: 'ctrl+s' }),
      item('copy', 'Save as new', () => app.saveSketch({ asNew: true })),
      item('rename', 'Rename…', () => {
        const title = prompt('Rename this sketch', sketch.title || 'Untitled');
        if (title === null) return;
        app.setTitle(title.trim());
        if (sketch.id) app.saveSketch();
      }),
      item('package', 'Download .soda file', () => app.downloadSoda()),
      ...(recent.length
        ? [
            sep(),
            h('div.menu-heading', {}, 'Recent'),
            ...recent.map((s) =>
              h(
                'button.recent',
                {
                  role: 'menuitem',
                  tabIndex: -1,
                  className: s.id === sketch.id ? 'recent current' : 'recent',
                  onclick: () => {
                    close();
                    app.openSketch(s);
                  },
                },
                s.thumb ? h('img', { src: s.thumb, alt: '' }) : h('span.nothumb'),
                h('span.mi-label', {}, s.title || 'Untitled'),
                h('small', {}, when(s.updated)),
              ),
            ),
          ]
        : []),
    );
  }

  const items = () => [...menu.querySelectorAll('[role=menuitem]:not([disabled])')];
  function focusItem(i) {
    const list = items();
    list[(i + list.length) % list.length]?.focus();
  }

  async function open() {
    await build();
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    focusItem(0);
    setTimeout(() => document.addEventListener('pointerdown', outside), 0);
  }
  function close() {
    if (menu.hidden) return;
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside);
  }
  const outside = (e) => !menu.contains(e.target) && !button.contains(e.target) && close();

  button.addEventListener('click', () => (menu.hidden ? open() : close()));
  button.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && menu.hidden) {
      e.preventDefault();
      open();
    }
  });
  menu.addEventListener('keydown', (e) => {
    const list = items();
    const i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') (e.preventDefault(), focusItem(i + 1));
    else if (e.key === 'ArrowUp') (e.preventDefault(), focusItem(i - 1));
    else if (e.key === 'Home') (e.preventDefault(), focusItem(0));
    else if (e.key === 'End') (e.preventDefault(), focusItem(list.length - 1));
    else if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      close();
      button.focus();
    }
  });
  return { open, close };
}
