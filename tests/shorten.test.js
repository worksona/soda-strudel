import { afterEach, describe, expect, it, vi } from 'vitest';
import shorten, { isSketchLink } from '../netlify/functions/shorten.mjs';

const SITE = 'https://soda-strudel.netlify.app';
const post = (body) => new Request(`${SITE}/api/shorten`, { method: 'POST', body: JSON.stringify(body) });
const reply = (status, body) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('short link function', () => {
  it('only accepts links to sketches on this site', () => {
    expect(isSketchLink(`${SITE}/#z=abc_-1`, 'soda-strudel.netlify.app')).toBe(true);
    expect(isSketchLink('https://evil.example/#z=abc', 'soda-strudel.netlify.app')).toBe(false);
    expect(isSketchLink(`${SITE}/other#z=abc`, 'soda-strudel.netlify.app')).toBe(false);
    expect(isSketchLink(`${SITE}/?x=1#z=abc`, 'soda-strudel.netlify.app')).toBe(false);
    expect(isSketchLink(`http://soda-strudel.netlify.app/#z=abc`, 'soda-strudel.netlify.app')).toBe(false);
  });

  it('reports whether short links are set up', async () => {
    expect(await (await shorten(new Request(`${SITE}/api/shorten`))).json()).toEqual({ enabled: false });
    vi.stubEnv('SHORTLINK_TOKEN', 'secret');
    expect(await (await shorten(new Request(`${SITE}/api/shorten`))).json()).toEqual({ enabled: true });
  });

  it('calls the shortener with the secret token and returns the short link', async () => {
    vi.stubEnv('SHORTLINK_TOKEN', 'secret');
    const fetch = reply(201, { slug: 'x9k', domain: 'a47l.com' });
    vi.stubGlobal('fetch', fetch);
    const res = await shorten(post({ url: `${SITE}/#z=abc`, title: 'Rain' }));
    expect(await res.json()).toEqual({ short: 'https://a47l.com/x9k' });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://a47l.com/api/links');
    expect(init.headers.authorization).toBe('Bearer secret');
    expect(JSON.parse(init.body)).toEqual({ url: `${SITE}/#z=abc`, notes: 'soda.strudel: Rain' });
  });

  it('refuses other links and never echoes the token', async () => {
    vi.stubEnv('SHORTLINK_TOKEN', 'secret');
    vi.stubGlobal('fetch', reply(401, { error: 'unauthorized' }));
    const bad = await shorten(post({ url: 'https://evil.example/' }));
    expect(bad.status).toBe(400);
    const refused = await shorten(post({ url: `${SITE}/#z=abc` }));
    expect(refused.status).toBe(502);
    expect(await refused.text()).not.toContain('secret');
  });

  it('says so when no token is set', async () => {
    const res = await shorten(post({ url: `${SITE}/#z=abc` }));
    expect(res.status).toBe(503);
  });
});
