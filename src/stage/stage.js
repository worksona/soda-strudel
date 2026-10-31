// The Stage: one compositor canvas that everything visual renders into, so a
// recording of this canvas is the whole piece. Layers, bottom to top:
//
//   1 hydra     Strudel's Hydra canvas (hidden) drawn in
//   2 media     img / vid / cam events (fx, mirror, tint, fade, blend, still)
//   3 visuals   soda visual plugins (src/visuals)
//   4 painters  Strudel's own painters (pianoroll, spiral, punchcard…)
//   5 captions  caption / captions(...) events
//
// Time comes from Strudel's scheduler via update(); the stage never reads
// wall-clock time for musical decisions.
import { ASPECTS, isMediaOnly } from '../soda/catalog.js';
import { getMedia } from '../soda/mediaRegistry.js';
import { plugins } from '../visuals/index.js';
import { readMaster } from '../media/master.js';
import { cameraVideo, cameraOn, tickCamera } from '../media/camera.js';
import { cssFilter, drawCover, pixelFx } from './fx.js';

const BLEND = {
  normal: 'source-over',
  screen: 'screen',
  multiply: 'multiply',
  overlay: 'overlay',
  lighter: 'lighter',
  difference: 'difference',
  'soft-light': 'soft-light',
};

// values can hold BigInts / Fractions (e.g. from mini-notation), so stringify defensively
const safe = (_, x) => (typeof x === 'bigint' ? `${x}n` : x);
const hapKey = (h) => `${h.whole?.begin?.valueOf()}|${JSON.stringify(h.value, safe)}`;
const isActive = (h, t) => (h.isActive ? h.isActive(t) : h.whole.begin <= t && t < h.whole.end);

export class Stage {
  constructor(el) {
    this.el = el;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'stage-canvas';
    el.append(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.layer = document.createElement('canvas');
    this.lctx = this.layer.getContext('2d');
    this.paint = document.createElement('canvas');
    this.paintCtx = this.paint.getContext('2d', { willReadFrequently: true });
    this.aspect = 'free';
    this.exportShort = null;
    this.haps = [];
    this.time = 0;
    this.painters = [];
    this.drawTime = [0, 0];
    this.playing = false;
    this.instances = new Map();
    this.prevKeys = new Set();
    this.images = new Map();
    this.videos = new Map();
    this.stills = new Map();
    this.last = performance.now();
    this.frameListeners = new Set();
    new ResizeObserver(() => this.resize()).observe(el);
    this.resize();
    requestAnimationFrame(this.loop);
  }

  /** The canvas Strudel painters draw into (passed to StrudelMirror as drawContext). */
  get painterContext() {
    return this.paintCtx;
  }

  setAspect(aspect) {
    this.aspect = ASPECTS[aspect] === undefined ? 'free' : aspect;
    this.el.dataset.aspect = this.aspect;
    this.resize();
  }

  /** Render at export resolution (`short` px on the short side) – call with false to restore. */
  setExportMode(on, short = 1080) {
    this.exportShort = on ? short : null;
    this.resize();
  }

  resize() {
    const box = this.el.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const preset = ASPECTS[this.aspect];
    let w, h, cssW, cssH;
    if (!preset) {
      [cssW, cssH] = [box.width, box.height];
      const scale = this.exportShort ? this.exportShort / Math.min(cssW, cssH) : dpr;
      [w, h] = [cssW * scale, cssH * scale];
    } else {
      const [pw, ph] = preset;
      const fit = Math.min(box.width / pw, box.height / ph);
      [cssW, cssH] = [pw * fit, ph * fit];
      const scale = this.exportShort ? this.exportShort / Math.min(pw, ph) : Math.min(1, (cssW * dpr) / pw);
      [w, h] = [pw * scale, ph * scale];
    }
    // encoders want even dimensions
    [w, h] = [Math.round(w / 2) * 2, Math.round(h / 2) * 2];
    for (const c of [this.canvas, this.layer, this.paint]) {
      c.width = Math.round(w);
      c.height = Math.round(h);
    }
    this.bg = getComputedStyle(this.el).getPropertyValue('--stage-bg').trim() || '#000';
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
  }

  /** Fed by StrudelMirror's drawer every animation frame while playing. */
  update(haps, time, painters, drawTime) {
    this.haps = haps;
    this.time = time;
    this.painters = painters ?? [];
    if (drawTime) this.drawTime = drawTime;
  }

  setPlaying(playing) {
    this.playing = playing;
    if (!playing) {
      this.haps = [];
      this.videos.forEach((v) => v.pause());
    }
  }

  onFrame(fn) {
    this.frameListeners.add(fn);
    return () => this.frameListeners.delete(fn);
  }

  loop = (now) => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    tickCamera();
    try {
      this.render(dt);
    } catch (e) {
      console.warn('[stage]', e);
    }
    this.frameListeners.forEach((fn) => fn(dt));
  };

  render(dt) {
    const { ctx } = this;
    const { width: w, height: h } = this.canvas;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.fillStyle = this.bg ?? '#000';
    ctx.fillRect(0, 0, w, h);

    const hydra = document.getElementById('hydra-canvas');
    if (hydra?.width) drawCover(ctx, hydra, w, h);

    const t = this.time;
    // the drawer can return several fragments of one event – keep one per event
    const unique = new Map();
    if (this.playing) for (const hap of this.haps) if (isActive(hap, t)) unique.set(hapKey(hap), hap);
    const active = [...unique.values()];
    const media = [];
    const visuals = [];
    const captions = [];
    const audible = [];
    for (const hap of active) {
      const v = hap.value;
      if (!v || typeof v !== 'object') continue;
      if (v.img !== undefined || v.vid !== undefined || v.cam !== undefined) media.push(hap);
      if (v.visual !== undefined) visuals.push(hap);
      if (v.caption !== undefined) captions.push(hap);
      if (!isMediaOnly(v)) audible.push(hap);
    }
    const keys = new Set(audible.map(hapKey));
    const onsets = audible.filter((hap) => !this.prevKeys.has(hapKey(hap)));
    this.prevKeys = keys;

    for (const hap of media) this.drawMedia(hap, t, w, h);

    const { fft, wave, level } = readMaster();
    const seen = new Set();
    for (const hap of visuals) {
      const name = String(hap.value.visual);
      const plugin = plugins[name];
      if (!plugin || seen.has(name)) continue;
      seen.add(name);
      let inst = this.instances.get(name);
      if (!inst) this.instances.set(name, (inst = { state: plugin.create() }));
      ctx.save();
      ctx.globalAlpha = this.envelope(hap, t) * Number(hap.value.opacity ?? 1);
      ctx.globalCompositeOperation = BLEND[hap.value.blend] ?? 'source-over';
      plugin.frame(inst.state, ctx, { w, h, dt, time: t, cycle: t, params: hap.value, active: audible, onsets, fft, wave, level });
      ctx.restore();
    }
    for (const name of this.instances.keys()) if (!seen.has(name)) this.instances.delete(name);

    if (this.playing && this.painters.length) {
      this.paintCtx.clearRect(0, 0, w, h);
      for (const painter of this.painters) {
        try {
          painter(this.paintCtx, t, this.haps, this.drawTime);
        } catch (e) {
          console.warn('[painter]', e);
        }
      }
      ctx.drawImage(this.paint, 0, 0);
    }

    captions.forEach((hap, i) => this.drawCaption(hap, t, w, h, captions.length - 1 - i));
  }

  envelope(hap, t) {
    const fade = Number(hap.value.fade ?? 0);
    if (!fade || !hap.whole) return 1;
    const begin = hap.whole.begin.valueOf();
    const end = hap.whole.end.valueOf();
    const span = (end - begin) * Math.min(0.5, fade);
    return Math.max(0, Math.min(1, (t - begin) / span, (end - t) / span));
  }

  source(v) {
    if (v.cam !== undefined) return cameraOn() ? { el: cameraVideo(), key: 'cam' } : null;
    if (v.img !== undefined) {
      const name = String(v.img);
      const url = getMedia(name)?.url ?? (/^(https?:|blob:|data:|\/)/.test(name) ? name : null);
      if (!url) return { missing: name };
      let img = this.images.get(url);
      if (!img) {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        this.images.set(url, img);
      }
      return img.complete && img.naturalWidth ? { el: img, key: url } : null;
    }
    const name = String(v.vid);
    const url = getMedia(name)?.url ?? (/^(https?:|blob:|data:|\/)/.test(name) ? name : null);
    if (!url) return { missing: name };
    let vid = this.videos.get(url);
    if (!vid) {
      vid = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, crossOrigin: 'anonymous', src: url });
      this.videos.set(url, vid);
    }
    if (vid.paused) vid.play().catch(() => {});
    if (v.speed !== undefined) vid.playbackRate = Math.max(0.1, Math.min(4, Number(v.speed)));
    return vid.readyState >= 2 ? { el: vid, key: url } : null;
  }

  drawMedia(hap, t, w, h) {
    const v = hap.value;
    const src = this.source(v);
    if (!src) return;
    const { ctx, lctx, layer } = this;
    lctx.globalCompositeOperation = 'source-over';
    lctx.filter = 'none';
    lctx.clearRect(0, 0, w, h);
    if (src.missing) {
      lctx.fillStyle = 'rgba(255,255,255,.06)';
      lctx.fillRect(0, 0, w, h);
      lctx.fillStyle = 'rgba(255,255,255,.4)';
      lctx.font = `${Math.round(h / 40)}px ui-monospace, monospace`;
      lctx.fillText(`missing media: ${src.missing}`, h / 40, h - h / 40);
    } else {
      let el = src.el;
      if (v.still) {
        let snap = this.stills.get(src.key);
        if (!snap) {
          snap = document.createElement('canvas');
          snap.width = w;
          snap.height = h;
          drawCover(snap.getContext('2d'), el, w, h, Number(v.pos ?? 0.5));
          this.stills.set(src.key, snap);
        }
        el = snap;
      } else this.stills.delete(src.key);
      const mirror = !!v.mirror && el === src.el;
      const pix = pixelFx(v.fx, el, w, h, Number(v.pos ?? 0.5), mirror);
      if (pix) {
        lctx.imageSmoothingEnabled = v.fx !== 'pixelate';
        lctx.drawImage(pix, 0, 0, w, h);
        lctx.imageSmoothingEnabled = true;
      } else {
        const filter = cssFilter(v.fx, v, h);
        if (filter) lctx.filter = filter;
        drawCover(lctx, el, w, h, Number(v.pos ?? 0.5), mirror);
        lctx.filter = 'none';
      }
      if (v.tint) {
        lctx.globalCompositeOperation = 'source-atop';
        lctx.globalAlpha = 0.45;
        lctx.fillStyle = String(v.tint);
        lctx.fillRect(0, 0, w, h);
        lctx.globalAlpha = 1;
      }
    }
    ctx.save();
    ctx.globalAlpha = this.envelope(hap, t) * Number(v.opacity ?? 1);
    ctx.globalCompositeOperation = BLEND[v.blend] ?? 'source-over';
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  drawCaption(hap, t, w, h, row) {
    const { ctx } = this;
    const text = String(hap.value.caption);
    const size = Math.round(Math.min(w, h) / 14);
    const alpha = Math.min(1, this.envelope({ ...hap, value: { fade: hap.value.fade ?? 0.15 } }, t)) * Number(hap.value.opacity ?? 1);
    const begin = hap.whole?.begin.valueOf() ?? t;
    const rise = Math.max(0, 1 - (t - begin) * 4) * size * 0.4;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,.6)';
    ctx.shadowBlur = size / 3;
    ctx.fillStyle = hap.value.tint ? String(hap.value.tint) : '#fff';
    const lines = wrap(ctx, text, w * 0.84);
    const lineH = size * 1.15;
    // keep clear of the bottom ~18% where social apps put their UI
    const baseY = h * 0.8 - row * lineH * (lines.length + 0.3) + rise;
    lines.forEach((line, i) => ctx.fillText(line, w / 2, baseY - (lines.length - 1 - i) * lineH));
    ctx.restore();
  }
}

function wrap(ctx, text, max) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
