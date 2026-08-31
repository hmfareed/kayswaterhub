const sharp = require('sharp');
const path = require('path');

async function inspectTrimmed() {
  const p = path.join(__dirname, '../public/images/voltic-splash-dark-trimmed.png');
  const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true });
  console.log(`Trimmed size: ${info.width}x${info.height}`);

  // Check column x=398 (center of cap) for y from 0 to 80
  for (let y = 0; y <= 75; y += 5) {
    const idx = (y * info.width + 398) * 4;
    console.log(`y=${y}: R=${data[idx]}, G=${data[idx+1]}, B=${data[idx+2]}, A=${data[idx+3]}`);
  }
}

inspectTrimmed().catch(console.error);
