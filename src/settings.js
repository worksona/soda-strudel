// Per-browser preferences (localStorage). Sketch-specific things like shape live
// on the sketch; these are the defaults and the "profile".
import { lsGet, lsSet } from './ui/dom.js';

const DEFAULTS = {
  name: '', // shown as "by …" on shared links and exports
  exportSize: 1080, // short side of exported video, in pixels
  navLabels: true, // tiny captions under toolbar icons
};

let current = { ...DEFAULTS, ...lsGet('soda.settings', {}) };
const listeners = new Set();

export const getSettings = () => current;
export function updateSettings(patch) {
  current = { ...current, ...patch };
  lsSet('soda.settings', current);
  listeners.forEach((fn) => fn(current));
}
export const onSettings = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const EXPORT_SIZES = [720, 1080, 1440];
