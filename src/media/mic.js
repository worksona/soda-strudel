// Live sampling: record the mic into a take, trim leading/trailing silence,
// store it as a WAV in IndexedDB and register it as a playable sound.
import { getAudioContext } from '@strudel/webaudio';
import { encodeWav } from '../export/wav.js';

let recorder = null;
let chunks = [];

export const isRecording = () => recorder?.state === 'recording';

export async function startTake() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  chunks = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.start();
}

/** Stops recording and returns a trimmed WAV blob (or null if nothing was captured). */
export async function stopTake() {
  if (!recorder) return null;
  const done = new Promise((r) => (recorder.onstop = r));
  recorder.stop();
  await done;
  recorder.stream.getTracks().forEach((t) => t.stop());
  const blob = new Blob(chunks, { type: recorder.mimeType });
  recorder = null;
  if (!blob.size) return null;
  const buffer = await getAudioContext().decodeAudioData(await blob.arrayBuffer());
  return encodeWav(trimSilence(buffer));
}

export function trimSilence(buffer, threshold = 0.02) {
  const data = buffer.getChannelData(0);
  let start = 0;
  let end = data.length - 1;
  while (start < end && Math.abs(data[start]) < threshold) start++;
  while (end > start && Math.abs(data[end]) < threshold) end--;
  const pad = Math.floor(buffer.sampleRate * 0.01);
  start = Math.max(0, start - pad);
  end = Math.min(data.length, end + pad);
  return { sampleRate: buffer.sampleRate, channels: Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c).slice(start, end)) };
}
