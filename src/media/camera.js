// One shared camera stream for every layer (media layer, Hydra, motion signal).
// Never starts on its own: enableCamera() must come from a user tap.
import { setCamMotionSource } from '../soda/patterns.js';

const video = document.createElement('video');
video.muted = true;
video.playsInline = true;
video.setAttribute('playsinline', '');

let stream = null;
let facing = 'user';
let motion = 0;
const listeners = new Set();

const probe = document.createElement('canvas');
probe.width = 64;
probe.height = 48;
const pctx = probe.getContext('2d', { willReadFrequently: true });
let prev = null;

function sampleMotion() {
  if (!stream || video.readyState < 2) return;
  pctx.drawImage(video, 0, 0, 64, 48);
  const { data } = pctx.getImageData(0, 0, 64, 48);
  if (prev) {
    let diff = 0;
    for (let i = 0; i < data.length; i += 4) diff += Math.abs(data[i] - prev[i]) + Math.abs(data[i + 1] - prev[i + 1]);
    const m = Math.min(1, diff / (64 * 48 * 2 * 40));
    motion += (m - motion) * 0.25;
  }
  prev = data;
}
setCamMotionSource(() => motion);

export const cameraVideo = () => video;
export const cameraOn = () => !!stream;
export const onCameraChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const tickCamera = sampleMotion;

export async function enableCamera(nextFacing = facing) {
  disableCamera(false);
  facing = nextFacing;
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play().catch(() => {});
  // feed Hydra's first source if Hydra is running
  globalThis.s0?.init?.({ src: video });
  listeners.forEach((fn) => fn(true));
}

export function disableCamera(notify = true) {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
  prev = null;
  motion = 0;
  notify && listeners.forEach((fn) => fn(false));
}

export const flipCamera = () => enableCamera(facing === 'user' ? 'environment' : 'user');

// Pause the camera while the tab is hidden – saves battery, avoids surprise.
document.addEventListener('visibilitychange', () => {
  if (!stream) return;
  stream.getVideoTracks().forEach((t) => (t.enabled = !document.hidden));
});
