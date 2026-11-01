import { describe, expect, it } from 'vitest';
import { KNOWN_REPOS, isSongFile, parseRepo, repoSongItem, soundName } from '../src/share/repos.js';

describe('parseRepo', () => {
  it('reads owner/repo, host prefixes and paths', () => {
    expect(parseRepo('eefano/strudel-songs-collection')).toMatchObject({ host: 'github', owner: 'eefano', repo: 'strudel-songs-collection', path: '' });
    expect(parseRepo('codeberg:fcm/my-strudel-repo/sessions')).toMatchObject({ host: 'codeberg', owner: 'fcm', repo: 'my-strudel-repo', path: 'sessions', id: 'codeberg:fcm/my-strudel-repo/sessions' });
  });
  it('reads GitHub file and folder links', () => {
    expect(parseRepo('https://github.com/eefano/strudel-songs-collection/blob/main/anniesroom.js')).toMatchObject({ branch: 'main', path: 'anniesroom.js' });
    expect(parseRepo('https://github.com/kahlys/livecodingmusic/tree/main/ideas')).toMatchObject({ branch: 'main', path: 'ideas' });
    expect(parseRepo('https://github.com/eefano/strudel-songs-collection')).toMatchObject({ branch: null, path: '' });
  });
  it('reads Codeberg links', () => {
    expect(parseRepo('https://codeberg.org/taconi/sketches/src/branch/main/musics/24')).toMatchObject({ host: 'codeberg', branch: 'main', path: 'musics/24' });
  });
  it('refuses what is not a repository', () => {
    expect(() => parseRepo('')).toThrow();
    expect(() => parseRepo('just-a-name')).toThrow();
    expect(() => parseRepo('a b/c')).toThrow();
  });
  it('keeps the known repositories parseable', () => {
    for (const r of KNOWN_REPOS) expect(parseRepo(r.id).id).toBe(r.id);
  });
});

describe('isSongFile', () => {
  it('keeps song files and skips tooling', () => {
    for (const p of ['anniesroom.js', 'songs/a.str', 'x/y.strudel', 'liquid/ossuary.txt', 'a.tidal']) expect(isSongFile(p), p).toBe(true);
    for (const p of ['package.json', 'vite.config.js', 'node_modules/a.js', 'README.md', 'src/components/App.js', 'requirements.txt', 'a.wav']) expect(isSongFile(p), p).toBe(false);
  });
});

describe('soundName', () => {
  it('makes names Strudel accepts', () => {
    expect(soundName('Kick Drums')).toBe('kick_drums');
    expect(soundName('808.wav')).toBe('_808');
    expect(soundName('---')).toBe('sound');
  });
});

describe('repoSongItem', () => {
  it('credits the owner and asks before reuse without a licence', () => {
    const item = repoSongItem({ info: { owner: 'eefano', license: 'none stated' } }, { title: 'anniesroom', url: 'u', source: 'u', load: { url: 'r' } });
    expect(item).toMatchObject({ by: 'eefano', reuse: 'public' });
    expect(item.license).toMatch(/not stated/);
    expect(repoSongItem({ info: { owner: 'x', license: 'MIT' } }, { title: 't', load: { url: 'r' } }).reuse).toBe('open');
  });
});
