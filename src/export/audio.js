// Offline audio export: renders the pattern faster than real time into a WAV
// blob (exact timing). Mirrors Strudel's renderPatternAudio, but skips visual-only
// events (img/visual/captions would otherwise play as the default synth) and
// returns the file instead of downloading it.
import {
  getAudioContext,
  initAudio,
  resetGlobalEffects,
  setAudioContext,
  setSuperdoughAudioController,
  superdough,
} from '@strudel/webaudio';
import { SuperdoughAudioController } from 'superdough/superdoughoutput.mjs';
import { isMediaOnly } from '../soda/catalog.js';
import { encodeWav } from './wav.js';

export async function renderWav({ pattern, cps, cycles, sampleRate = 48000 }) {
  await getAudioContext().close();
  const offline = new OfflineAudioContext(2, Math.ceil((cycles / cps) * sampleRate), sampleRate);
  setAudioContext(offline);
  setSuperdoughAudioController(new SuperdoughAudioController(offline));
  try {
    await initAudio({ maxPolyphony: 256 });
    const haps = pattern
      .queryArc(0, cycles, { _cps: cps })
      .filter((h) => h.hasOnset() && !isMediaOnly(h.value))
      .sort((a, b) => a.whole.begin.valueOf() - b.whole.begin.valueOf());
    for (const hap of haps) {
      const t = hap.whole.begin.valueOf() / cps;
      try {
        await superdough(hap.value, t, hap.duration / cps, cps, t);
      } catch (e) {
        console.warn('[export] skipped event', e);
      }
    }
    const buffer = await offline.startRendering();
    return encodeWav({ sampleRate, channels: [buffer.getChannelData(0), buffer.getChannelData(1)] });
  } finally {
    // back to a live context for playback
    setAudioContext(null);
    setSuperdoughAudioController(null);
    resetGlobalEffects();
    await initAudio();
    await getAudioContext().resume?.();
  }
}
