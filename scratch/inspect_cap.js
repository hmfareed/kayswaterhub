const sharp = require('sharp');
const path = require('path');

async function inspectCap() {
  const inputDark = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const { data, info } = await sharp(inputDark).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  console.log('Sampling column x=337 across y from 80 to 140:');
  for (let y = 80; y <= 130; y += 5) {
    const idx = (y * width + 337) * 4;
    console.log(`y=${y}: R=${data[idx]}, G=${data[idx+1]}, B=${data[idx+2]}, A=${data[idx+3]}`);
  }

  console.log('Sampling row y=100 across x from 280 to 390:');
  for (let x = 280; x <= 390; x += 10) {
    const idx = (100 * width + x) * 4;
    console.log(`x=${x}: R=${data[idx]}, G=${data[idx+1]}, B=${data[idx+2]}, A=${data[idx+3]}`);
  }

  console.log('Sampling row y=110 across x from 280 to 390:');
  for (let x = 280; x <= 390; x += 10) {
    const idx = (110 * width + x) * 4;
    console.log(`x=${x}: R=${data[idx]}, G=${data[idx+1]}, B=${data[idx+2]}, A=${data[idx+3]}`);
  }
}

inspectCap().catch(console.error);
