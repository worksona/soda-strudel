// "✦ Claude": copies everything Claude needs to continue the sketch. Pair it
// with the strudel-vibe skill (claude/skills/strudel-vibe) for best results.
import { sketchUrl } from '../share/sketch.js';
import { listMediaItems, listSounds } from '../storage/db.js';

export async function copyForClaude(sketch, lastError) {
  const [sounds, media] = await Promise.all([listSounds(), listMediaItems()]);
  const link = await sketchUrl(sketch, location.origin);
  const text = [
    "I'm working on a soda-strudel sketch (Strudel live-coding music + soda's multimedia functions). Use the strudel-vibe skill if you have it.",
    '',
    `Title: ${sketch.title || 'Untitled'}`,
    `Shape: ${sketch.aspect ?? 'free'}`,
    `Site: ${location.origin}`,
    '',
    'Current code:',
    '```js',
    sketch.code,
    '```',
    lastError ? `\nLast error: ${lastError}` : '',
    sounds.length ? `\nMy own sounds (only in my browser): ${sounds.map((s) => s.name).join(', ')}` : '',
    media.length ? `My own media (only in my browser): ${media.map((m) => m.name).join(', ')}` : '',
    `\nCurrent link: ${link}`,
    '',
    'What I want next: ',
  ]
    .filter((l) => l !== '')
    .join('\n');
  await navigator.clipboard.writeText(text);
  return text;
}
