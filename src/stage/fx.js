// Image effects for media layers. Cheap ones use canvas filters; the rest run
// on a low-resolution copy so they stay fast on phones. Besides .fx("…") the
// stage reads Strudel's audio effects as picture effects (see pictureFx.js).

const scratch = document.createElement('canvas');
const sctx = scratch.getContext('2d', { willReadFrequently: true });
const edgeCanvas = document.createElement('canvas');
const ectx = edgeCanvas.getContext('2d', { willReadFrequently: true });

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

/**
 * Draws `src` cover-fitted into a w×h box. `focus` 0..1 picks the vertical
 * crop, `pan` 0..1 the horizontal one (0.5 = centred).
 */
export function drawCover(ctx, src, w, h, focus = 0.5, mirror = false, pan = 0.5) {
  const sw = src.naturalWidth || src.videoWidth || src.width;
  const sh = src.naturalHeight || src.videoHeight || src.height;
  if (!sw || !sh) return false;
  const s = Math.max(w / sw, h / sh);
  const dw = sw * s;
  const dh = sh * s;
  const p = Math.max(0, Math.min(1, pan));
  // slide within the overflow; when there is none, nudge up to 15% of the width
  const dx = dw > w + 1 ? (w - dw) * p : (w - dw) / 2 + (p - 0.5) * w * 0.3;
  ctx.save();
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(src, dx, (h - dh) * Math.max(0, Math.min(1, focus)), dw, dh);
  ctx.restore();
  return true;
}

const posterize = (d, levels) => {
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) d[i + c] = Math.round(d[i + c] / step) * step;
};

const sobel = (d, W, H) => {
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
};

/**
 * Pixel effects: returns a low-resolution canvas to draw instead of the
 * source, or null when none apply. `opts`: { fx, levels, pixel, pan }
 * – fx is the .fx() name, levels/pixel come from .crush()/.coarse().
 */
export function pixelFx(opts, src, w, h, focus, mirror) {
  const { fx, levels, pixel, pan } = opts;
  const pixelate = fx === 'pixelate' ? 24 : pixel;
  const post = fx === 'posterize' ? 4 : levels;
  const edges = fx === 'edges';
  if (!pixelate && !post && !edges) return null;
  const div = pixelate || 4;
  scratch.width = Math.max(8, Math.round(w / div));
  scratch.height = Math.max(8, Math.round(h / div));
  if (!drawCover(sctx, src, scratch.width, scratch.height, focus, mirror, pan)) return null;
  if (!post && !edges) return scratch;
  const img = sctx.getImageData(0, 0, scratch.width, scratch.height);
  if (edges) sobel(img.data, scratch.width, scratch.height);
  else posterize(img.data, post);
  sctx.putImageData(img, 0, 0);
  return scratch;
}

/** An outline (edge) rendering of `src` at low resolution, for .hpf() on pictures. */
export function edgesOf(src, w, h, focus, mirror, pan) {
  edgeCanvas.width = Math.max(8, Math.round(w / 4));
  edgeCanvas.height = Math.max(8, Math.round(h / 4));
  if (!drawCover(ectx, src, edgeCanvas.width, edgeCanvas.height, focus, mirror, pan)) return null;
  const img = ectx.getImageData(0, 0, edgeCanvas.width, edgeCanvas.height);
  sobel(img.data, edgeCanvas.width, edgeCanvas.height);
  ectx.putImageData(img, 0, 0);
  return edgeCanvas;
}
