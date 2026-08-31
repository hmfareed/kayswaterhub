const sharp = require('sharp');
const path = require('path');

async function compareBottles() {
  const lightPath = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const darkPath = path.join(__dirname, '../public/images/voltic-splash-dark.png');

  const { data: lData, info: lInfo } = await sharp(lightPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: dData, info: dInfo } = await sharp(darkPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  console.log(`LIGHT: ${lInfo.width}x${lInfo.height}`);
  console.log(`DARK: ${dInfo.width}x${dInfo.height}`);

  // Find bounding box of non-transparent pixels in light
  let lMinX = 9999, lMaxX = 0, lMinY = 9999, lMaxY = 0;
  for (let y = 0; y < lInfo.height; y++) {
    for (let x = 0; x < lInfo.width; x++) {
      const a = lData[(y * lInfo.width + x) * 4 + 3];
      if (a > 20) {
        if (x < lMinX) lMinX = x;
        if (x > lMaxX) lMaxX = x;
        if (y < lMinY) lMinY = y;
        if (y > lMaxY) lMaxY = y;
      }
    }
  }
  console.log(`LIGHT Content Bounding Box: X in [${lMinX}, ${lMaxX}] (W=${lMaxX - lMinX}), Y in [${lMinY}, ${lMaxY}] (H=${lMaxY - lMinY})`);

  // Find light bottle vertical markers (cap top, cap bottom, label top, label bottom, base bottom)
  // Let's sample light center column x=398:
  let lCapTop = -1, lCapBottom = -1, lLabelTop = -1, lLabelBottom = -1, lBaseBottom = -1;
  for (let y = 0; y < lInfo.height; y++) {
    const idx = (y * lInfo.width + 398) * 4;
    const r = lData[idx], g = lData[idx+1], b = lData[idx+2], a = lData[idx+3];
    if (a > 100) {
      if (b > 120 && r < 80 && y < 150) {
        if (lCapTop === -1) lCapTop = y;
        lCapBottom = y;
      }
      if (b > 80 && r < 40 && y > 350 && y < 550) {
        if (lLabelTop === -1) lLabelTop = y;
        lLabelBottom = y;
      }
      if (y > 600 && a > 200) {
        lBaseBottom = y;
      }
    }
  }
  console.log(`LIGHT Vertical Markers (at X=398): Cap=[${lCapTop}..${lCapBottom}] (H=${lCapBottom - lCapTop}), Label=[${lLabelTop}..${lLabelBottom}] (H=${lLabelBottom - lLabelTop}), BaseBottom=${lBaseBottom}`);
  console.log(`LIGHT Bottle Total Height (CapTop to BaseBottom): ${lBaseBottom - lCapTop}px`);

  // Now inspect dark bottle at center column x=337
  let dCapTop = -1, dCapBottom = -1, dLabelTop = -1, dLabelBottom = -1, dBaseBottom = -1;
  for (let y = 0; y < dInfo.height; y++) {
    const idx = (y * dInfo.width + 337) * 4;
    const r = dData[idx], g = dData[idx+1], b = dData[idx+2];
    // In dark image, cap is royal blue (b > 60, r < 50)
    if (b > 60 && r < 45 && y < 200) {
      if (dCapTop === -1) dCapTop = y;
      dCapBottom = y;
    }
    // Label is dark blue with white text (b > 50, r < 40)
    if (b > 50 && r < 40 && y > 330 && y < 530) {
      if (dLabelTop === -1) dLabelTop = y;
      dLabelBottom = y;
    }
    if (y > 600 && (r > 30 || g > 40 || b > 60)) {
      dBaseBottom = y;
    }
  }
  console.log(`DARK Vertical Markers (at X=337): Cap=[${dCapTop}..${dCapBottom}] (H=${dCapBottom - dCapTop}), Label=[${dLabelTop}..${dLabelBottom}] (H=${dLabelBottom - dLabelTop}), BaseBottom=${dBaseBottom}`);
  console.log(`DARK Bottle Total Height (CapTop to BaseBottom): ${dBaseBottom - dCapTop}px`);

  // Let's compute exact scale factor:
  const scaleByTotalHeight = (lBaseBottom - lCapTop) / (dBaseBottom - dCapTop);
  console.log(`Scale factor to match Light Bottle exactly: ${scaleByTotalHeight.toFixed(4)}`);
}

compareBottles().catch(console.error);
