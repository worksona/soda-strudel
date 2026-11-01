import { describe, expect, it } from 'vitest';
import { hintAt } from '../src/editor/hints.js';

const ctx = {
  findDoc: (name) => (name === 'lpf' ? { name: 'lpf', description: 'low-pass filter' } : null),
  sounds: { bd: { data: { type: 'sample', samples: ['a', 'b', 'c'] } }, sawtooth: { data: { type: 'synth' } } },
  banks: new Set(['soda']),
  media: new Map([['rain', 'an image in the media pack']]),
};
const at = (code, word, k = 1) => hintAt(code, code.indexOf(word) + k, 1, ctx);

describe('hover hints', () => {
  it('shows a function doc for a function name', () => {
    expect(at('$: s("bd").lpf(800)', 'lpf').doc.name).toBe('lpf');
  });
  it('names effectors, looks, visuals and blends inside strings', () => {
    expect(at('cam().fx("vhs:kaleido")', 'kaleido').body).toMatch(/^effector – kaleidoscope/);
    expect(at('img("x").fx("posterize")', 'posterize').body).toMatch(/^look/);
    expect(at('visual("spiral")', 'spiral').body).toMatch(/spiral/);
    expect(at('img("x").blend("screen")', 'screen').body).toMatch(/^blend – lightens/);
  });
  it('knows sounds, banks, media and notes', () => {
    expect(at('s("bd sd")', 'bd').body).toMatch(/sample · 3 variations/);
    expect(at('note("c2").s("sawtooth")', 'sawtooth').body).toBe('sound – synth');
    expect(at('s("bd").bank("soda")', 'soda').body).toMatch(/^sound bank/);
    expect(at('img("rain")', 'rain').body).toMatch(/media pack/);
    expect(at('note("c2 eb2")', 'eb2').body).toBe('note – MIDI 39');
  });
  it('explains mini-notation symbols', () => {
    expect(at('s("bd*4")', '*', 0).body).toMatch(/^faster/);
    expect(at('s("<bd sd>")', '<', 0).body).toMatch(/one per cycle/);
    expect(at('s("bd ~ sd")', '~', 0).body).toMatch(/^rest/);
  });
  it('explains $: and stays quiet in comments and plain strings', () => {
    expect(at('$: s("bd")', '$', 0).title).toBe('$:');
    expect(at('// lpf here', 'lpf')).toBeNull();
    expect(at("captions(['lpf'])", 'lpf')).toBeNull();
    expect(at('s("unknownthing")', 'unknownthing')).toBeNull();
  });
});
