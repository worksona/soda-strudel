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
import { ASPECTS, frameFor, fxChain, isMediaOnly } from '../soda/catalog.js';
import { getMedia } from '../soda/mediaRegistry.js';
import { plugins } from '../visuals/index.js';
import { readMaster } from '../media/master.js';
import { cameraVideo, cameraOn, tickCamera } from '../media/camera.js';
import { cssFilter, drawCover, edgesOf, pixelFx } from './fx.js';
import { pictureFilter, pictureFx } from './pictureFx.js';
import { applyVideoFx, videoFx } from './videoFx.js';

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
    // Strudel's .pianoroll(), .scope(), .fscope(), .spectrum() and .pitchwheel()
    // paint into a global canvas, #test-canvas (getDrawContext()), with their own
    // animation loops. Provide that canvas ourselves – hidden, the stage's size –
    // and composite it like the other painters, so they show and are exported.
    this.drawCanvas = document.getElementById('test-canvas') ?? document.createElement('canvas');
    this.drawCanvas.id = 'test-canvas';
    this.drawCanvas.style.display = 'none';
    if (!this.drawCanvas.isConnected) el.append(this.drawCanvas);
    this.aspect = 'free'; // the sketch's export frame – on screen the stage always fills its box
    this.guide = false; // outline the export frame over the free stage
    this.overlay = null; // (ctx, w, h) => … drawn over export frames only – the code layer
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
    this.trails = new Map(); // echo buffers per media source (.delay() on pictures)
    this.fxStates = new Map(); // video effector state per media source and effect (ring buffers, feedback)
    this.last = performance.now();
    this.frameListeners = new Set();
    new ResizeObserver(() => this.resize()).observe(el);
    this.resize();
    requestAnimationFrame(this.loop);
  }

  /**
   * Strudel's draw loops share #test-canvas and some leave state behind (spectrum
   * leaves globalAlpha at 0, so the next .fscope() draws invisibly). Called
   * before every evaluation.
   */
  resetDrawState() {
    const ctx = this.drawCanvas.getContext('2d', { willReadFrequently: true });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
  }

  /** The canvas Strudel painters draw into (passed to StrudelMirror as drawContext). */
  get painterContext() {
    return this.paintCtx;
  }

  /** The sketch's export frame ('free' follows the device). Changes the canvas only while exporting. */
  setAspect(aspect) {
    this.aspect = ASPECTS[aspect] === undefined ? 'free' : aspect;
    this.el.dataset.aspect = this.aspect;
    this.resize();
  }

  /** The frame an export would use right now: the sketch's, or the device's shape for 'free'. */
  get frame() {
    // the device's orientation, not the stage box (a side panel narrows the box)
    return frameFor(this.aspect, window.innerHeight > window.innerWidth);
  }

  /** Show / hide the crop guide: a thin outline of the export frame, dimming what it would cut. */
  setGuide(on) {
    this.guide = !!on;
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
    // on screen: fill the box; while exporting: the export frame at export resolution
    const preset = this.exportShort ? ASPECTS[this.frame] : null;
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
    for (const c of [this.canvas, this.layer, this.paint, this.drawCanvas]) {
      c.width = Math.round(w);
      c.height = Math.round(h);
    }
    this.trails.clear();
    this.fxStates.clear();
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
      this.trails.clear();
      this.fxStates.clear();
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

    const used = new Set();
    for (const hap of media) this.drawMedia(hap, t, w, h, dt, used);
    for (const key of this.trails.keys()) if (!used.has(key)) this.trails.delete(key);
    for (const key of this.fxStates.keys()) if (!used.has(key)) this.fxStates.delete(key);

    const { fft, wave, level } = readMaster();
    const seen = new Set();
    // Strudel's painters want the drawer's whole window (before and after now), minus picture events
    const window = visuals.length && this.playing ? this.haps.filter((hap) => hap.whole && !isMediaOnly(hap.value)) : [];
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
      plugin.frame(inst.state, ctx, { w, h, dt, time: t, cycle: t, params: hap.value, active: audible, onsets, haps: window, drawTime: this.drawTime, fft, wave, level });
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
    // Strudel's own draw loops (pianoroll, scope, spectrum…) – see the constructor
    if (this.playing) ctx.drawImage(this.drawCanvas, 0, 0);

    captions.forEach((hap, i) => this.drawCaption(hap, t, w, h, captions.length - 1 - i));

    if (this.guide && !this.exportShort) this.drawGuide(w, h);
    // exports show what the screen shows: the code too, when it is over the stage
    if (this.exportShort && this.overlay) {
      try {
        this.overlay(ctx, w, h);
      } catch (e) {
        console.warn('[overlay]', e);
      }
    }
  }

  /** Outline of the export frame, cover-fitted and centred; never drawn into an export. */
  drawGuide(w, h) {
    const preset = ASPECTS[this.frame];
    if (!preset) return;
    const [pw, ph] = preset;
    const fit = Math.min(w / pw, h / ph);
    const fw = Math.round(pw * fit);
    const fh = Math.round(ph * fit);
    if (Math.abs(fw - w) < 2 && Math.abs(fh - h) < 2) return; // the screen already has that shape
    const x = Math.round((w - fw) / 2);
    const y = Math.round((h - fh) / 2);
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    if (x > 0) {
      ctx.fillRect(0, 0, x, h);
      ctx.fillRect(x + fw, 0, w - x - fw, h);
    }
    if (y > 0) {
      ctx.fillRect(0, 0, w, y);
      ctx.fillRect(0, y + fh, w, h - y - fh);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = Math.max(1, h / 600);
    ctx.strokeRect(x + 0.5, y + 0.5, fw - 1, fh - 1);
    const size = Math.round(h / 50);
    ctx.font = `600 ${size}px ui-monospace, monospace`;
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.textBaseline = 'top';
    ctx.fillText(this.frame, x + size / 2, y + size / 2);
    ctx.restore();
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

  drawMedia(hap, t, w, h, dt, used) {
    const v = hap.value;
    const src = this.source(v);
    if (!src) return;
    const { ctx, lctx, layer } = this;
    lctx.globalCompositeOperation = 'source-over';
    lctx.globalAlpha = 1;
    lctx.filter = 'none';
    lctx.clearRect(0, 0, w, h);
    if (src.missing) {
      lctx.fillStyle = 'rgba(255,255,255,.06)';
      lctx.fillRect(0, 0, w, h);
      lctx.fillStyle = 'rgba(255,255,255,.4)';
      lctx.font = `${Math.round(h / 40)}px ui-monospace, monospace`;
      lctx.fillText(`missing media: ${src.missing}`, h / 40, h - h / 40);
    } else {
      // Strudel's audio effects read as picture effects (lpf → blur, room → glow, …)
      const p = pictureFx(v, h);
      const focus = Number(v.pos ?? 0.5);
      const pan = p?.pan ?? 0.5;
      let el = src.el;
      if (v.still) {
        let snap = this.stills.get(src.key);
        if (!snap) {
          snap = document.createElement('canvas');
          snap.width = w;
          snap.height = h;
          drawCover(snap.getContext('2d'), el, w, h, focus, false, pan);
          this.stills.set(src.key, snap);
        }
        el = snap;
      } else this.stills.delete(src.key);
      const mirror = !!v.mirror && el === src.el;
      // .fx(): the one-look effects (posterize, edges, …) are applied while drawing,
      // the video effectors (kaleido, vhs, …) run afterwards, in chain order
      const chain = fxChain(v.fx);
      const look = chain.find((n) => !videoFx[n]);
      const effectors = chain.filter((n) => videoFx[n]);
      const pix = pixelFx({ fx: look, levels: p?.levels, pixel: p?.pixel, pan }, el, w, h, focus, mirror);
      const filter = [cssFilter(look, v, h), pictureFilter(p)].filter(Boolean).join(' ');
      if (filter) lctx.filter = filter;
      // with outlines (hpf) the picture itself gives way to its edges
      if (p?.outlines) lctx.globalAlpha = 1 - p.outlines * 0.8;
      if (pix) {
        lctx.imageSmoothingEnabled = !(look === 'pixelate' || p?.pixel);
        lctx.drawImage(pix, 0, 0, w, h);
        lctx.imageSmoothingEnabled = true;
      } else drawCover(lctx, el, w, h, focus, mirror, pan);
      lctx.filter = 'none';
      lctx.globalAlpha = 1;
      if (effectors.length) {
        const amount = Math.max(0, Math.min(1, Number(v.amount ?? 0.5))) || 0;
        const hue = v.hue === undefined ? undefined : Number(v.hue);
        applyVideoFx(effectors, layer, lctx, w, h, { amount, hue, t, dt }, this.fxStates, src.key, used);
      }
      if (p?.outlines) {
        const edges = edgesOf(el, w, h, focus, mirror, pan);
        if (edges) {
          lctx.globalCompositeOperation = 'screen';
          lctx.globalAlpha = p.outlines;
          lctx.drawImage(edges, 0, 0, w, h);
          lctx.globalAlpha = 1;
          lctx.globalCompositeOperation = 'source-over';
        }
      }
      if (p?.glow) {
        // a blurred copy of the layer added on top: the picture blooms
        lctx.globalCompositeOperation = 'lighter';
        lctx.globalAlpha = p.glow * 0.55;
        lctx.filter = `blur(${p.glowPx.toFixed(1)}px)`;
        lctx.drawImage(layer, 0, 0);
        lctx.filter = 'none';
        lctx.globalAlpha = 1;
        lctx.globalCompositeOperation = 'source-over';
      }
      if (v.tint) {
        lctx.globalCompositeOperation = 'source-atop';
        lctx.globalAlpha = 0.45;
        lctx.fillStyle = String(v.tint);
        lctx.fillRect(0, 0, w, h);
        lctx.globalAlpha = 1;
        lctx.globalCompositeOperation = 'source-over';
      }
      if (p?.echo) {
        this.echo(src.key, p, dt, w, h);
        used?.add(src.key);
      }
    }
    ctx.save();
    ctx.globalAlpha = this.envelope(hap, t) * Number(v.opacity ?? 1);
    ctx.globalCompositeOperation = BLEND[v.blend] ?? 'source-over';
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  /**
   * .delay() on a picture: previous frames linger and fade, like an echo.
   * The buffer keeps the layer as drawn (echoes included, so it feeds back),
   * fading by delayfeedback every delaytime seconds, and is blended over the
   * fresh frame. A still picture looks the same; a changing one trails.
   */
  echo(key, p, dt, w, h) {
    let trail = this.trails.get(key);
    if (!trail) {
      trail = document.createElement('canvas');
      this.trails.set(key, trail);
    }
    const fresh = trail.width !== w || trail.height !== h;
    if (fresh) {
      trail.width = w;
      trail.height = h;
    }
    const tctx = trail.getContext('2d');
    const { lctx, layer } = this;
    if (!fresh) {
      tctx.globalCompositeOperation = 'destination-out';
      tctx.globalAlpha = 1 - p.echoRetain(dt);
      tctx.fillStyle = '#000';
      tctx.fillRect(0, 0, w, h);
      lctx.globalCompositeOperation = 'source-over';
      lctx.globalAlpha = p.echo * 0.8;
      lctx.drawImage(trail, 0, 0);
      lctx.globalAlpha = 1;
    }
    tctx.globalCompositeOperation = 'source-over';
    tctx.globalAlpha = 1;
    tctx.drawImage(layer, 0, 0);
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
