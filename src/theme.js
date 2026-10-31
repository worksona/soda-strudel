// Light / dark / system appearance. The stage stays dark in every theme – it is
// the "screen" the piece plays on, and what video export records.
// The editor follows the app (githubLight / strudelTheme) unless the user picked
// a specific editor theme in Settings › Editor.
import { lsGet, lsSet } from './ui/dom.js';

const media = matchMedia('(prefers-color-scheme: light)');
const listeners = new Set();
export const APPEARANCES = ['system', 'light', 'dark'];
export const EDITOR_THEME_FOR = { light: 'githubLight', dark: 'strudelTheme' };

export const getAppearance = () => (APPEARANCES.includes(lsGet('soda.appearance')) ? lsGet('soda.appearance') : 'system');
export const resolvedTheme = (pref = getAppearance()) => (pref === 'system' ? (media.matches ? 'light' : 'dark') : pref);
export const onThemeChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));

export function applyAppearance(pref = getAppearance()) {
  lsSet('soda.appearance', pref);
  const theme = resolvedTheme(pref);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f6f9' : '#0b0b12');
  listeners.forEach((fn) => fn(theme));
  return theme;
}
media.addEventListener('change', () => getAppearance() === 'system' && applyAppearance('system'));
