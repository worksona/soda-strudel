import { noteHue } from './util.js';

export default {
  name: 'rings',
  create: () => ({ rings: [] }),
  frame(state, ctx, f) {
    const base = Number(f.params.hue ?? 160);
    const amount = Number(f.params.amount ?? 0.5);
    const max = Math.hypot(f.w, f.h) / 2;
    for (const hap of f.onsets) {
      const note = typeof hap.value.note === 'number' ? hap.value.note : 60;
      state.rings.push({ r: 0, speed: max * (0.3 + (1 - (note % 48) / 48) * 0.6), life: 1, hue: noteHue(hap.value, base) });
    }
    ctx.save();
    for (const ring of state.rings) {
      ring.r += ring.speed * f.dt;
      ring.life -= f.dt * (0.6 - amount * 0.3);
      ctx.strokeStyle = `hsla(${ring.hue},85%,65%,${Math.max(0, ring.life)})`;
      ctx.lineWidth = (f.h / 200) * (0.5 + amount);
      ctx.beginPath();
      ctx.arc(f.w / 2, f.h / 2, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    state.rings = state.rings.filter((r) => r.life > 0 && r.r < max * 1.2);
  },
};
