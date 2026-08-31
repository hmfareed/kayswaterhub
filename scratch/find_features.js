const sharp = require('sharp');
const path = require('path');

async function findExactFeatures() {
  const darkPath = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const lightPath = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');

  const { data: darkData, info: darkInfo } = await sharp(darkPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: lightData, info: lightInfo } = await sharp(lightPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Light cap: around x in [340, 460], y in [50, 120]
  let lCapT = 999, lCapB = 0, lCapL = 999, lCapR = 0;
  for (let y = 60; y < 130; y++) {
    for (let x = 340; x < 460; x++) {
      const idx = (y * lightInfo.width + x) * 4;
      const r = lightData[idx], g = lightData[idx+1], b = lightData[idx+2];
      // Cap blue
      if (b > 120 && r < 70) {
        if (y < lCapT) lCapT = y;
        if (y > lCapB) lCapB = y;
        if (x < lCapL) lCapL = x;
        if (x > lCapR) lCapR = x;
      }
    }
  }

  // Light label: around y in [390, 540], x in [300, 500]
  let lLabelT = 999, lLabelB = 0, lLabelL = 999, lLabelR = 0;
  for (let y = 380; y < 550; y++) {
    for (let x = 300; x < 500; x++) {
      const idx = (y * lightInfo.width + x) * 4;
      const r = lightData[idx], g = lightData[idx+1], b = lightData[idx+2];
      if (b > 80 && r < 40 && g < 60) {
        if (y < lLabelT) lLabelT = y;
        if (y > lLabelB) lLabelB = y;
        if (x < lLabelL) lLabelL = x;
        if (x > lLabelR) lLabelR = x;
      }
    }
  }

  // Dark cap: around x in [280, 390], y in [90, 160]
  let dCapT = 999, dCapB = 0, dCapL = 999, dCapR = 0;
  for (let y = 90; y < 160; y++) {
    for (let x = 280; x < 390; x++) {
      const idx = (y * darkInfo.width + x) * 4;
      const r = darkData[idx], g = darkData[idx+1], b = darkData[idx+2];
      if (b > 80 && r < 50 && g < 70) {
        if (y < dCapT) dCapT = y;
        if (y > dCapB) dCapB = y;
        if (x < dCapL) dCapL = x;
        if (x > dCapR) dCapR = x;
      }
    }
  }

  // Dark label: around y in [360, 500], x in [250, 420]
  let dLabelT = 999, dLabelB = 0, dLabelL = 999, dLabelR = 0;
  for (let y = 350; y < 510; y++) {
    for (let x = 250; x < 420; x++) {
      const idx = (y * darkInfo.width + x) * 4;
      const r = darkData[idx], g = darkData[idx+1], b = darkData[idx+2];
      if (b > 60 && r < 40 && g < 50) {
        if (y < dLabelT) dLabelT = y;
        if (y > dLabelB) dLabelB = y;
        if (x < dLabelL) dLabelL = x;
        if (x > dLabelR) dLabelR = x;
      }
    }
  }

  console.log(`LIGHT: Cap [T:${lCapT}, B:${lCapB}, L:${lCapL}, R:${lCapR}] -> W:${lCapR-lCapL}, H:${lCapB-lCapT}, CenterX:${(lCapL+lCapR)/2}`);
  console.log(`LIGHT: Label [T:${lLabelT}, B:${lLabelB}, L:${lLabelL}, R:${lLabelR}] -> W:${lLabelR-lLabelL}, H:${lLabelB-lLabelT}`);

  console.log(`DARK: Cap [T:${dCapT}, B:${dCapB}, L:${dCapL}, R:${dCapR}] -> W:${dCapR-dCapL}, H:${dCapB-dCapT}, CenterX:${(dCapL+dCapR)/2}`);
  console.log(`DARK: Label [T:${dLabelT}, B:${dLabelB}, L:${dLabelL}, R:${dLabelR}] -> W:${dLabelR-dLabelL}, H:${dLabelB-dLabelT}`);
}

findExactFeatures().catch(console.error);
