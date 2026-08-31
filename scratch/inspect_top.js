const sharp = require('sharp');
const path = require('path');

async function inspectTop() {
  const p = path.join(__dirname, '../public/images/voltic-splash-dark-trimmed.png');
  const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true });

  console.log(`Image: ${info.width}x${info.height}`);
  for (let y = 0; y <= 70; y += 10) {
    for (let x = 380; x <= 420; x += 10) {
      const idx = (y * info.width + x) * 4;
      if (data[idx+3] > 0) {
        console.log(`Non-zero alpha at (${x}, ${y}): R=${data[idx]}, G=${data[idx+1]}, B=${data[idx+2]}, A=${data[idx+3]}`);
      }
    }
  }
}

inspectTop().catch(console.error);
