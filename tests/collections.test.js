import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { creditHeader, extractExport, pieceKey } from '../src/share/pieces.js';
import { decodeCollection, encodeCollection } from '../src/share/sketch.js';
import ALLOW from '../netlify/lib/piece-allow.mjs';
import piece from '../netlify/functions/piece.mjs';

const rep = JSON.parse(readFileSync(new URL('../public/repertoire.json', import.meta.url)));
const OPEN = /^(CC BY|CC0|MIT|AGPL|GPL|Unlicense)/;

describe('Repertoire collections', () => {
  it('have titles, blurbs and items that link or open', () => {
    expect(rep.collections.length).toBeGreaterThanOrEqual(10);
    for (const c of rep.collections) {
      expect(c.id).toMatch(/^[a-z0-9-]+$/);
      expect(c.title && c.blurb).toBeTruthy();
      expect(c.items.length).toBeGreaterThanOrEqual(5);
      for (const it of c.items) expect(it.url || it.example || it.load, `${c.id}: ${it.title}`).toBeTruthy();
    }
  });

  it('open only pieces with an open licence, and credit them', () => {
    for (const c of rep.collections)
      for (const it of c.items.filter((i) => i.load)) {
        expect(it.license, it.title).toMatch(OPEN);
        expect(it.by, it.title).toBeTruthy();
        expect(ALLOW).toContain(pieceKey(it.load));
      }
    expect(rep.allow).toEqual(ALLOW);
  });

  it('never carry code in a link', () => {
    for (const c of rep.collections) for (const it of c.items) if (it.url) expect(it.url.length, it.title).toBeLessThan(300);
  });
});

describe('extractExport', () => {
  const src = 'export const a = `one`;\nexport const b = `two \\` tick ${x} \\\\ back`;\nexport const c = 3;';
  it('returns the template literal of the named export', () => {
    expect(extractExport(src, 'a')).toBe('one');
    expect(extractExport(src, 'b')).toBe('two ` tick ${x} \\ back');
  });
  it('returns null for a missing or odd name', () => {
    expect(extractExport(src, 'zz')).toBeNull();
    expect(extractExport(src, 'a)|(')).toBeNull();
  });
});

describe('creditHeader', () => {
  it('names the piece, the author, the licence and the source', () => {
    const h = creditHeader({ title: 'Caverave', by: 'Felix Roos', license: 'CC BY-NC-SA 4.0', source: 'https://codeberg.org/x' });
    expect(h).toMatch(/"Caverave" by Felix Roos/);
    expect(h).toMatch(/Licence: CC BY-NC-SA 4.0 · source: https:\/\/codeberg.org\/x/);
    expect(h.split('\n').every((l) => !l || l.startsWith('//'))).toBe(true);
  });
});

describe('collection links', () => {
  it('round-trip a shared collection', async () => {
    const c = { title: 'Mine', blurb: 'b', items: [{ kind: 'video', title: 't', url: 'https://youtu.be/x' }] };
    const frag = await encodeCollection(c);
    expect(frag).toMatch(/^col=[\w-]+$/);
    expect(await decodeCollection(`https://x/#${frag}`)).toMatchObject(c);
  });
  it('read a built-in collection id', async () => {
    expect(await decodeCollection('#collection=start-here')).toEqual({ id: 'start-here' });
    expect(await decodeCollection('#z=abc')).toBeNull();
  });
});

describe('/api/piece', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('refuses pieces that are not on the allowlist', async () => {
    const res = await piece(new Request('https://soda/api/piece?url=https://example.com/x.js'));
    expect(res.status).toBe(403);
  });
  it('fetches an allowed piece and extracts a named tune', async () => {
    const key = ALLOW.find((k) => k.includes('#'));
    const [url, name] = key.split('#');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(`export const ${name} = \`// hello\`;`)));
    const res = await piece(new Request(`https://soda/api/piece?url=${encodeURIComponent(url)}&export=${name}`));
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.text()).toBe('// hello');
  });
});
