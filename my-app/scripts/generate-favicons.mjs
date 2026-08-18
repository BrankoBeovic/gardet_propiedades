/**
 * Generates PNG + ICO favicons from public/favicon.svg
 * Run: node scripts/generate-favicons.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'favicon.svg');
const svg = fs.readFileSync(svgPath);

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const pngToIco = require('png-to-ico').default || require('png-to-ico');

async function main() {
  const sizes = [
    { name: 'favicon-16.png', size: 16 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  const pngBuffers = [];

  for (const { name, size } of sizes) {
    const buf = await sharp(svg).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(publicDir, name), buf);
    if (size <= 32) pngBuffers.push(buf);
  }

  const ico = await pngToIco(pngBuffers);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);

  console.log('Generated favicon.ico, favicon-16.png, favicon-32.png, apple-touch-icon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
