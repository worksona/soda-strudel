// Headless sketch validation: transpile + evaluate the code with Strudel's real
// repl (no audio), query the first N cycles and check sounds, media and visuals
// against the catalogues. Used by the vibe skill (bundled for Node) and tests.
import * as core from '@strudel/core';
import * as mini from '@strudel/mini';
import * as tonal from '@strudel/tonal';
import { transpiler } from '@strudel/transpiler';
import { sodaScope } from './patterns.js';
import { VISUALS, FX, BLENDS, isMediaOnly } from './catalog.js';

const { repl, evalScope, silence } = core;

// Browser-only functions become harmless stubs so code that uses them still validates.
const chain = () => new Proxy(function () {}, { get: () => chain(), apply: () => chain() });
const hydraNames = ['osc', 'noise', 'voronoi', 'gradient', 'solid', 'src', 'render', 'shape', 's0', 's1', 's2', 's3', 'o0', 'o1', 'o2', 'o3', 'a'];
// samples(...) calls made by the code under validation – resolved afterwards so
// sounds from GitHub libraries count as known
let sampleCalls = [];

/** github:user/repo[/branch[/path]] or a URL -> the strudel.json URL (same rules as Strudel). */
export function libraryUrl(arg) {
  if (/^https?:\/\//.test(arg)) return arg.endsWith('.json') ? arg : `${arg.replace(/\/$/, '')}/strudel.json`;
  if (!arg.startsWith('github:')) return null;
  const [user, repo = 'samples', branch = 'main', ...rest] = arg.slice(7).replace(/\/$/, '').split('/');
  return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${rest.length ? `${rest.join('/')}/` : ''}strudel.json`;
}

async function namesFromSampleCalls(calls) {
  const names = new Set();
  const failed = [];
  await Promise.all(
    calls.map(async (arg) => {
      if (arg && typeof arg === 'object') return Object.keys(arg).forEach((k) => !k.startsWith('_') && names.add(k.toLowerCase()));
      const url = typeof arg === 'string' ? libraryUrl(arg) : null;
      if (!url) return;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) throw new Error(String(res.status));
        Object.keys(await res.json()).forEach((k) => !k.startsWith('_') && names.add(k.toLowerCase()));
      } catch (e) {
        failed.push(`${arg} (${e.message})`);
      }
    }),
  );
  return { names, failed };
}

let scopeReady;
async function ensureScope() {
  scopeReady ??= (async () => {
    await evalScope(core, mini, tonal, sodaScope, {
      samples: async (arg) => void sampleCalls.push(arg),
      aliasBank: async () => {},
      // In the browser initHydra() puts Hydra's globals (osc, shape, src, o0…) over
      // Strudel's – `shape` is also a Strudel control – so the stub does the same.
      initHydra: async () => { for (const n of hydraNames) globalThis[n] = chain(); },
      H: () => () => 0,
      // painters from @strudel/draw / webaudio: accept and ignore in Node
    });
    for (const n of hydraNames) if (!(n in globalThis)) globalThis[n] = chain();
    for (const m of ['pianoroll', 'punchcard', 'spiral', 'pitchwheel', 'wordfall', 'scope', 'spectrum', 'tscope', 'fscope', 'draw', 'onPaint', 'animate', 'markcss', 'color', 'colour']) {
      if (!core.Pattern.prototype[m]) core.Pattern.prototype[m] = function () { return this; };
      for (const p of ['_', '']) if (!core.Pattern.prototype[`_${m}`]) core.Pattern.prototype[`_${m}`] = function () { return this; };
    }
  })();
  return scopeReady;
}

/** Build a lookup of every known sound name from a sounds.json catalogue. */
export function soundIndex(catalogue) {
  // superdough lower-cases every sound key, so lookups are case-insensitive.
  const names = new Set((catalogue.synths ?? []).map((s) => s.toLowerCase()));
  for (const p of catalogue.packs ?? []) Object.keys(p.sounds).forEach((s) => names.add(s.toLowerCase()));
  for (const b of catalogue.defaults ?? []) Object.keys(b.sounds).forEach((s) => names.add(s.toLowerCase()));
  for (const [full, short] of Object.entries(catalogue.bankAliases ?? {})) {
    const prefix = `${full.toLowerCase()}_`;
    for (const n of [...names]) if (n.startsWith(prefix)) names.add(`${short.toLowerCase()}_${n.slice(prefix.length)}`);
  }
  // exact soundfont list when the catalogue has one, otherwise trust the gm_ prefix
  if (catalogue.soundfonts?.length) catalogue.soundfonts.forEach((s) => names.add(s.toLowerCase()));
  const sf = catalogue.soundfonts?.length ? null : (catalogue.soundfontPrefix ?? 'gm_').toLowerCase();
  return { has: (s) => names.has(s.toLowerCase()) || (sf !== null && s.toLowerCase().startsWith(sf)), size: names.size };
}

export function mediaIndex(catalogue, extra = {}) {
  const names = new Set(Object.keys(extra));
  for (const p of catalogue.packs ?? []) Object.keys(p.items).forEach((n) => names.add(n));
  return names;
}

const soundName = (v) => {
  if (v.s === undefined) return v.note !== undefined || v.n !== undefined || v.freq !== undefined ? 'triangle' : undefined;
  const s = String(v.s);
  return v.bank ? `${v.bank}_${s}` : s;
};

/**
 * @param {import('../share/sketch.js').Sketch} sketch
 * @param {{ sounds?: object, media?: object, cycles?: number }} catalogues
 */
export async function validateSketch(sketch, { sounds, media, cycles = 8 } = {}) {
  await ensureScope();
  const errors = [];
  const warnings = [];
  let evalError;
  sampleCalls = [];
  const r = repl({ getTime: () => 0, defaultOutput: async () => {}, transpiler, onEvalError: (e) => (evalError = e) });
  const globals = Object.fromEntries(hydraNames.map((n) => [n, globalThis[n]]));
  const pattern = await r.evaluate(sketch.code, false);
  Object.assign(globalThis, globals); // a sketch's initHydra() must not leak into the next one
  const libraries = await namesFromSampleCalls(sampleCalls);
  if (evalError || !pattern) {
    errors.push(`evaluation failed: ${evalError?.message ?? 'no pattern returned'}`);
    return { ok: false, errors, warnings, stats: {} };
  }
  if (pattern === silence) warnings.push('pattern is silent');

  let haps = [];
  try {
    haps = pattern.queryArc(0, cycles).filter((h) => h.hasOnset());
  } catch (e) {
    errors.push(`query failed: ${e.message}`);
  }
  if (!haps.length) errors.push(`no events in the first ${cycles} cycles`);

  const sIdx = sounds ? soundIndex(sounds) : null;
  const mIdx = media ? mediaIndex(media, sketch.media) : null;
  const unknown = { sounds: new Set(), media: new Set(), visuals: new Set(), fx: new Set(), blend: new Set() };
  let audible = 0;
  let visualEvents = 0;
  let badCaptions = 0;
  for (const { value: v } of haps) {
    if (!v || typeof v !== 'object') continue;
    if (isMediaOnly(v)) visualEvents++;
    else {
      audible++;
      const name = soundName(v);
      if (sIdx && name && !sIdx.has(name) && !libraries.names.has(name.toLowerCase())) unknown.sounds.add(name);
    }
    for (const k of ['img', 'vid']) if (v[k] !== undefined && mIdx && !mIdx.has(String(v[k])) && !/^(https?:|local:)/.test(v[k])) unknown.media.add(String(v[k]));
    if (v.visual !== undefined && !VISUALS[v.visual]) unknown.visuals.add(String(v.visual));
    if (v.caption !== undefined && typeof v.caption !== 'string') badCaptions++;
    if (v.fx !== undefined && !FX.includes(v.fx)) unknown.fx.add(String(v.fx));
    if (v.blend !== undefined && !BLENDS.includes(v.blend)) unknown.blend.add(String(v.blend));
  }
  if (badCaptions)
    errors.push(`captions must be plain strings: use single quotes, e.g. captions(['2:14 am', 'exit 9']) – double quotes are parsed as mini-notation`);
  if (libraries.failed.length) warnings.push(`could not load sample libraries: ${libraries.failed.join(', ')}`);
  if (!audible) warnings.push('no audible events – the sketch is visuals only');
  if (unknown.sounds.size) warnings.push(`unknown sounds (will be silent unless loaded in the code or the user's library): ${[...unknown.sounds].join(', ')}`);
  if (unknown.media.size) warnings.push(`unknown media names: ${[...unknown.media].join(', ')}`);
  if (unknown.visuals.size) errors.push(`unknown visuals: ${[...unknown.visuals].join(', ')} (use one of ${Object.keys(VISUALS).join(', ')})`);
  if (unknown.fx.size) errors.push(`unknown fx: ${[...unknown.fx].join(', ')} (use one of ${FX.join(', ')})`);
  if (unknown.blend.size) errors.push(`unknown blend: ${[...unknown.blend].join(', ')} (use one of ${BLENDS.join(', ')})`);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: { events: haps.length, audible, visual: visualEvents, cycles, cps: r.scheduler.cps },
  };
}
