// What the editor shows when you point at something in the code.
//
//   – a function name (s, lpf, img, fx…)      → its doc, from the Reference
//   – a name inside a string                   → what that name is, by the function
//     fx("kaleido") · visual("spiral") · blend("screen") · s("bd") · bank("…")
//     img("rain") · note("c2")
//   – a mini-notation symbol inside "…"        → what it does: * / < > [ ] ~ , …
//   – $:                                       → what a layer is
//
// hintAt() is plain data so it can be tested without a browser; assist.js
// turns the result into a tooltip.
import { noteToMidi } from '@strudel/core';
import { BLENDS, FX_LOOKS, VIDEO_FX, VISUALS } from '../soda/catalog.js';

export const MINI_SYMBOLS = {
  '~': 'rest – a step with no event',
  '-': 'rest – a step with no event',
  '*': 'faster – a*4 plays a four times in its step',
  '/': 'slower – a/2 spreads a over two cycles',
  '<': 'one per cycle – <a b c> takes the next item each cycle',
  '>': 'one per cycle – <a b c> takes the next item each cycle',
  '[': 'group – [a b] squeezes into one step',
  ']': 'group – [a b] squeezes into one step',
  '{': 'polymeter – {a b c}%4 steps through at 4 per cycle',
  '}': 'polymeter – {a b c}%4 steps through at 4 per cycle',
  ',': 'together – a, b play at the same time (a chord or stacked layers)',
  ':': 'variation – a:2 is the third sample of a (in fx, a chain: vhs:kaleido)',
  '!': 'repeat – a!3 is a a a',
  '@': 'length – a@3 lasts three steps',
  '?': 'maybe – a? plays half the time (a?.2 = 20 % dropped)',
  '|': 'random choice – a | b picks one each cycle',
  '(': 'Euclidean rhythm – a(3,8) spreads 3 hits over 8 steps',
  ')': 'Euclidean rhythm – a(3,8) spreads 3 hits over 8 steps',
  '.': 'groups – a b . c d is [a b] [c d]',
  '_': 'hold – a _ _ stretches a over three steps',
  '%': 'steps per cycle for a {polymeter}',
};

export const BLEND_HINTS = {
  normal: 'draws over what is below',
  screen: 'lightens – black disappears, good for glowing layers',
  multiply: 'darkens – white disappears',
  overlay: 'contrast – lights get lighter, darks darker',
  lighter: 'adds light – overlaps burn towards white',
  difference: 'inverts where layers overlap',
  'soft-light': 'a gentle overlay',
};

const LAYER_HINT = { title: '$:', body: 'a layer – every $: line plays at the same time; _$: mutes it' };

/** Opening quote of the mini-notation string ("…" or `…`) the offset sits in; -1 in code, -2 in a plain '…' string, -3 in a comment. */
function stringStart(text, offset) {
  let open = -1;
  let quote = '';
  for (let i = 0; i < offset; i++) {
    const c = text[i];
    if (open < 0) {
      if (c === '/' && text[i + 1] === '/') return -3; // a comment
      if (c === '"' || c === '`' || c === "'") (open = i), (quote = c);
    } else if (c === '\\') i++;
    else if (c === quote) open = -1;
  }
  return open >= 0 && quote === "'" ? -2 : open; // -2: inside a plain JS string
}

function soundHint(name, sounds) {
  const entry = sounds?.[name] ?? sounds?.[name.toLowerCase()];
  if (!entry) return null;
  const type = entry.data?.type ?? 'sound';
  const files = Array.isArray(entry.data?.samples) ? entry.data.samples.length : null;
  const what = type === 'sample' ? `sample${files > 1 ? ` · ${files} variations (name:0 … name:${files - 1})` : ''}` : type;
  return `sound – ${what}`;
}

function noteHint(word) {
  if (!/^[a-gA-G](#|b|s|f)*-?\d*$/.test(word)) return null;
  try {
    const midi = noteToMidi(word);
    return `note – MIDI ${midi}${/\d$/.test(word) ? '' : ' (octave 3 when none is given)'}`;
  } catch {
    return null;
  }
}

/** A hint for a name inside the string argument of fn. */
function nameHint(fn, word, { sounds, banks, media }) {
  if (fn === 'fx') {
    if (VIDEO_FX[word]) return `effector – ${VIDEO_FX[word]}`;
    if (FX_LOOKS[word]) return `look – ${FX_LOOKS[word]}`;
  }
  if (fn === 'visual' && VISUALS[word]) return VISUALS[word].description;
  if (fn === 'blend' && BLENDS.includes(word)) return `blend – ${BLEND_HINTS[word]}`;
  if (fn === 'bank' && banks?.has(word)) return 'sound bank – its sounds are bank_name, e.g. s("bd").bank(…)';
  if ((fn === 'img' || fn === 'vid') && media?.has(word)) return `${fn === 'img' ? 'image' : 'video'} – ${media.get(word)}`;
  if (fn === 's' || fn === 'sound') return soundHint(word, sounds);
  if (fn === 'note' || fn === 'n' || fn === 'chord') return noteHint(word);
  return null;
}

/**
 * The hint at `offset` in one line of code, or null.
 * `ctx` = { findDoc(name), sounds: {name: entry}, banks: Set, media: Map(name → kind) }
 * Returns { from, to, title, body } (offsets in the line) or { from, to, doc }.
 */
export function hintAt(text, offset, side = 0, ctx = {}) {
  // $: at the start of a block
  const layer = text.match(/^(\s*)(_?\$):/);
  if (layer && offset >= layer[1].length && offset <= layer[1].length + layer[2].length + 1) {
    return { from: layer[1].length, to: layer[1].length + layer[2].length + 1, ...LAYER_HINT };
  }

  const open = stringStart(text, offset);
  if (open < -1) return null;
  const isWord = (c) => c !== undefined && /[\w#-]/.test(c);
  let from = offset;
  let to = offset;
  while (from > 0 && isWord(text[from - 1])) from--;
  while (to < text.length && isWord(text[to])) to++;
  // pointing just past a word's end (or before its start) is not pointing at it
  if ((from === offset && side < 0) || (to === offset && side > 0)) (from = offset), (to = offset);

  if (open >= 0) {
    const fn = text.slice(0, open).match(/([A-Za-z_]\w*)\(\s*$/)?.[1];
    if (from === to) {
      const at = side < 0 ? offset - 1 : offset;
      const c = text[at];
      return MINI_SYMBOLS[c] ? { from: at, to: at + 1, title: c, body: MINI_SYMBOLS[c] } : null;
    }
    const word = text.slice(from, to);
    const body = fn ? nameHint(fn, word, ctx) : null;
    return body ? { from, to, title: word, body } : null;
  }

  if (from === to || !/^[A-Za-z_]/.test(text[from])) return null;
  const doc = ctx.findDoc?.(text.slice(from, to));
  return doc ? { from, to, doc } : null;
}
