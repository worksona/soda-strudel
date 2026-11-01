// Keyboard commands for the code editor, and for the page around it.
//
// Strudel's editor already has undo history, the standard CodeMirror keymap
// and its own ctrl+enter / alt+enter (play) and ctrl+. / alt+. (stop). Three
// gaps are filled here:
//   – on a Mac, cmd+enter and cmd+. play and stop too (cmd+enter used to insert
//     a blank line), and cmd+f opens find and replace
//   – these come first in the editor, ahead of the chosen Keys mode (VS Code,
//     Vim, Emacs), so play / stop work in every mode
//   – when focus is on the page instead of the code (after clicking Play, a
//     menu, the stage), play, stop, undo, redo, copy and paste still reach the
//     editor
import { Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { redo, undo } from '@codemirror/commands';
import { search, searchKeymap } from '@codemirror/search';

let actions = { play: () => {}, stop: () => {} };
const run = (name) => () => {
  Promise.resolve(actions[name]()).catch((e) => console.warn(`[soda] ${name}`, e));
  return true;
};

/** Editor extension: goes in front of Strudel's keybindings compartment. */
export const sodaEditorKeys = [
  Prec.highest(
    keymap.of([
      { key: 'Mod-Enter', run: run('play'), preventDefault: true },
      { key: 'Mod-.', run: run('stop'), preventDefault: true },
    ]),
  ),
  search({ top: true }),
  keymap.of(searchKeymap),
];

/** Where focus is in a field of its own (the editor, a text box, a menu…). */
const ownsKeys = (el) => !!el?.closest?.('input, textarea, select, [contenteditable="true"], .cm-editor, [role="menu"]');

/**
 * Page-level shortcuts. `editorUsable()` says whether the code is showing and
 * editable (not stage-only, not a shared link being viewed).
 */
export function installPageKeys({ mirror, play, stop, editorUsable }) {
  actions = { play, stop };
  const view = () => mirror.editor;

  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.isComposing || ownsKeys(e.target)) return;
    const mod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();
    // e.code is the physical key: alt+. on a Mac types ≥, but it is still Period
    if ((mod || e.altKey) && (e.key === 'Enter' || e.code === 'Enter') && !e.shiftKey) {
      if (!editorUsable()) return;
      e.preventDefault();
      run('play')();
    } else if ((mod || e.altKey) && (e.key === '.' || e.code === 'Period')) {
      e.preventDefault();
      run('stop')();
    } else if (mod && !e.altKey && (key === 'z' || e.code === 'KeyZ') && editorUsable()) {
      e.preventDefault();
      (e.shiftKey ? redo : undo)(view());
    } else if (e.ctrlKey && !e.metaKey && !e.altKey && (key === 'y' || e.code === 'KeyY') && editorUsable()) {
      e.preventDefault();
      redo(view());
    }
  });

  // paste with nothing focused: it goes into the code, at the cursor
  window.addEventListener('paste', (e) => {
    if (e.defaultPrevented || ownsKeys(e.target) || !editorUsable()) return;
    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    const v = view();
    v.dispatch(v.state.replaceSelection(text), { scrollIntoView: true, userEvent: 'input.paste' });
    v.focus();
  });

  // copy with nothing selected on the page: copy what's selected in the code
  window.addEventListener('copy', (e) => {
    if (e.defaultPrevented || ownsKeys(e.target) || !document.getSelection()?.isCollapsed) return;
    const { state } = view();
    const text = state.selection.ranges.map((r) => state.sliceDoc(r.from, r.to)).filter(Boolean).join('\n');
    if (!text) return;
    e.preventDefault();
    e.clipboardData.setData('text/plain', text);
  });
}

/** True when the last click came from a pointer (keyboard activation has detail 0). */
export const fromPointer = (e) => e?.detail > 0;
