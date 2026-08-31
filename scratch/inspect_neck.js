const sharp = require('sharp');
const path = require('path');

async function inspectNeckPixels() {
  const darkPath = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const { data, info } = await sharp(darkPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;

  console.log('Inspecting neck & shoulder rows y in [120, 240] across X around center (338):');
  
  for (let y = 110; y <= 220; y += 15) {
    console.log(`\n--- ROW y=${y} ---`);
    for (let x = 280; x <= 400; x += 10) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const dist = Math.sqrt(Math.pow(r - 3.49, 2) + Math.pow(g - 13.63, 2) + Math.pow(b - 29.95, 2));
      console.log(`x=${x}: RGB=[${r}, ${g}, ${b}] Brightness=${brightness.toFixed(1)} Dist=${dist.toFixed(1)}`);
    }
  }
}

inspectNeckPixels().catch(console.error);
