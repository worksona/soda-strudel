// Offline audio export: renders the current pattern faster than real time with
// Strudel's renderPatternAudio (exact timing, WAV download). Strudel swaps in an
// OfflineAudioContext for the render, so we stop playback first and re-init
// live audio afterwards.
import { renderPatternAudio, initAudio, getAudioContext } from '@strudel/webaudio';

export async function exportWav({ pattern, cps, cycles, name }) {
  await renderPatternAudio(pattern, cps, 0, cycles, 48000, 256, false, name);
  await initAudio();
  await getAudioContext().resume?.();
}
