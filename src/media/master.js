// Taps Strudel's master output (superdough's destination gain) for analysis
// (visuals) and for recording (video export). superdough rebuilds its output
// node on some resets, so the tap re-attaches whenever the node changes.
import { getAudioContext, getSuperdoughAudioController } from '@strudel/webaudio';

let tapped = null;
let ctx = null;
let analyser = null;
let streamDest = null;
let bus = null; // what recordings hear: the music, plus the live microphone when it is on
let fft = new Float32Array(512);
let wave = new Float32Array(1024);

function ensure() {
  const ac = getAudioContext();
  if (ac !== ctx) {
    ctx = ac;
    tapped = null;
    analyser = ac.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    fft = new Float32Array(analyser.frequencyBinCount);
    wave = new Float32Array(analyser.fftSize);
    streamDest = ac.createMediaStreamDestination ? ac.createMediaStreamDestination() : null;
    bus = ac.createGain();
    if (streamDest) bus.connect(streamDest);
  }
  const out = getSuperdoughAudioController()?.output?.destinationGain;
  if (out && out !== tapped) {
    out.connect(analyser);
    out.connect(bus);
    tapped = out;
  }
}

/** Called once per frame by the stage. Returns fresh analysis buffers. */
export function readMaster() {
  try {
    ensure();
    analyser.getFloatFrequencyData(fft);
    analyser.getFloatTimeDomainData(wave);
  } catch {
    // audio not started yet
  }
  let sum = 0;
  for (let i = 0; i < wave.length; i++) sum += wave[i] * wave[i];
  return { fft, wave, level: Math.min(1, Math.sqrt(sum / wave.length) * 3) };
}

/** The recording bus: recorded but not heard – the live microphone joins it, captures tap it. */
export function recordingInput() {
  try {
    ensure();
  } catch {
    return null;
  }
  return bus;
}

/** MediaStream carrying exactly what the user hears, for MediaRecorder. */
export function masterStream() {
  ensure();
  return streamDest?.stream ?? null;
}
