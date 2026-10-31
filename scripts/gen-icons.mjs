// Draws the app icon (the favicon's three dots) as PNGs for the web app manifest
// and iOS home screen, with no image libraries: RGBA pixels -> zlib -> PNG.
//   node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';

const BG = [11, 11, 18];
const ACCENT = [124, 242, 201];
// dots in a 32×32 design space: [cx, cy, r, alpha]
const DOTS = [
  [12, 20, 4, 1],
  [20, 12, 3, 0.7],
  [23, 22, 2, 0.5],
];

function png(size, { padding = 0 } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const scale = (size * (1 - 2 * padding)) / 32;
  const off = size * padding;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let [r, g, b] = BG;
      for (const [cx, cy, rad, a] of DOTS) {
        const d = Math.hypot(x + 0.5 - (off + cx * scale), y + 0.5 - (off + cy * scale)) - rad * scale;
        const cover = Math.max(0, Math.min(1, 0.5 - d)) * a; // anti-aliased edge
        r += (ACCENT[0] - r) * cover;
        g += (ACCENT[1] - g) * cover;
        b += (ACCENT[2] - b) * cover;
      }
      px.set([r, g, b, 255].map(Math.round), (y * size + x) * 4);
    }
  // filter byte 0 per scanline
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const dir = new URL('../public/icons/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL('icon-192.png', dir), png(192));
await writeFile(new URL('icon-512.png', dir), png(512));
await writeFile(new URL('maskable-512.png', dir), png(512, { padding: 0.12 })); // safe zone for round masks
await writeFile(new URL('apple-touch-icon.png', dir), png(180));
console.log('icons written');
