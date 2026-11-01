import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateSketch, soundIndex } from '../src/soda/validate.js';
import { isMediaOnly } from '../src/soda/catalog.js';

const sounds = JSON.parse(readFileSync(new URL('../public/sounds.json', import.meta.url)));
const media = JSON.parse(readFileSync(new URL('../public/media.json', import.meta.url)));
const v = (code, extra = {}) => validateSketch({ code, ...extra }, { sounds, media });

describe('validateSketch', () => {
  it('accepts a multimedia sketch with $: blocks', async () => {
    const res = await v(`setcps(.5)
$: s("kick*2 [~ snare] hat*4").bank("soda")
$: note("<c2 eb2>").s("sawtooth").lpf(camMotion.range(300, 3000))
$: img("<rain neon>").slow(4).fade(.5).blend("screen")
$: captions(['2:14 am', '', 'exit 9', '']).slow(2)
$: cam().mirror(1).fx("posterize").opacity(.4)
$: visual("particles").hue(210)`);
    expect(res.errors).toEqual([]);
    expect(res.ok).toBe(true);
    expect(res.stats.audible).toBeGreaterThan(0);
    expect(res.stats.visual).toBeGreaterThan(0);
    expect(res.stats.cps).toBeCloseTo(0.5);
  });

  it('accepts audio effects on media layers and keeps them silent', async () => {
    const res = await v(`const dub = x => x.lpf(sine.range(300, 6000)).room(.7).delay(.4)
$: dub(note("c2").s("bass").bank("soda"))
$: dub(img("rain")).pan(.3).crush(3).coarse(8)`);
    expect(res.errors).toEqual([]);
    expect(res.warnings).toEqual([]);
    expect(res.stats.visual).toBeGreaterThan(0);
    // only the bass makes sound: one audible event per cycle over the checked span
    expect(res.stats.audible).toBeLessThanOrEqual(res.stats.visual);
  });

  it('knows micLevel, the live microphone signal', async () => {
    const res = await v(`$: s("kick*4").bank("soda").gain(micLevel.range(.4, 1))\n$: visual("rings").amount(micLevel)`);
    expect(res.errors).toEqual([]);
    expect(res.stats.visual).toBeGreaterThan(0);
  });

  it("accepts Strudel's animations as visuals", async () => {
    const res = await v(`$: s("kick hat").bank("soda")\n$: visual("<punchcard pianoroll wordfall spiral pitchwheel scope spectrum>").hue(200).amount(.6)`);
    expect(res.errors).toEqual([]);
    expect(res.stats.visual).toBeGreaterThan(0);
  });

  it('knows default banks, aliases and synths', async () => {
    const idx = soundIndex(sounds);
    expect(idx.has('RolandTR909_bd')).toBe(true);
    expect(idx.has('tr909_bd')).toBe(true);
    expect(idx.has('soda_kick')).toBe(true);
    expect(idx.has('piano')).toBe(true);
    expect(idx.has('supersaw')).toBe(true);
    expect(idx.has('gm_epiano1')).toBe(true);
    expect(idx.has('gm_not_a_real_patch')).toBe(false);
    const res = await v('s("bd sd").bank("RolandTR909")');
    expect(res.warnings.join()).not.toMatch(/unknown sounds/);
  });

  it('reports syntax errors', async () => {
    const res = await v('s("bd sd"');
    expect(res.ok).toBe(false);
    expect(res.errors[0]).toMatch(/evaluation failed/);
  });

  it('errors on unknown visuals and fx, warns on unknown sounds and media', async () => {
    const res = await v(`$: s("nonexistent_thing")\n$: visual("lasers")\n$: img("nope").fx("liquify")`);
    expect(res.ok).toBe(false);
    expect(res.errors.join()).toMatch(/lasers/);
    expect(res.errors.join()).toMatch(/liquify/);
    expect(res.warnings.join()).toMatch(/nonexistent_thing/);
    expect(res.warnings.join()).toMatch(/nope/);
  });

  it('rejects double-quoted captions (parsed as mini-notation)', async () => {
    const res = await v(`$: s("kick").bank("soda")\n$: captions(["2:14 am", "exit 9"])`);
    expect(res.ok).toBe(false);
    expect(res.errors.join()).toMatch(/single quotes/);
  });

  it('resolves github: library URLs like Strudel', async () => {
    const { libraryUrl } = await import('../src/soda/validate.js');
    expect(libraryUrl('github:yaxu/clean-breaks')).toBe('https://raw.githubusercontent.com/yaxu/clean-breaks/main/strudel.json');
    expect(libraryUrl('github:user/repo/dev/kits')).toBe('https://raw.githubusercontent.com/user/repo/dev/kits/strudel.json');
    expect(libraryUrl('soda:soda')).toBeNull();
  });

  it('counts sounds from inline samples({...}) maps as known', async () => {
    const res = await v(`samples({ zing: ['https://e.com/z.wav'] })\n$: s("zing*2")`);
    expect(res.warnings.join()).not.toMatch(/unknown sounds/);
  });

  it('accepts media declared in the sketch', async () => {
    const res = await v('img("cover")', { media: { cover: 'https://e.com/c.png' } });
    expect(res.warnings.join()).not.toMatch(/unknown media/);
  });

  it('treats media-only haps as silent', () => {
    expect(isMediaOnly({ img: 'rain', fade: 0.5 })).toBe(true);
    expect(isMediaOnly({ s: 'bd', visual: 'pulse' })).toBe(false);
  });
});
