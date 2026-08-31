const sharp = require('sharp');
const path = require('path');

async function testMaskAlignment() {
  const lightRef = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const darkOrig = path.join(__dirname, '../public/images/voltic-splash-dark.png');

  const { data: lData, info: lInfo } = await sharp(lightRef).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: dData, info: dInfo } = await sharp(darkOrig).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  console.log('Light:', lInfo.width, 'x', lInfo.height);
  console.log('Dark:', dInfo.width, 'x', dInfo.height);

  // Let's sample along horizontal lines in the light image to get the exact bottle boundaries:
  console.log('\n--- EXACT LIGHT BOTTLE SILHOUETTE BOUNDS ---');
  for (let y = 68; y <= 600; y += 40) {
    let minX = 999, maxX = -1;
    for (let x = 200; x < 600; x++) {
      const idx = (y * lInfo.width + x) * 4;
      const a = lData[idx + 3];
      if (a > 180) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    console.log(`y=${y}: X in [${minX}..${maxX}] (Center=${(minX+maxX)/2}, Width=${maxX-minX}, HalfWidth=${(maxX-minX)/2})`);
  }
}

testMaskAlignment().catch(console.error);
