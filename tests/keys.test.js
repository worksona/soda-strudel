import { describe, expect, it } from 'vitest';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { sodaEditorKeys } from '../src/editor/keys.js';

describe('editor keys', () => {
  const keys = EditorState.create({ extensions: sodaEditorKeys })
    .facet(keymap)
    .flat()
    .map((b) => b.key);

  it('plays and stops with cmd / ctrl (Mod) as well as Strudel’s ctrl and alt', () => {
    expect(keys).toContain('Mod-Enter');
    expect(keys).toContain('Mod-.');
  });

  it('has find and replace', () => {
    expect(keys).toContain('Mod-f');
  });
});
