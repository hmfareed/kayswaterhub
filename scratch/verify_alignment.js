const sharp = require('sharp');
const path = require('path');

async function verifyAlignment() {
  const lightPath = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const darkPath = path.join(__dirname, '../public/images/voltic-splash-dark-transparent.png');

  const { data: lData, info: lInfo } = await sharp(lightPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: dData, info: dInfo } = await sharp(darkPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const w = lInfo.width;
  const h = lInfo.height;

  // 1. Light Cap vs Dark Cap
  let lCapTop = -1, lCapMinX = 999, lCapMaxX = 0;
  let dCapTop = -1, dCapMinX = 999, dCapMaxX = 0;

  for (let y = 40; y < 160; y++) {
    for (let x = 320; x < 480; x++) {
      const idx = (y * w + x) * 4;
      // Light cap
      if (lData[idx+3] > 150 && lData[idx+2] > 100 && lData[idx] < 80) {
        if (lCapTop === -1) lCapTop = y;
        if (x < lCapMinX) lCapMinX = x;
        if (x > lCapMaxX) lCapMaxX = x;
      }
      // Dark cap
      if (dData[idx+3] > 150 && dData[idx+2] > 60 && dData[idx] < 45 && (dData[idx+2] - dData[idx]) > 35) {
        if (dCapTop === -1) dCapTop = y;
        if (x < dCapMinX) dCapMinX = x;
        if (x > dCapMaxX) dCapMaxX = x;
      }
    }
  }

  const lCapCenterX = (lCapMinX + lCapMaxX) / 2;
  const dCapCenterX = (dCapMinX + dCapMaxX) / 2;

  // 2. Light Label vs Dark Label
  let lLabelTop = -1, lLabelMinX = 999, lLabelMaxX = 0;
  let dLabelTop = -1, dLabelMinX = 999, dLabelMaxX = 0;

  for (let y = 350; y < 550; y++) {
    for (let x = 250; x < 550; x++) {
      const idx = (y * w + x) * 4;
      if (lData[idx+3] > 200 && lData[idx+2] > 70 && lData[idx] < 50) {
        if (lLabelTop === -1) lLabelTop = y;
        if (x < lLabelMinX) lLabelMinX = x;
        if (x > lLabelMaxX) lLabelMaxX = x;
      }
      if (dData[idx+3] > 200 && dData[idx+2] > 40 && dData[idx] < 40 && (dData[idx+2] - dData[idx]) > 20) {
        if (dLabelTop === -1) dLabelTop = y;
        if (x < dLabelMinX) dLabelMinX = x;
        if (x > dLabelMaxX) dLabelMaxX = x;
      }
    }
  }

  // 3. Base Bottom
  let lBaseBottom = -1, dBaseBottom = -1;
  for (let y = 650; y < h; y++) {
    for (let x = 320; x < 480; x++) {
      const idx = (y * w + x) * 4;
      if (lData[idx+3] > 180) {
        if (y > lBaseBottom) lBaseBottom = y;
      }
      if (dData[idx+3] > 180 && (dData[idx] > 20 || dData[idx+1] > 30 || dData[idx+2] > 50)) {
        if (y > dBaseBottom) dBaseBottom = y;
      }
    }
  }

  console.log('=== ALIGNMENT VERIFICATION REPORT ===');
  console.log(`Cap Top Y:      Light=${lCapTop}px  |  Dark=${dCapTop}px  (Diff: ${Math.abs(lCapTop - dCapTop)}px)`);
  console.log(`Cap Center X:   Light=${lCapCenterX}px  |  Dark=${dCapCenterX}px  (Diff: ${Math.abs(lCapCenterX - dCapCenterX)}px)`);
  console.log(`Cap Width:      Light=${lCapMaxX - lCapMinX}px  |  Dark=${dCapMaxX - dCapMinX}px`);
  console.log(`Label Top Y:    Light=${lLabelTop}px  |  Dark=${dLabelTop}px  (Diff: ${Math.abs(lLabelTop - dLabelTop)}px)`);
  console.log(`Label Center X: Light=${(lLabelMinX+lLabelMaxX)/2}px  |  Dark=${(dLabelMinX+dLabelMaxX)/2}px`);
  console.log(`Base Bottom Y:  Light=${lBaseBottom}px  |  Dark=${dBaseBottom}px  (Diff: ${Math.abs(lBaseBottom - dBaseBottom)}px)`);
  console.log(`Total Height:   Light=${lBaseBottom - lCapTop}px  |  Dark=${dBaseBottom - dCapTop}px  (Diff: ${Math.abs((lBaseBottom - lCapTop) - (dBaseBottom - dCapTop))}px)`);
}

verifyAlignment().catch(console.error);
