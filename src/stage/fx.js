// Image effects for media layers. Cheap ones use canvas filters; the rest run
// on a low-resolution copy so they stay fast on phones.

const scratch = document.createElement('canvas');
const sctx = scratch.getContext('2d', { willReadFrequently: true });

export function cssFilter(fx, value, h) {
  switch (fx) {
    case 'grayscale':
      return 'grayscale(1)';
    case 'invert':
      return 'invert(1)';
    case 'blur':
      return `blur(${Math.max(2, h / 150)}px)`;
    case 'sepia':
      return 'sepia(1)';
    case 'contrast':
      return 'contrast(2.2) saturate(1.4)';
    case 'hue':
      return `hue-rotate(${Number(value.hue ?? 90)}deg)`;
    default:
      return null;
  }
}

/** Draws `src` cover-fitted into a w×h box, honouring an optional vertical focus 0..1. */
export function drawCover(ctx, src, w, h, focus = 0.5, mirror = false) {
  const sw = src.naturalWidth || src.videoWidth || src.width;
  const sh = src.naturalHeight || src.videoHeight || src.height;
  if (!sw || !sh) return false;
  const s = Math.max(w / sw, h / sh);
  const dw = sw * s;
  const dh = sh * s;
  ctx.save();
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(src, (w - dw) / 2, (h - dh) * Math.max(0, Math.min(1, focus)), dw, dh);
  ctx.restore();
  return true;
}

/** Pixel effects: returns a canvas to draw instead of the source, or null. */
export function pixelFx(fx, src, w, h, focus, mirror) {
  if (!['pixelate', 'posterize', 'edges'].includes(fx)) return null;
  const div = fx === 'pixelate' ? 24 : 4;
  scratch.width = Math.max(8, Math.round(w / div));
  scratch.height = Math.max(8, Math.round(h / div));
  if (!drawCover(sctx, src, scratch.width, scratch.height, focus, mirror)) return null;
  if (fx === 'pixelate') return scratch;
  const img = sctx.getImageData(0, 0, scratch.width, scratch.height);
  const d = img.data;
  if (fx === 'posterize') {
    const levels = 4;
    const step = 255 / (levels - 1);
    for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) d[i + c] = Math.round(d[i + c] / step) * step;
  } else {
    const W = scratch.width;
    const H = scratch.height;
    const lum = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) lum[i] = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2];
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        const gx = lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1] - lum[i - W - 1] - 2 * lum[i - 1] - lum[i + W - 1];
        const gy = lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1] - lum[i - W - 1] - 2 * lum[i - W] - lum[i - W + 1];
        const e = Math.min(255, Math.hypot(gx, gy));
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = e;
        d[i * 4 + 3] = 255;
      }
  }
  sctx.putImageData(img, 0, 0);
  return scratch;
}
