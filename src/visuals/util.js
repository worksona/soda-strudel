/** Hue for an event: shifts the base hue by pitch so melodies colour-shift. */
export const noteHue = (value, base) => {
  const n = typeof value.note === 'number' ? value.note : typeof value.n === 'number' ? value.n * 7 : null;
  return n === null ? base : (base + n * 9) % 360;
};
