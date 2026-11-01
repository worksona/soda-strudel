// The microphone as a live INPUT (Input › Microphone): its loudness drives
// patterns through micLevel (0..1, like camMotion), and while it is on, video
// exports record it alongside the music. It is never sent to the speakers (no
// feedback), and it never starts on its own – enableMic() must come from a tap.
// Recording a take (the Record button) is separate: see mic.js.
import { getAudioContext } from '@strudel/webaudio';
import { setMicLevelSource } from '../soda/patterns.js';
import { recordingInput } from './master.js';

let stream = null;
let source = null;
let analyser = null;
let buffer = null;
let level = 0;
let lastRead = 0;
const listeners = new Set();

/** Smoothed loudness 0..1, read at most once per animation frame. */
function readLevel() {
  if (!analyser) return 0;
  const now = performance.now();
  if (now - lastRead < 12) return level;
  lastRead = now;
  analyser.getFloatTimeDomainData(buffer);
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  const rms = Math.min(1, Math.sqrt(sum / buffer.length) * 4);
  level += (rms - level) * (rms > level ? 0.5 : 0.12); // fast attack, slow release
  return level;
}
setMicLevelSource(readLevel);

export const micOn = () => !!stream;
export const onMicChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const micStream = () => stream;

export async function enableMic() {
  if (stream) return;
  const ac = getAudioContext();
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
  });
  if (ac.state !== 'running') await ac.resume().catch(() => {});
  source = ac.createMediaStreamSource(stream);
  analyser = ac.createAnalyser();
  analyser.fftSize = 1024;
  buffer = new Float32Array(analyser.fftSize);
  source.connect(analyser);
  // heard in video exports, never in the speakers
  const rec = recordingInput();
  if (rec) source.connect(rec);
  listeners.forEach((fn) => fn(true));
}

export function disableMic() {
  if (!stream) return;
  try {
    source?.disconnect();
  } catch {
    // already gone with its audio context
  }
  stream.getTracks().forEach((t) => t.stop());
  stream = source = analyser = null;
  level = 0;
  listeners.forEach((fn) => fn(false));
}
