// Dev Prep — generate PWA icons (192/512), apple-touch-icon (180) and the
// app favicon from public/logo.svg, composited on the brand dark background.
import sharp from 'sharp';
import { readFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';

const root = '/home/z/my-project';
const svg = readFileSync(path.join(root, 'public/logo.svg'));
const BG = '#0c0c11'; // Dev Prep dark theme background (matches layout themeColor)

async function makeIcon(size, out) {
  // Rasterize the 30x30 viewBox SVG at high density, then fit ~72% of the tile
  const inner = Math.round(size * 0.72);
  const raster = await sharp(svg, { density: 72 * 16 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: raster, gravity: 'center' }])
    .png()
    .toFile(path.join(root, out));
  console.log(`✓ ${out} (${size}x${size})`);
}

await makeIcon(192, 'public/icon-192.png');
await makeIcon(512, 'public/icon-512.png');
await makeIcon(180, 'public/apple-touch-icon.png');
copyFileSync(path.join(root, 'public/icon-192.png'), path.join(root, 'src/app/icon.png'));
console.log('✓ src/app/icon.png (favicon)');
