import { noteHue } from './util.js';

export default {
  name: 'particles',
  create: () => ({ ps: [] }),
  frame(state, ctx, f) {
    const base = Number(f.params.hue ?? 200);
    const amount = Number(f.params.amount ?? 0.6);
    for (const hap of f.onsets) {
      const v = hap.value;
      const gain = Number(v.gain ?? 1);
      const hue = noteHue(v, base);
      const cx = f.w * (0.2 + 0.6 * Math.random());
      const cy = f.h * (0.25 + 0.5 * Math.random());
      const count = Math.round(12 + 50 * amount * gain);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (0.05 + Math.random() * 0.25) * Math.min(f.w, f.h);
        state.ps.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, hue, r: (2 + Math.random() * 5) * (f.h / 900) });
      }
    }
    if (state.ps.length > 3000) state.ps.splice(0, state.ps.length - 3000);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of state.ps) {
      p.x += p.vx * f.dt;
      p.y += p.vy * f.dt;
      p.vx *= 0.97;
      p.vy = p.vy * 0.97 + 20 * f.dt;
      p.life -= f.dt * 0.8;
      ctx.fillStyle = `hsla(${p.hue},90%,65%,${Math.max(0, p.life)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    state.ps = state.ps.filter((p) => p.life > 0);
  },
};
