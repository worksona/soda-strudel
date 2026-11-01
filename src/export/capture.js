// Live capture, started and stopped by hand (the recorder dock) or after a set
// time (the Export page). Two kinds:
//   – video: the stage canvas at the export frame and size, with the recording
//     bus (the music, plus the live microphone when it is on), via MediaRecorder
//   – audio: the recording bus as lossless 16-bit WAV, sample by sample
// Each start returns { stop(): Promise<Blob>, elapsed(): seconds, mime }.
import { getAudioContext } from '@strudel/webaudio';
import { masterStream, recordingInput } from '../media/master.js';
import { encodeWav } from './wav.js';

const VIDEO_TYPES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function pickVideoMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  return VIDEO_TYPES.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
}
export const extensionFor = (mime) => (mime.includes('mp4') ? 'mp4' : mime.includes('wav') ? 'wav' : 'webm');

export async function startVideoCapture(stage, { size = 1080 } = {}) {
  const mimeType = pickVideoMime();
  if (mimeType === null) throw new Error('this browser cannot record video');
  stage.setExportMode(true, size);
  const video = stage.canvas.captureStream(60);
  const audio = masterStream();
  const recorder = new MediaRecorder(new MediaStream([...video.getVideoTracks(), ...(audio?.getAudioTracks() ?? [])]), {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: size >= 1440 ? 16_000_000 : 10_000_000,
    audioBitsPerSecond: 192_000,
  });
  const chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((r) => (recorder.onstop = r));
  recorder.start(250);
  const started = performance.now();
  let result;
  return {
    mime: mimeType || 'video/webm',
    elapsed: () => (performance.now() - started) / 1000,
    bytes: () => chunks.reduce((n, c) => n + c.size, 0),
    stop() {
      result ??= (async () => {
        if (recorder.state !== 'inactive') recorder.stop();
        await stopped;
        video.getTracks().forEach((t) => t.stop());
        stage.setExportMode(false);
        return new Blob(chunks, { type: recorder.mimeType || mimeType || 'video/webm' });
      })();
      return result;
    },
  };
}

// The worklet copies every block it hears to the page. Written inline so the
// build needs no extra file.
const RECORDER_WORKLET = `
class SodaTap extends AudioWorkletProcessor {
  constructor() { super(); this.on = true; this.port.onmessage = () => (this.on = false); }
  process(inputs) {
    const input = inputs[0];
    if (input && input.length) this.port.postMessage(input.map((ch) => ch.slice(0)));
    return this.on;
  }
}
registerProcessor('soda-tap', SodaTap);
`;
const loaded = new WeakSet();

export async function startAudioCapture() {
  const ac = getAudioContext();
  const bus = recordingInput();
  if (!bus || !ac.audioWorklet) throw new Error('this browser cannot record audio');
  if (!loaded.has(ac)) {
    const url = URL.createObjectURL(new Blob([RECORDER_WORKLET], { type: 'text/javascript' }));
    await ac.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    loaded.add(ac);
  }
  const tap = new AudioWorkletNode(ac, 'soda-tap', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 2, channelCountMode: 'explicit' });
  const silent = ac.createGain();
  silent.gain.value = 0; // keeps the tap pulled without being heard
  bus.connect(tap);
  tap.connect(silent).connect(ac.destination);
  const blocks = [[], []];
  let frames = 0;
  tap.port.onmessage = ({ data }) => {
    blocks[0].push(data[0]);
    blocks[1].push(data[1] ?? data[0]);
    frames += data[0].length;
  };
  const started = performance.now();
  let result;
  return {
    mime: 'audio/wav',
    elapsed: () => (performance.now() - started) / 1000,
    bytes: () => 44 + frames * 4,
    stop() {
      result ??= (async () => {
        tap.port.postMessage('stop');
        try {
          bus.disconnect(tap);
        } catch {
          // already gone
        }
        tap.disconnect();
        silent.disconnect();
        const join = (list) => {
          const out = new Float32Array(frames);
          let o = 0;
          for (const b of list) out.set(b.subarray(0, Math.min(b.length, frames - o)), o), (o += b.length);
          return out;
        };
        return encodeWav({ sampleRate: ac.sampleRate, channels: [join(blocks[0]), join(blocks[1])] });
      })();
      return result;
    },
  };
}

/** Records `seconds` of the stage – the Export page's fixed-length video. */
export async function recordStage(stage, { seconds, size = 1080, onProgress, signal } = {}) {
  const cap = await startVideoCapture(stage, { size });
  await new Promise((resolve) => {
    const tick = () => {
      const p = cap.elapsed() / seconds;
      onProgress?.(Math.min(1, p));
      if (p >= 1 || signal?.aborted) return resolve();
      setTimeout(tick, 100);
    };
    tick();
  });
  return cap.stop();
}
