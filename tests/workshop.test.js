import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WORKSHOP } from '../src/workshop.js';
import { validateSketch } from '../src/soda/validate.js';

const sounds = JSON.parse(readFileSync(new URL('../public/sounds.json', import.meta.url)));
const media = JSON.parse(readFileSync(new URL('../public/media.json', import.meta.url)));

describe('Strudel workshop examples', () => {
  for (const chapter of WORKSHOP) {
    for (const [i, item] of chapter.items.entries()) {
      it(`${chapter.id} #${i + 1} ${item.heading}`, async () => {
        const res = await validateSketch({ code: item.code }, { sounds, media });
        expect(res.errors).toEqual([]);
      });
    }
  }
});
