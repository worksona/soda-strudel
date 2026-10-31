export default {
  name: 'bars',
  create: () => ({ smooth: null }),
  frame(state, ctx, f) {
    const hue = Number(f.params.hue ?? 280);
    const amount = Number(f.params.amount ?? 0.5);
    const count = 24 + Math.round(amount * 40);
    const { fft, w, h } = f;
    state.smooth ??= new Float32Array(128);
    ctx.save();
    const bw = w / count;
    for (let i = 0; i < count; i++) {
      // log-spaced bins so bass doesn't swallow the picture
      const bin = Math.min(fft.length - 1, Math.floor(2 ** ((i / count) * Math.log2(fft.length))));
      const db = Number.isFinite(fft[bin]) ? fft[bin] : -140;
      const v = Math.max(0, (db + 100) / 70);
      state.smooth[i] += (v - state.smooth[i]) * 0.3;
      const bh = state.smooth[i] * h * 0.6;
      ctx.fillStyle = `hsla(${(hue + i * 3) % 360},80%,60%,.85)`;
      ctx.fillRect(i * bw + bw * 0.15, h - bh, bw * 0.7, bh);
    }
    ctx.restore();
  },
};
