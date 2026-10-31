import { describe, expect, it } from 'vitest';
import { TIMELINE_VISUALS, VISUALS } from '../src/soda/catalog.js';
import { plugins } from '../src/visuals/index.js';

describe('visual plugins', () => {
  it('match the catalogue one to one', () => {
    expect(Object.keys(plugins).sort()).toEqual(Object.keys(VISUALS).sort());
    for (const p of Object.values(plugins)) {
      expect(typeof p.create).toBe('function');
      expect(typeof p.frame).toBe('function');
    }
  });

  it('timeline visuals are catalogued visuals', () => {
    for (const name of TIMELINE_VISUALS) expect(VISUALS[name]).toBeDefined();
  });

  it('every visual lists params that are soda controls', async () => {
    const { SODA_CONTROLS } = await import('../src/soda/catalog.js');
    for (const v of Object.values(VISUALS)) for (const p of v.params) expect(SODA_CONTROLS).toContain(p);
  });
});

describe('frameFor – the export frame', () => {
  it('keeps a declared shape and follows the device for free', async () => {
    const { frameFor } = await import('../src/soda/catalog.js');
    expect(frameFor('9:16', false)).toBe('9:16');
    expect(frameFor('16:9', true)).toBe('16:9');
    expect(frameFor('free', true)).toBe('9:16');
    expect(frameFor('free', false)).toBe('16:9');
    expect(frameFor(undefined, true)).toBe('9:16');
  });
});
