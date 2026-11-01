// The code layer in a video export. With View › Code over the stage, a
// recording shows what the screen shows: the code on its veil, in its colours,
// with the playing notes outlined, the sliders and the inline visuals
// (._pianoroll() and friends). Each frame copies the visible part of the
// editor onto the export canvas.
//
// Positions come straight from the editor on screen, scaled so the code keeps
// its size relative to the frame's short side and anchored at the top left –
// the same place it sits over the stage.

/** True when the code is on screen over the stage (not stage-only, not full screen). */
export function codeVisible(editorEl) {
  if (document.body.dataset.mode !== 'code') return false;
  const fs = document.fullscreenElement;
  if (fs && !fs.contains(editorEl)) return false;
  const box = editorEl.getBoundingClientRect();
  return box.width > 0 && box.height > 0;
}

const shadowOf = (css) => {
  // "rgba(0, 0, 0, 0.9) 0px 1px 2px" (computed styles put the colour first)
  if (!css || css === 'none') return null;
  const color = css.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i)?.[0];
  const nums = css.replace(color ?? '', '').match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
  return color ? { color, x: nums[0] ?? 0, y: nums[1] ?? 0, blur: nums[2] ?? 0 } : null;
};
const fontOf = (cs) => `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
const visibleColor = (c) => c && c !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(c);

/** Returns paint(ctx, w, h), drawing the code layer over an export frame of w × h. */
export function createCodeLayer(editorEl) {
  const range = document.createRange();

  function drawText(ctx, node, cs, top, bottom) {
    const text = node.data;
    if (!text.trim()) return;
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    if (!rects.length) return;
    ctx.font = fontOf(cs);
    ctx.fillStyle = cs.color;
    ctx.globalAlpha = Number(cs.opacity) || 1;
    if (rects.length === 1) {
      const r = rects[0];
      if (r.bottom < top || r.top > bottom) return;
      ctx.fillText(text, r.left, r.top + r.height / 2);
      return;
    }
    // a wrapped run: place it character by character
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ' || text[i] === '\n') continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      if (r.bottom < top || r.top > bottom) continue;
      ctx.fillText(text[i], r.left, r.top + r.height / 2);
    }
  }

  return function paint(ctx, w, h) {
    if (!codeVisible(editorEl)) return;
    const box = editorEl.getBoundingClientRect();
    const s = Math.min(w, h) / Math.min(box.width, box.height);
    const fw = w / s; // the frame in screen pixels
    const fh = h / s;
    const ecs = getComputedStyle(editorEl);

    ctx.save();
    ctx.setTransform(s, 0, 0, s, -box.left * s, -box.top * s);
    ctx.beginPath();
    ctx.rect(box.left, box.top, fw, fh);
    ctx.clip();

    // the veil: a gradient that fades out to the right in the dark theme, a full layer in the light one
    const veil = getComputedStyle(document.documentElement).getPropertyValue('--editor-veil').trim();
    if (veil) {
      if (ecs.backgroundImage.includes('gradient')) {
        const solid = Math.min(760, box.width);
        const fade = Math.min(980, box.width);
        const g = ctx.createLinearGradient(box.left, 0, box.left + fade, 0);
        g.addColorStop(0, veil);
        g.addColorStop(fade ? solid / fade : 1, veil);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
      } else ctx.fillStyle = visibleColor(ecs.backgroundColor) ? ecs.backgroundColor : veil;
      ctx.fillRect(box.left, box.top, fw, fh);
    }

    const top = box.top;
    const bottom = box.top + fh;
    ctx.textBaseline = 'middle';
    const content = editorEl.querySelector('.cm-content');
    const shadow = content && shadowOf(getComputedStyle(content).textShadow);
    if (shadow) {
      // shadows ignore the transform, so scale them by hand
      ctx.shadowColor = shadow.color;
      ctx.shadowOffsetX = shadow.x * s;
      ctx.shadowOffsetY = shadow.y * s;
      ctx.shadowBlur = shadow.blur * s;
    }

    // line numbers
    for (const el of editorEl.querySelectorAll('.cm-lineNumbers .cm-gutterElement')) {
      const r = el.getBoundingClientRect();
      if (!el.textContent || r.bottom < top || r.top > bottom || r.height === 0) continue;
      const cs = getComputedStyle(el);
      ctx.font = fontOf(cs);
      ctx.fillStyle = cs.color;
      ctx.textAlign = 'right';
      ctx.fillText(el.textContent, r.right - parseFloat(cs.paddingRight || 0), r.top + r.height / 2);
    }
    ctx.textAlign = 'left';

    if (content) {
      // the text, run by run, in each run's own colour and font
      const styles = new Map();
      const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || parent.closest('.cm-widgetBuffer, [aria-hidden="true"]')) continue;
        let cs = styles.get(parent);
        if (!cs) styles.set(parent, (cs = getComputedStyle(parent)));
        if (cs.visibility === 'hidden') continue;
        drawText(ctx, node, cs, top, bottom);
      }
      ctx.globalAlpha = 1;
      ctx.shadowColor = 'transparent';

      // the notes playing now: Strudel outlines them (or fills them, with markcss)
      for (const el of content.querySelectorAll('[style*="outline"], [style*="background"]')) {
        const cs = getComputedStyle(el);
        for (const r of el.getClientRects()) {
          if (r.bottom < top || r.top > bottom) continue;
          if (visibleColor(cs.backgroundColor)) {
            ctx.fillStyle = cs.backgroundColor;
            ctx.globalAlpha = 0.35;
            ctx.fillRect(r.left, r.top, r.width, r.height);
            ctx.globalAlpha = 1;
          }
          const ow = parseFloat(cs.outlineWidth) || 0;
          if (ow && cs.outlineStyle !== 'none') {
            ctx.strokeStyle = cs.outlineColor;
            ctx.lineWidth = ow;
            ctx.strokeRect(r.left - ow / 2, r.top - ow / 2, r.width + ow, r.height + ow);
          }
        }
      }

      // inline visuals (._pianoroll(), ._scope() …) are canvases in the code
      for (const c of content.querySelectorAll('canvas')) {
        const r = c.getBoundingClientRect();
        if (!c.width || !c.height || r.bottom < top || r.top > bottom) continue;
        try {
          ctx.drawImage(c, r.left, r.top, r.width, r.height);
        } catch {
          // a canvas that cannot be read is left out
        }
      }

      // sliders: track, fill up to the value, thumb
      for (const input of content.querySelectorAll('input[type="range"]')) {
        const r = input.getBoundingClientRect();
        if (!r.width || r.bottom < top || r.top > bottom) continue;
        const min = Number(input.min || 0);
        const max = Number(input.max || 1);
        const p = max > min ? (Number(input.value) - min) / (max - min) : 0;
        const accent = getComputedStyle(input).accentColor;
        const color = accent && accent !== 'auto' ? accent : getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8be9fd';
        const y = r.top + r.height / 2;
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(r.left, y - 2, r.width, 4);
        ctx.fillStyle = color;
        ctx.fillRect(r.left, y - 2, r.width * p, 4);
        ctx.beginPath();
        ctx.arc(r.left + r.width * p, y, Math.min(7, r.height / 2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };
}
