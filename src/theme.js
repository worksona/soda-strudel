// Light / dark / system appearance – dark by default. The stage stays dark in
// every theme – it is the "screen" the piece plays on, and what video export
// records. The editor follows the app (githubLight / strudelTheme) unless the
// user picked a specific editor theme in Settings › Editor.
import { lsGet, lsSet } from './ui/dom.js';

const media = matchMedia('(prefers-color-scheme: light)');
const listeners = new Set();
export const APPEARANCES = ['system', 'light', 'dark'];
export const DEFAULT_APPEARANCE = 'dark';
export const EDITOR_THEME_FOR = { light: 'githubLight', dark: 'strudelTheme' };

// Only an explicit choice in Settings is stored (under its own key – earlier
// builds stored "system" for everyone on load, which wasn't a choice).
const KEY = 'soda.theme';
try {
  localStorage.removeItem('soda.appearance');
} catch {
  // storage unavailable – nothing to clean up
}

export const getAppearance = () => (APPEARANCES.includes(lsGet(KEY)) ? lsGet(KEY) : DEFAULT_APPEARANCE);
export const resolvedTheme = (pref = getAppearance()) => (pref === 'system' ? (media.matches ? 'light' : 'dark') : pref);
export const onThemeChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));

/** Show `pref`. Pass `{ save: true }` when the user chose it. */
export function applyAppearance(pref = getAppearance(), { save = false } = {}) {
  if (save) lsSet(KEY, pref);
  const theme = resolvedTheme(pref);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f6f9' : '#0b0b12');
  listeners.forEach((fn) => fn(theme));
  return theme;
}
media.addEventListener('change', () => getAppearance() === 'system' && applyAppearance('system'));
