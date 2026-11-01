// Loads Strudel's modules into the eval scope and registers sounds and media:
//   – synths, ZZFX, General MIDI soundfonts
//   – Strudel's default banks straight from GitHub raw (same sources as strudel.cc)
//   – our hosted packs: public/samples/<pack> -> samples('soda:<pack>'), media('soda:<pack>')
//   – the user's own sounds and media from IndexedDB
import * as core from '@strudel/core';
import { evalScope } from '@strudel/core';
import { registerSynthSounds, registerZZFXSounds, samples, aliasBank } from '@strudel/webaudio';
import { initHydra as strudelInitHydra } from '@strudel/hydra';
import { sodaScope } from '../soda/patterns.js';
import { loadMediaPack } from '../soda/mediaRegistry.js';
import { cameraVideo } from '../media/camera.js';
import { registerLibrary } from '../media/library.js';
import { loadClearedLibraries, loadSavedLibraries } from '../media/github.js';
import { loadDocs } from '../editor/assist.js';

const DOUGH = 'https://raw.githubusercontent.com/felixroos/dough-samples/main';
const DEFAULT_BANKS = [
  `${DOUGH}/tidal-drum-machines.json`,
  `${DOUGH}/piano.json`,
  `${DOUGH}/Dirt-Samples.json`,
  `${DOUGH}/vcsl.json`,
  `${DOUGH}/mridangam.json`,
  'https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main/strudel.json',
];
const ALIASES = 'https://raw.githubusercontent.com/todepond/samples/main/tidal-drum-machines-alias.json';
const HYDRA_SRC = 'https://unpkg.com/hydra-synth@1.4.0/dist/hydra-synth.js';

/** samples() that also understands soda:<pack> for our hosted packs. */
const sodaSamples = (arg, ...rest) =>
  typeof arg === 'string' && arg.startsWith('soda:')
    ? samples(new URL(`/samples/${arg.slice(5)}/strudel.json`, location.origin).href, ...rest)
    : samples(arg, ...rest);

/** initHydra pinned to a known hydra-synth build; the camera feeds s0 when it is on. */
async function initHydra(options = {}) {
  const hydra = await strudelInitHydra({ src: HYDRA_SRC, ...options });
  const cam = cameraVideo();
  if (cam.srcObject) globalThis.s0?.init?.({ src: cam });
  return hydra;
}

const warn = (what) => (e) => console.warn(`[soda] could not load ${what}:`, e?.message ?? e);

export async function prebake() {
  const modules = evalScope(
    core,
    import('@strudel/draw'),
    import('@strudel/mini'),
    import('@strudel/tonal'),
    import('@strudel/webaudio'),
    import('@strudel/codemirror'),
    import('@strudel/hydra'),
    import('@strudel/soundfonts'),
  );
  await modules;
  // ours last, so they win over the generic versions
  await evalScope(sodaScope, { samples: sodaSamples, initHydra, camVideo: cameraVideo });

  const catalogue = await fetch('/sounds.json')
    .then((r) => r.json())
    .catch(() => ({ packs: [] }));
  const mediaCatalogue = await fetch('/media.json')
    .then((r) => r.json())
    .catch(() => ({ packs: [] }));

  await Promise.all([
    registerSynthSounds(),
    registerZZFXSounds(),
    import('@strudel/soundfonts').then(({ registerSoundfonts }) => registerSoundfonts()).catch(warn('soundfonts')),
    // tag drum kits like strudel.cc does, so the Sounds page can group them
    ...DEFAULT_BANKS.map((url) => samples(url, undefined, /drum-machines|uzu-drumkit|mridangam/.test(url) ? { tag: 'drum-machines' } : {}).catch(warn(url))),
    ...catalogue.packs.map((p) => sodaSamples(p.id).catch(warn(p.id))),
    ...mediaCatalogue.packs.map((p) => loadMediaPack(p.id).catch(warn(p.id))),
    registerLibrary().catch(warn('your library')),
    loadSavedLibraries().catch(warn('GitHub libraries')),
    loadClearedLibraries().catch(warn('community sounds')),
    loadDocs().catch(warn('reference docs')),
  ]);
  aliasBank(ALIASES).catch(warn('bank aliases'));
}
