import { describe, expect, it } from 'vitest';
import { FX, VIDEO_FX, fxChain, SODA_CONTROLS } from '../src/soda/catalog.js';
import { validateSketch } from '../src/soda/validate.js';

describe('video effectors – catalogue', () => {
  it('every effector is an fx name, after the ten looks', () => {
    for (const name of Object.keys(VIDEO_FX)) expect(FX).toContain(name);
    expect(FX.slice(0, 10)).toEqual(['none', 'grayscale', 'invert', 'blur', 'posterize', 'pixelate', 'edges', 'sepia', 'contrast', 'hue']);
    expect(new Set(FX).size).toBe(FX.length);
  });

  it('names never collide with soda controls (fx("mirror") would read like .mirror())', () => {
    for (const name of Object.keys(VIDEO_FX)) expect(SODA_CONTROLS).not.toContain(name);
  });

  it('every effector says what amount does', () => {
    for (const text of Object.values(VIDEO_FX)) expect(text).toMatch(/amount/);
  });
});

describe('fxChain – one effect or a chain', () => {
  it('reads a name, a chain array, and drops none', () => {
    expect(fxChain(undefined)).toEqual([]);
    expect(fxChain('none')).toEqual([]);
    expect(fxChain('vhs')).toEqual(['vhs']);
    expect(fxChain(['vhs', 'kaleido'])).toEqual(['vhs', 'kaleido']);
    expect(fxChain(['none', 'glitch'])).toEqual(['glitch']);
  });
});

describe('video effectors – validator', () => {
  it('accepts chains written with : in mini-notation', async () => {
    const res = await validateSketch({ code: '$: cam().fx("vhs:kaleido <glitch timeslice>").amount(.6)\n$: s("bd*2")' }, {});
    expect(res.errors).toEqual([]);
  });

  it('names the unknown link of a chain', async () => {
    const res = await validateSketch({ code: '$: img("x").fx("vhs:kaleidoscope")\n$: s("bd*2")' }, {});
    expect(res.errors.join(' ')).toMatch(/unknown fx: kaleidoscope/);
  });

  it('keeps effected media silent', async () => {
    const res = await validateSketch({ code: '$: cam().fx("feedback").amount(camMotion)\n$: s("bd*2")' }, {});
    expect(res.errors).toEqual([]);
    expect(res.stats.audible).toBe(16);
  });
});
