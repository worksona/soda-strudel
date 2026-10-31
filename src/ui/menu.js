// A toolbar pulldown (File, View, Input). `build()` returns the menu's children
// and runs every time it opens, so items always show the current state.
// Keyboard: Enter/Space or ↓ opens, ↑/↓/Home/End move, Esc/Tab closes;
// clicking outside closes too.
import { h } from './dom.js';
import { icon } from './icons.js';

/** A menu row. `checked` (true/false) makes it a checkbox-style item. */
export function menuItem(iconName, label, run, { kbd, checked, disabled, close } = {}) {
  const role = checked === undefined ? 'menuitem' : 'menuitemcheckbox';
  return h(
    'button',
    {
      role,
      tabIndex: -1,
      disabled,
      'aria-checked': checked === undefined ? null : String(checked),
      onclick: () => {
        close?.();
        run();
      },
    },
    icon(iconName, 16),
    h('span.mi-label', {}, label),
    checked ? h('span.mi-check', { 'aria-hidden': 'true' }, icon('check', 15)) : null,
    kbd ? h('kbd', {}, kbd) : null,
  );
}
export const menuSeparator = () => h('div.sep', { role: 'separator' });

export function createDropdown({ button, menu, build }) {
  const items = () => [...menu.querySelectorAll('[role^=menuitem]:not([disabled])')];
  const focusItem = (i) => {
    const list = items();
    list[(i + list.length) % list.length]?.focus();
  };
  const outside = (e) => !menu.contains(e.target) && !button.contains(e.target) && close();

  async function refresh() {
    menu.replaceChildren(...(await build({ close })).flat().filter(Boolean));
  }
  async function open() {
    // one menu at a time
    document.dispatchEvent(new CustomEvent('soda-menu-open', { detail: menu }));
    await refresh();
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
  document.addEventListener('soda-menu-open', (e) => e.detail !== menu && close());

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
  return { open, close, refresh };
}
