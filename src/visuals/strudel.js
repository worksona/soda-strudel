// Strudel's own animations as soda visuals, full-stage by default.
//
//   $: visual("punchcard").hue(200)      // every audible layer, scrolling with the music
//   $: visual("<spiral pitchwheel>").slow(8).amount(.8)
//
// Strudel chains these onto one pattern (`.punchcard()`, `.spiral()` …), which
// paints that layer in the editor-sized default. Here they are visuals like any
// other: they show all audible layers, fill the stage, take hue / amount /
// opacity / blend / fade, and compose with media and captions. Each paints into
// its own canvas (the Strudel painters clear the canvas they draw on).
import { getPunchcardPainter, pitchwheel as drawPitchwheel } from '@strudel/draw';
import { pure } from '@strudel/core';

const color = (hue, l = 60, a = 1) => `hsla(${hue},85%,${l}%,${a})`;

/** An offscreen canvas per instance, kept at the stage size. */
function scratch(state, w, h) {
  if (!state.canvas) {
    state.canvas = document.createElement('canvas');
    state.ctx = state.canvas.getContext('2d');
  }
  if (state.canvas.width !== w || state.canvas.height !== h) {
    state.canvas.width = w;
    state.canvas.height = h;
  }
  state.ctx.clearRect(0, 0, w, h);
  return state.ctx;
}

const roll = (name, description, extra) => ({
  name,
  description,
  create: () => ({}),
  frame(state, ctx, f) {
    const hue = Number(f.params.hue ?? 200);
    const c = scratch(state, f.w, f.h);
    const painter = getPunchcardPainter({
      active: color(hue, 70),
      inactive: color(hue, 45, 0.8),
      playheadColor: 'rgba(255,255,255,.7)',
      fillActive: 1,
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      ...extra(f),
    });
    painter(c, f.time, f.haps, f.drawTime);
    ctx.drawImage(state.canvas, 0, 0);
  },
});

export const punchcard = roll('punchcard', 'Strudel\'s punchcard: every audible layer as scrolling blocks, one row per sound or note, playhead in the middle.', () => ({ fold: 1 }));

export const pianoroll = roll('pianoroll', 'Strudel\'s pianoroll: notes on a pitch axis scrolling past the playhead; amount < .5 flips it vertical for phones.', (f) => ({
  fold: 0,
  autorange: 1,
  vertical: Number(f.params.amount ?? 0.5) < 0.5 ? 1 : 0,
}));

export const wordfall = roll('wordfall', 'Strudel\'s wordfall: event names fall down the stage in time (vertical, labelled).', () => ({
  vertical: 1,
  labels: 1,
  stroke: 0,
  fillActive: 1,
  active: 'white',
}));

export const spiral = {
  name: 'spiral',
  description: 'Strudel\'s spiral: the cycle as a spiral, one turn per cycle, segments lighting up as they play; amount sets the size.',
  create: () => ({ painters: new Map() }),
  frame(state, ctx, f) {
    const hue = Number(f.params.hue ?? 200);
    const amount = Number(f.params.amount ?? 0.6);
    const c = scratch(state, f.w, f.h);
    const size = Math.min(f.w, f.h) * (0.3 + amount * 0.6);
    const key = `${hue}|${size.toFixed(0)}`;
    let painter = state.painters.get(key);
    if (!painter) {
      // Strudel exposes the spiral only as a pattern method: borrow its painter from an empty pattern
      painter = pure(1)
        .spiral({
          size,
          thickness: size / 24,
          inset: 1.5,
          steady: 0.96,
          activeColor: color(hue, 70),
          inactiveColor: color(hue, 40, 0.7),
          playheadColor: '#fff',
          colorizeInactive: 1,
        })
        .getPainters()[0];
      state.painters.clear();
      state.painters.set(key, painter);
    }
    painter(c, f.time, f.haps, f.drawTime);
    ctx.drawImage(state.canvas, 0, 0);
  },
};

export const pitchwheel = {
  name: 'pitchwheel',
  description: 'Strudel\'s pitchwheel: sounding notes as points on a circle of pitch, with lines to the centre; amount sets line weight.',
  create: () => ({}),
  frame(state, ctx, f) {
    const amount = Number(f.params.amount ?? 0.5);
    const c = scratch(state, f.w, f.h);
    const unit = Math.min(f.w, f.h) / 200;
    drawPitchwheel({
      ctx: c,
      haps: f.active,
      thickness: unit * (1 + amount * 3),
      hapRadius: unit * (3 + amount * 6),
      margin: unit * 12,
      mode: 'flake',
    });
    ctx.drawImage(state.canvas, 0, 0);
  },
};

export const scope = {
  name: 'scope',
  description: 'Oscilloscope of the master output across the full width, like Strudel\'s scope; amount sets the height.',
  create: () => ({}),
  frame(state, ctx, f) {
    const hue = Number(f.params.hue ?? 160);
    const amount = Number(f.params.amount ?? 0.5);
    const { wave, w, h } = f;
    if (!wave.length) return;
    // align on a rising zero crossing so the wave holds still, like Strudel's trigger
    let start = 0;
    for (let i = 1; i < wave.length / 2; i++)
      if (wave[i - 1] <= 0 && wave[i] > 0) {
        start = i;
        break;
      }
    const n = Math.floor(wave.length / 2);
    ctx.save();
    ctx.lineWidth = Math.max(1.5, h / 250);
    ctx.strokeStyle = color(hue, 70);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w;
      const y = h / 2 - wave[start + i] * h * 0.45 * amount * 2;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  },
};

export const spectrum = {
  name: 'spectrum',
  description: 'Scrolling spectrogram of the master output, like Strudel\'s spectrum: time runs left to right, pitch bottom to top; amount sets speed.',
  create: () => ({}),
  frame(state, ctx, f) {
    const hue = Number(f.params.hue ?? 280);
    const amount = Number(f.params.amount ?? 0.5);
    const { fft, w, h } = f;
    if (!state.canvas) {
      state.canvas = document.createElement('canvas');
      state.ctx = state.canvas.getContext('2d');
    }
    if (state.canvas.width !== w || state.canvas.height !== h) {
      state.canvas.width = w;
      state.canvas.height = h;
    }
    const c = state.ctx;
    const speed = Math.max(1, Math.round((w / 300) * (0.5 + amount * 2)));
    c.globalCompositeOperation = 'copy';
    c.drawImage(state.canvas, -speed, 0);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(w - speed, 0, speed, h);
    if (fft.length) {
      const rows = 96;
      const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        // log-spaced bins, low at the bottom
        const bin = Math.min(fft.length - 1, Math.floor(2 ** ((r / rows) * Math.log2(fft.length))));
        const db = Number.isFinite(fft[bin]) ? fft[bin] : -140;
        const v = Math.max(0, Math.min(1, (db + 95) / 70));
        if (v < 0.05) continue;
        c.fillStyle = color((hue + v * 40) % 360, 25 + v * 55, 0.3 + v * 0.7);
        c.fillRect(w - speed, h - (r + 1) * rh, speed, Math.ceil(rh));
      }
    }
    ctx.drawImage(state.canvas, 0, 0);
  },
};

export const strudelVisuals = [punchcard, pianoroll, wordfall, spiral, pitchwheel, scope, spectrum];
