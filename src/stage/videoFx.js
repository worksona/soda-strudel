// Video effectors for media layers, after Pixel Flow's image nodes
// (pixel-flow.atomic47.co). Each one reads the layer as drawn so far (`src`, a
// copy) and redraws it transformed into `ctx` (the layer, already cleared).
// `.amount()` 0..1 is the one knob, `.hue()` a direction for the few that have
// one, and time comes from the scheduler so everything moves with the music.
//
// Budget: drawImage-based effects run at full resolution; anything that reads
// pixels works on a reduced copy (1/2 or 1/3) and is scaled back up. Sizes are
// fractions of the canvas height so a 1080p export looks like the editor.
import { VIDEO_FX } from '../soda/catalog.js';

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const lerp = (a, b, f) => a + (b - a) * f;
/** Deterministic 0..1 hash – the same k gives the same value every frame. */
const rnd = (k) => {
  const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const scratch = document.createElement('canvas');
const sctx = scratch.getContext('2d', { willReadFrequently: true });
const aux = document.createElement('canvas');
const actx = aux.getContext('2d');

/** `src` reduced by `div`, as ImageData on the shared scratch canvas. */
function reduced(src, w, h, div) {
  scratch.width = Math.max(8, Math.round(w / div));
  scratch.height = Math.max(8, Math.round(h / div));
  sctx.imageSmoothingEnabled = true;
  sctx.drawImage(src, 0, 0, scratch.width, scratch.height);
  return sctx.getImageData(0, 0, scratch.width, scratch.height);
}
/** Puts processed ImageData back and draws it full size into ctx. */
function blowUp(ctx, img, w, h, smooth = true) {
  sctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = smooth;
  ctx.drawImage(scratch, 0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
}
/** A canvas the size of the layer, kept in the per-layer state under `name`. */
function buffer(state, name, w, h) {
  let c = state[name];
  if (!c) c = state[name] = document.createElement('canvas');
  const fresh = c.width !== w || c.height !== h;
  if (fresh) {
    c.width = w;
    c.height = h;
  }
  return { canvas: c, ctx: c.getContext('2d'), fresh };
}

// Every effect: (ctx, src, w, h, p) with p = { amount, hue, t, dt, state }.
// `t` is scheduler time in cycles, `dt` seconds since the last frame.
export const videoFx = {
  kaleido(ctx, src, w, h, p) {
    const seg = 2 + Math.round(p.amount * 8);
    p.state.spin = (p.state.spin ?? 0) + p.dt * 0.25;
    const ang = (Math.PI * 2) / seg;
    const R = Math.hypot(w, h);
    for (let i = 0; i < seg; i++) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(i * ang + p.state.spin);
      if (i % 2) ctx.scale(1, -1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(R * Math.cos(-ang / 2), R * Math.sin(-ang / 2));
      ctx.lineTo(R * Math.cos(ang / 2), R * Math.sin(ang / 2));
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(src, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  },

  symmetry(ctx, src, w, h, p) {
    const sh = (p.amount - 0.5) * w * 0.5;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.drawImage(src, 0, 0, w / 2, h, -w / 2 + sh, -h / 2, w / 2, h);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0, w / 2, h, -w / 2 - sh, -h / 2, w / 2, h);
    ctx.restore();
  },

  mosaic(ctx, src, w, h, p) {
    const cols = 3 + Math.round(p.amount * 10);
    const rows = Math.max(2, Math.round((cols * h) / w));
    const off = p.amount * (h / 12);
    const jit = p.amount * (h / 30);
    const cw = w / cols;
    const rh = h / rows;
    const tt = p.t * 2;
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const k = x + y * cols;
        const ox = Math.sin(tt + k) * off * 0.4 + (rnd(k) - 0.5) * jit;
        const oy = Math.cos(tt * 0.8 + k) * off * 0.3 + (rnd(k + 7) - 0.5) * jit;
        ctx.drawImage(src, x * cw, y * rh, cw, rh, x * cw + ox, y * rh + oy, cw, rh);
      }
  },

  slice(ctx, src, w, h, p) {
    const cnt = 12;
    const sh = p.amount * (h / 6);
    const bw = w / cnt;
    const tt = p.t * 2;
    for (let i = 0; i < cnt; i++) {
      const dy = Math.sin(tt + i * 1.7) * sh;
      ctx.drawImage(src, i * bw, 0, bw, h, i * bw, dy, bw, h);
    }
  },

  wave(ctx, src, w, h, p) {
    const amp = p.amount * (w / 12);
    const step = Math.max(1, Math.round(h / 360));
    const fr = 18 / h;
    const sp = p.t * 3;
    for (let y = 0; y < h; y += step) {
      const dx = Math.sin(y * fr + sp) * amp;
      ctx.drawImage(src, 0, y, w, step, dx, y, w, step);
    }
  },

  twist(ctx, src, w, h, p) {
    const rings = 20;
    const tw = (p.amount - 0.5) * 5;
    const R = Math.hypot(w / 2, h / 2);
    ctx.drawImage(src, 0, 0);
    for (let i = rings; i > 0; i--) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, (R * i) / rings, 0, 7);
      ctx.clip();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(tw * (1 - i / rings));
      ctx.drawImage(src, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  },

  ripple(ctx, src, w, h, p) {
    const rings = 20;
    const amt = p.amount * 30;
    const R = Math.hypot(w / 2, h / 2);
    const fr = 20 / R;
    const sp = p.t * 4;
    for (let i = rings; i > 0; i--) {
      const r0 = (R * i) / rings;
      const s = 1 + (Math.sin(r0 * fr - sp) * amt) / 200;
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r0, 0, 7);
      ctx.clip();
      ctx.translate(w / 2, h / 2);
      ctx.scale(s, s);
      ctx.drawImage(src, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  },

  melt(ctx, src, w, h, p) {
    const div = 4;
    scratch.width = Math.max(8, Math.round(w / div));
    scratch.height = 1;
    sctx.drawImage(src, 0, Math.round(h * 0.3), w, 1, 0, 0, scratch.width, 1);
    const row = sctx.getImageData(0, 0, scratch.width, 1).data;
    const amt = p.amount * (h / 5);
    const tt = p.t * 2.4;
    const col = Math.max(2, Math.round(w / 240));
    ctx.drawImage(src, 0, 0);
    for (let x = 0; x < w; x += col) {
      const o = Math.min(scratch.width - 1, Math.floor(x / div)) * 4;
      const b = (row[o] + row[o + 1] + row[o + 2]) / 765;
      const dy = (1 - b) * amt * (0.6 + 0.4 * Math.sin(tt + x * (18 / w)));
      ctx.drawImage(src, x, 0, col, h, x, dy, col, h);
    }
  },

  smear(ctx, src, w, h, p) {
    const amt = p.amount * (w / 8);
    const an = ((p.hue ?? 35) * Math.PI) / 180;
    ctx.drawImage(src, 0, 0);
    ctx.globalAlpha = 0.2;
    for (let i = 1; i <= 8; i++) ctx.drawImage(src, (Math.cos(an) * amt * i) / 8, (Math.sin(an) * amt * i) / 8, w, h);
    ctx.globalAlpha = 1;
  },

  rgbshift(ctx, src, w, h, p) {
    const a = p.amount * (w / 40);
    const an = ((p.hue ?? 0) * Math.PI) / 180;
    const dx = Math.cos(an) * a;
    const dy = Math.sin(an) * a;
    aux.width = w;
    aux.height = h;
    ctx.globalCompositeOperation = 'lighter';
    for (const [color, ox, oy] of [
      ['#f00', -dx, -dy],
      ['#0f0', 0, 0],
      ['#00f', dx, dy],
    ]) {
      actx.globalCompositeOperation = 'source-over';
      actx.fillStyle = color;
      actx.fillRect(0, 0, w, h);
      actx.globalCompositeOperation = 'multiply';
      actx.drawImage(src, ox, oy, w, h);
      ctx.drawImage(aux, 0, 0);
    }
    ctx.globalCompositeOperation = 'source-over';
  },

  glitch(ctx, src, w, h, p) {
    const amt = p.amount * (w / 15);
    const nb = 8;
    const fr = Math.floor(p.t * 8); // changes every eighth of a cycle
    ctx.drawImage(src, 0, 0);
    for (let i = 0; i < nb; i++) {
      const k = i * 3 + fr * 7;
      const gw = w * (0.08 + rnd(k) * 0.3);
      const gh = h * (0.03 + rnd(k + 1) * 0.12);
      const gx = rnd(k + 2) * (w - gw);
      const gy = rnd(k + 3) * (h - gh);
      const dx = (rnd(k + 4) - 0.5) * amt * 2;
      const dy = (rnd(k + 5) - 0.5) * amt * 0.5;
      ctx.drawImage(src, gx, gy, gw, gh, gx + dx, gy + dy, gw, gh);
      if (rnd(k + 6) > 0.7) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.3;
        ctx.drawImage(src, gx, gy, gw, gh, gx + dx * 1.6, gy + dy, gw, gh);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  },

  vhs(ctx, src, w, h, p) {
    const amt = p.amount * (w / 60);
    const fr = Math.floor(p.t * 24);
    const step = Math.max(2, Math.round(h / 300));
    for (let y = 0; y < h; y += step) {
      let dx = (rnd(y * 7 + fr) - 0.5) * amt;
      if (rnd(y * 3 + fr + 99) > 0.985) dx *= 6;
      ctx.drawImage(src, 0, y, w, step, dx, y, w, step);
    }
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.14;
    const c = w / 400;
    ctx.drawImage(src, 2.5 * c, 0, w, h);
    ctx.drawImage(src, -2.5 * c, c, w, h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 10; i++) {
      const k = i + fr * 13;
      if (rnd(k) > 0.6) ctx.fillRect(rnd(k + 1) * w, rnd(k + 2) * h, (2 + rnd(k + 3) * 12) * c, Math.max(1, c));
    }
    ctx.globalCompositeOperation = 'source-over';
  },

  sort(ctx, src, w, h, p) {
    const th = clamp(1 - p.amount, 0.02, 0.98);
    const img = reduced(src, w, h, 3);
    const { data: d, width: W, height: H } = img;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      let x = 0;
      while (x < W) {
        const o = (row + x) * 4;
        if ((d[o] + d[o + 1] + d[o + 2]) / 765 > th) {
          const s = x;
          while (x < W) {
            const o2 = (row + x) * 4;
            if ((d[o2] + d[o2 + 1] + d[o2 + 2]) / 765 <= th) break;
            x++;
          }
          if (x - s > 2) {
            const seg = [];
            for (let i = s; i < x; i++) {
              const q = (row + i) * 4;
              seg.push([d[q], d[q + 1], d[q + 2]]);
            }
            seg.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
            for (let i = s; i < x; i++) {
              const q = (row + i) * 4;
              [d[q], d[q + 1], d[q + 2]] = seg[i - s];
            }
          }
        } else x++;
      }
    }
    blowUp(ctx, img, w, h);
  },

  dither(ctx, src, w, h, p) {
    const lv = 2 + Math.round(p.amount * 4);
    const img = reduced(src, w, h, 3);
    const { data: d, width: W, height: H } = img;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const thr = (BAYER4[(x & 3) + ((y & 3) << 2)] + 0.5) / 16 - 0.5;
        for (let c = 0; c < 3; c++) d[i + c] = (clamp(Math.round((d[i + c] / 255) * (lv - 1) + thr), 0, lv - 1) / (lv - 1)) * 255;
      }
    blowUp(ctx, img, w, h, false);
  },

  halftone(ctx, src, w, h, p) {
    const stp = Math.max(3, (h / 110) * (0.5 + p.amount * 1.5));
    const img = reduced(src, w, h, stp);
    const { data: d, width: W, height: H } = img;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const br = (d[i] + d[i + 1] + d[i + 2]) / 765;
        const rr = Math.min(stp * 0.48, br * stp * 0.55);
        if (rr < 0.4) continue;
        ctx.fillStyle = `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`;
        ctx.beginPath();
        ctx.arc((x + 0.5) * stp, (y + 0.5) * stp, rr, 0, 7);
        ctx.fill();
      }
  },

  ascii(ctx, src, w, h, p) {
    const CH = ' .:-=+*#%@';
    const sz = Math.max(6, (h / 60) * (0.5 + p.amount * 1.5));
    const img = reduced(src, w, h, sz);
    const { data: d, width: W, height: H } = img;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.font = `${sz}px ui-monospace, monospace`;
    ctx.textBaseline = 'top';
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const br = (d[i] + d[i + 1] + d[i + 2]) / 765;
        const ch = CH[Math.min(9, Math.floor(br * 9.99))];
        if (ch === ' ') continue;
        ctx.fillStyle = `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`;
        ctx.fillText(ch, x * sz, y * sz);
      }
  },

  scanlines(ctx, src, w, h, p) {
    const sp = Math.max(3, Math.round(h / 90));
    const amt = p.amount * (w / 50);
    const tt = p.t * 6;
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'screen';
    for (let y = 0; y < h; y += sp) {
      const a = Math.sin(tt + y * (30 / h)) * amt * 0.5;
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fillRect(a, y, w, 1);
      ctx.drawImage(src, 0, y, w, 2, a * 1.8, y, w, 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  },

  solarize(ctx, src, w, h, p) {
    const th = p.amount;
    const img = reduced(src, w, h, 2);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4)
      if ((d[i] + d[i + 1] + d[i + 2]) / 765 > th) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
    blowUp(ctx, img, w, h);
  },

  threshold(ctx, src, w, h, p) {
    const th = p.amount;
    const img = reduced(src, w, h, 2);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (d[i] + d[i + 1] + d[i + 2]) / 765 > th ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    blowUp(ctx, img, w, h);
  },

  timeslice(ctx, src, w, h, p) {
    const N = 16;
    const rw = Math.round(w / 2);
    const rh = Math.round(h / 2);
    const st = p.state;
    if (!st.ring || st.ring[0].width !== rw) {
      st.ring = Array.from({ length: N }, () => Object.assign(document.createElement('canvas'), { width: rw, height: rh }));
      st.head = 0;
    }
    st.head = (st.head + 1) % N;
    st.ring[st.head].getContext('2d').drawImage(src, 0, 0, rw, rh);
    const cnt = 12;
    const depth = Math.max(1, Math.round(p.amount * (N - 1)));
    const portrait = h > w;
    for (let i = 0; i < cnt; i++) {
      const back = Math.round((i / cnt) * depth);
      const frame = st.ring[(st.head - back + N * 4) % N];
      if (portrait) {
        const sh = h / cnt;
        ctx.drawImage(frame, 0, (i * sh) / 2, rw, sh / 2, 0, i * sh, w, sh);
      } else {
        const sw = w / cnt;
        ctx.drawImage(frame, (i * sw) / 2, 0, sw / 2, rh, i * sw, 0, sw, h);
      }
    }
  },

  feedback(ctx, src, w, h, p) {
    const { canvas: prev, ctx: pctx, fresh } = buffer(p.state, 'prev', w, h);
    const zoom = 1 + p.amount * 0.05;
    const rot = (p.amount * 2.5 * Math.PI) / 180;
    if (!fresh) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rot);
      ctx.scale(zoom, zoom);
      ctx.drawImage(prev, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    // the new frame over the trail, not added to it – adding saturates to white within a second
    ctx.globalAlpha = 0.6;
    ctx.drawImage(src, 0, 0);
    ctx.globalAlpha = 1;
    pctx.clearRect(0, 0, w, h);
    pctx.drawImage(ctx.canvas, 0, 0);
  },
};

// every catalogued effector has an implementation, and vice versa
for (const name of Object.keys(VIDEO_FX)) if (!videoFx[name]) throw new Error(`video fx "${name}" has no implementation`);

const copy = document.createElement('canvas');
const cctx = copy.getContext('2d');

/**
 * Runs a chain of effectors on `layer` in place. `states` is a Map the caller
 * keeps per media layer (ring buffers, feedback frames, spin phases); `key`
 * identifies the layer. Returns the state keys it used.
 */
export function applyVideoFx(names, layer, lctx, w, h, params, states, key, used) {
  for (const name of names) {
    const fx = videoFx[name];
    if (!fx) continue;
    if (copy.width !== w || copy.height !== h) {
      copy.width = w;
      copy.height = h;
    } else cctx.clearRect(0, 0, w, h);
    cctx.drawImage(layer, 0, 0);
    const sk = `${key}:${name}`;
    let state = states.get(sk);
    if (!state) states.set(sk, (state = {}));
    used?.add(sk);
    lctx.save();
    lctx.globalCompositeOperation = 'source-over';
    lctx.globalAlpha = 1;
    lctx.filter = 'none';
    lctx.clearRect(0, 0, w, h);
    try {
      fx(lctx, copy, w, h, { ...params, state });
    } catch (e) {
      console.warn(`[fx ${name}]`, e);
      lctx.drawImage(copy, 0, 0);
    }
    lctx.restore();
  }
}
