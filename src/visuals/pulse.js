import { noteHue } from './util.js';

export default {
  name: 'pulse',
  create: () => ({ energy: 0, hue: 0 }),
  frame(state, ctx, f) {
    const base = Number(f.params.hue ?? 330);
    const amount = Number(f.params.amount ?? 0.4);
    for (const hap of f.onsets) {
      state.energy = Math.min(1, state.energy + 0.5 * Number(hap.value.gain ?? 1));
      state.hue = noteHue(hap.value, base);
    }
    if (state.energy > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `hsla(${state.hue},90%,55%,${state.energy * amount * 0.6})`;
      ctx.fillRect(0, 0, f.w, f.h);
      ctx.restore();
    }
    state.energy *= Math.exp(-f.dt * 8);
  },
};
