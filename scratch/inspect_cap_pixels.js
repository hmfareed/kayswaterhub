const sharp = require('sharp');
const path = require('path');

async function inspectCapPixels() {
  const darkPath = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const { data, info } = await sharp(darkPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  console.log('Inspecting cap rows in dark image:');
  for (let y = 100; y <= 165; y += 2) {
    let nonBgLeft = -1, nonBgRight = -1;
    let blueCapLeft = -1, blueCapRight = -1;
    for (let x = 270; x <= 405; x++) {
      const idx = (y * info.width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const dist = Math.sqrt(Math.pow(r - 3.5, 2) + Math.pow(g - 13.6, 2) + Math.pow(b - 29.9, 2));

      if (dist > 15) {
        if (nonBgLeft === -1) nonBgLeft = x;
        nonBgRight = x;
      }
      // Blue cap condition: b > 60 and (b - r) > 40
      if (b > 60 && (b - r) > 40) {
        if (blueCapLeft === -1) blueCapLeft = x;
        blueCapRight = x;
      }
    }
    console.log(`y=${y}: BlueCap=[${blueCapLeft}..${blueCapRight}] (W=${blueCapRight > 0 ? blueCapRight - blueCapLeft : 0}), NonBg=[${nonBgLeft}..${nonBgRight}]`);
  }
}

inspectCapPixels().catch(console.error);
