// Live capture: the stage canvas + the master bus into one video file.
// Everything is rendered and encoded on the user's machine.
import { masterStream } from '../media/master.js';

const CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function pickVideoMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  return CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
}
export const extensionFor = (mime) => (mime.includes('mp4') ? 'mp4' : 'webm');

/**
 * Records `seconds` of the stage. The stage renders at `size` px (short side)
 * while recording. Resolves with a Blob.
 */
export async function recordStage(stage, { seconds, size = 1080, onProgress, signal } = {}) {
  const mimeType = pickVideoMime();
  if (mimeType === null) throw new Error('This browser cannot record video (MediaRecorder missing).');
  stage.setExportMode(true, size);
  const video = stage.canvas.captureStream(60);
  const audio = masterStream();
  const tracks = [...video.getVideoTracks(), ...(audio?.getAudioTracks() ?? [])];
  const recorder = new MediaRecorder(new MediaStream(tracks), {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: 10_000_000,
    audioBitsPerSecond: 192_000,
  });
  const chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((r) => (recorder.onstop = r));
  recorder.start(250);
  const started = performance.now();
  await new Promise((resolve) => {
    const tick = () => {
      const p = (performance.now() - started) / 1000 / seconds;
      onProgress?.(Math.min(1, p));
      if (p >= 1 || signal?.aborted) return resolve();
      setTimeout(tick, 100);
    };
    tick();
  });
  recorder.stop();
  await stopped;
  video.getTracks().forEach((t) => t.stop());
  stage.setExportMode(false);
  return new Blob(chunks, { type: recorder.mimeType || mimeType || 'video/webm' });
}

export function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

/** Phone share sheet (Instagram, TikTok, Messages…) when available, else download. */
export async function shareOrDownload(blob, filename, title) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
    }
  }
  download(blob, filename);
  return 'downloaded';
}
