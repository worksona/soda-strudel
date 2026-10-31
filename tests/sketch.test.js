import { describe, expect, it } from 'vitest';
import { decodeSketch, encodeSketch, normalizeSketch, sketchUrl } from '../src/share/sketch.js';

describe('sketch codec', () => {
  it('round-trips a full sketch', async () => {
    const sketch = { title: 'Rain Drive', code: '$: s("kick*4").bank("soda")\n$: img("rain")', aspect: '9:16', media: { x: 'https://e.com/x.png' } };
    const frag = await encodeSketch(sketch);
    expect(frag).toMatch(/^z=[A-Za-z0-9_-]+$/);
    const back = await decodeSketch(`#${frag}`);
    expect(back).toMatchObject({ ...sketch, v: 1, camera: false });
  });

  it('accepts plain code and full URLs', async () => {
    const url = await sketchUrl('s("bd")', 'https://soda.example/');
    expect(url.startsWith('https://soda.example/#z=')).toBe(true);
    expect((await decodeSketch(url)).code).toBe('s("bd")');
  });

  it('flags camera use', () => {
    expect(normalizeSketch('cam().mirror(1)').camera).toBe(true);
    expect(normalizeSketch('s("bd").lpf(camMotion.range(1,2))').camera).toBe(true);
  });

  it('returns null without a sketch and rejects empty code', async () => {
    expect(await decodeSketch('#foo=bar')).toBeNull();
    expect(() => normalizeSketch({ code: '  ' })).toThrow();
  });

  it('compresses well', async () => {
    const code = Array.from({ length: 30 }, (_, i) => `$: s("kick hat").bank("soda").gain(${i / 30})`).join('\n');
    const frag = await encodeSketch(code);
    expect(frag.length).toBeLessThan(code.length / 2);
  });
});
