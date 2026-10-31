export default {
  name: 'ribbon',
  create: () => ({ trail: [] }),
  frame(state, ctx, f) {
    const hue = Number(f.params.hue ?? 190);
    const amount = Number(f.params.amount ?? 0.5);
    const { wave, w, h } = f;
    const step = Math.max(1, Math.floor(wave.length / 256));
    const line = [];
    for (let i = 0; i < wave.length; i += step) line.push(wave[i]);
    state.trail.unshift(line);
    state.trail.length = Math.min(state.trail.length, 6 + Math.round(amount * 18));
    ctx.save();
    ctx.lineCap = 'round';
    state.trail.forEach((pts, k) => {
      const alpha = (1 - k / state.trail.length) * 0.9;
      ctx.strokeStyle = `hsla(${(hue + k * 6) % 360},85%,${60 + k}%,${alpha})`;
      ctx.lineWidth = Math.max(1, (h / 240) * (1 - k / state.trail.length));
      ctx.beginPath();
      pts.forEach((v, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h / 2 + v * h * (0.35 + amount * 0.4) + k * (h / 120);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke();
    });
    ctx.restore();
  },
};
