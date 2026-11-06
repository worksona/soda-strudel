// netlify.toml is the only place these headers live, so pin them: a sketch embedded in a
// sandboxed frame (opaque origin) needs CORS on the app's code and the JSON it fetches.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
const blocks = toml.split('[[headers]]').slice(1).map((b) => ({
  for: (b.match(/for\s*=\s*"([^"]+)"/) || [])[1],
  acao: (b.match(/Access-Control-Allow-Origin\s*=\s*"([^"]+)"/) || [])[1],
}));
const acao = (path) => blocks.find((b) => b.for === path)?.acao;

describe('netlify.toml CORS for embeds', () => {
  for (const p of ['/assets/*', '/sounds.json', '/media.json', '/repertoire.json', '/strudel-docs.json', '/samples/*', '/media/*'])
    it(`${p} is readable cross-origin`, () => expect(acao(p)).toBe('*'));
  it('no COOP/COEP (they would block GitHub, Freesound and Shabda samples)', () => {
    expect(toml).not.toMatch(/Cross-Origin-(Opener|Embedder)-Policy/);
  });
  it('the site root does not send CORS (only the static code and data do)', () => expect(acao('/*')).toBeUndefined());
});
