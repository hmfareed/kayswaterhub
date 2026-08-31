const sharp = require('sharp');
const path = require('path');

async function inspectLabel() {
  const origDark = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const { data, info } = await sharp(origDark).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Sample label region x in [250, 420], y in [350, 510]
  let maxR = 0, maxG = 0, maxB = 0;
  for (let y = 350; y <= 510; y++) {
    for (let x = 250; x <= 420; x++) {
      const idx = (y * info.width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (r > maxR) maxR = r;
      if (g > maxG) maxG = g;
      if (b > maxB) maxB = b;
    }
  }
  console.log(`Original label max colors: R=${maxR}, G=${maxG}, B=${maxB}`);
}

inspectLabel().catch(console.error);
