import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, EXAMPLES } from '../src/examples.js';
import { validateSketch } from '../src/soda/validate.js';

const sounds = JSON.parse(readFileSync(new URL('../public/sounds.json', import.meta.url)));
const media = JSON.parse(readFileSync(new URL('../public/media.json', import.meta.url)));

describe('built-in examples', () => {
  it('all have a known category, a description and a shape', () => {
    for (const ex of EXAMPLES) {
      expect(CATEGORIES).toContain(ex.category);
      expect(ex.about?.length).toBeGreaterThan(10);
      expect(['free', '9:16', '1:1', '16:9']).toContain(ex.aspect);
    }
  });

  it('credit the work they are made after', () => {
    for (const ex of EXAMPLES) {
      // a header that says "after …" or "adapted from …" needs a credit the page can show
      const borrowed = /\b(after [A-Z][\w ]+,|adapted from)/.test(ex.code.split('\n').slice(0, 3).join(' '));
      if (borrowed) expect(ex.credit?.length, ex.title).toBeGreaterThan(0);
      for (const c of ex.credit ?? []) {
        expect(c.by, ex.title).toBeTruthy();
        expect(c.title, ex.title).toBeTruthy();
        expect(c.url, ex.title).toMatch(/^https:\/\//);
        expect(c.license, ex.title).toBeTruthy();
      }
    }
  });

  for (const ex of EXAMPLES) {
    it(`validates: ${ex.title}`, async () => {
      const res = await validateSketch({ code: ex.code }, { sounds, media });
      expect(res.errors).toEqual([]);
      // network-dependent: a GitHub library may be unreachable offline
      const warnings = res.warnings.filter((w) => !/could not load sample libraries/.test(w) && !(/unknown sounds/.test(w) && res.warnings.some((x) => /could not load/.test(x))));
      expect(warnings).toEqual([]);
      expect(res.stats.audible).toBeGreaterThan(0);
    });
  }
});
