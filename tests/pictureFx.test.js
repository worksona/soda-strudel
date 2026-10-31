import { describe, expect, it } from 'vitest';
import { PICTURE_FX, PICTURE_FX_NAMES, pictureFilter, pictureFx } from '../src/stage/pictureFx.js';
import { SODA_CONTROLS, isMediaOnly } from '../src/soda/catalog.js';

describe('pictureFx – audio effects read as picture effects', () => {
  it('is null when a value carries no effect (no extra work on plain layers)', () => {
    expect(pictureFx({ img: 'rain', opacity: 0.5, fx: 'posterize' })).toBeNull();
    expect(pictureFx(null)).toBeNull();
  });

  it('uses only Strudel names, never soda controls', () => {
    for (const name of PICTURE_FX_NAMES) expect(SODA_CONTROLS).not.toContain(name);
    expect(Object.keys(PICTURE_FX)).toEqual(PICTURE_FX_NAMES);
  });

  it('keeps effected media layers silent', () => {
    expect(isMediaOnly({ img: 'rain', lpf: 400, room: 0.5, gain: 0.8 })).toBe(true);
  });

  it('reads the keys Strudel actually stores: cutoff for lpf, hcutoff for hpf', () => {
    expect(pictureFx({ cutoff: 300 }, 900).blurPx).toBeGreaterThan(0);
    expect(pictureFx({ hcutoff: 4000 }).outlines).toBe(1);
  });

  it('lpf blurs: lower cutoff, more blur; 8 kHz and up is sharp', () => {
    expect(pictureFx({ lpf: 8000 }, 900).blurPx).toBe(0);
    expect(pictureFx({ lpf: 20000 }, 900).blurPx).toBe(0);
    const soft = pictureFx({ lpf: 300 }, 900).blurPx;
    const softer = pictureFx({ lpf: 100 }, 900).blurPx;
    expect(soft).toBeGreaterThan(0);
    expect(softer).toBeGreaterThan(soft);
    expect(softer).toBeCloseTo(30); // h / 30 at full blur
    // scales with the output size
    expect(pictureFx({ lpf: 300 }, 1800).blurPx).toBeCloseTo(soft * 2);
  });

  it('hpf makes outlines', () => {
    expect(pictureFx({ hpf: 100 }).outlines).toBe(0);
    expect(pictureFx({ hpf: 800 }).outlines).toBeGreaterThan(0);
    expect(pictureFx({ hpf: 4000 }).outlines).toBe(1);
  });

  it('room glows, roomsize spreads', () => {
    const p = pictureFx({ room: 0.7, roomsize: 4 }, 600);
    expect(p.glow).toBeCloseTo(0.7);
    expect(p.glowPx).toBeCloseTo(20);
    expect(pictureFx({ room: 3 }).glow).toBe(1);
  });

  it('delay echoes with feedback over delaytime', () => {
    const p = pictureFx({ delay: 0.5, delayfeedback: 0.5, delaytime: 0.25 });
    expect(p.echo).toBe(0.5);
    expect(p.echoRetain(0.25)).toBeCloseTo(0.5);
    expect(p.echoRetain(0.5)).toBeCloseTo(0.25);
    expect(pictureFx({ room: 1 }).echoRetain(1)).toBe(0);
  });

  it('crush posterizes, coarse pixelates, pan and gain are clamped', () => {
    expect(pictureFx({ crush: 3 }).levels).toBe(8);
    expect(pictureFx({ crush: '2' }).levels).toBe(4);
    expect(pictureFx({ coarse: 16 }).pixel).toBe(16);
    expect(pictureFx({ coarse: 1 }).pixel).toBeNull();
    expect(pictureFx({ pan: 1.5 }).pan).toBe(1);
    expect(pictureFx({ pan: 0.2 }).pan).toBeCloseTo(0.2);
    expect(pictureFx({ gain: 2 }).brightness).toBe(2);
    expect(pictureFx({ gain: 'x' }).brightness).toBe(1);
  });

  it('builds a CSS filter only from what is set', () => {
    expect(pictureFilter(null)).toBe('');
    expect(pictureFilter(pictureFx({ pan: 0.3 }))).toBe('');
    expect(pictureFilter(pictureFx({ lpf: 200, distort: 0.5, gain: 1.2 }, 900))).toMatch(/^blur\([\d.]+px\) contrast\(1\.75\) saturate\(1\.30\) brightness\(1\.20\)$/);
  });
});
