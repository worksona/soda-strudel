import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkShortener, shortenUrl } from '../src/share/shorten.js';

const settings = { url: 'https://a47l.com/', token: 'tok' };
const reply = (status, body) => vi.fn(async () => ({ ok: status < 400, status, statusText: '', json: async () => body }));

afterEach(() => vi.unstubAllGlobals());

describe('short links', () => {
  it('posts the long link with the bearer token and builds the short URL', async () => {
    const fetch = reply(201, { slug: 'x9k', domain: 'a47l.com' });
    vi.stubGlobal('fetch', fetch);
    const short = await shortenUrl('https://soda-strudel.netlify.app/#z=abc', { notes: 'soda.strudel: Rain', settings });
    expect(short).toBe('https://a47l.com/x9k');
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://a47l.com/api/links');
    expect(init.method).toBe('POST');
    expect(init.headers.authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body)).toEqual({ url: 'https://soda-strudel.netlify.app/#z=abc', notes: 'soda.strudel: Rain' });
  });

  it('says plainly when the token is refused or missing', async () => {
    vi.stubGlobal('fetch', reply(401, { error: 'unauthorized' }));
    await expect(shortenUrl('https://e.com', { settings })).rejects.toThrow(/token was refused/);
    await expect(shortenUrl('https://e.com', { settings: { url: 'https://a47l.com', token: '' } })).rejects.toThrow(/Settings/);
  });

  it('checks the connection with whoami', async () => {
    vi.stubGlobal('fetch', reply(200, { role: 'peer', tokenId: 't1' }));
    expect(await checkShortener(settings)).toBe('peer');
  });
});
