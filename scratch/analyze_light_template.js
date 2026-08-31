const sharp = require('sharp');
const path = require('path');

async function analyzeLightTemplate() {
  const lightPath = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const { data, info } = await sharp(lightPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  console.log(`Light image template: ${w}x${h}`);

  // Find exact cap in light template:
  // Cap is deep blue near top
  let capPixels = [];
  for (let y = 50; y < 150; y++) {
    for (let x = 320; x < 480; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a > 150 && b > 100 && r < 70 && g < 100) {
        capPixels.push({ x, y, r, g, b });
      }
    }
  }

  const capMinY = Math.min(...capPixels.map(p => p.y));
  const capMaxY = Math.max(...capPixels.map(p => p.y));
  const capMinX = Math.min(...capPixels.map(p => p.x));
  const capMaxX = Math.max(...capPixels.map(p => p.x));
  const capCenterX = (capMinX + capMaxX) / 2;
  const capWidth = capMaxX - capMinX;
  const capHeight = capMaxY - capMinY;

  console.log(`LIGHT CAP: Top=${capMinY}, Bottom=${capMaxY}, Height=${capHeight}, Left=${capMinX}, Right=${capMaxX}, CenterX=${capCenterX}, Width=${capWidth}`);

  // Find label in light template:
  let labelPixels = [];
  for (let y = 350; y < 550; y++) {
    for (let x = 280; x < 520; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a > 200 && b > 80 && r < 50 && g < 65) {
        labelPixels.push({ x, y });
      }
    }
  }
  const labelMinY = Math.min(...labelPixels.map(p => p.y));
  const labelMaxY = Math.max(...labelPixels.map(p => p.y));
  const labelMinX = Math.min(...labelPixels.map(p => p.x));
  const labelMaxX = Math.max(...labelPixels.map(p => p.x));

  console.log(`LIGHT LABEL: Top=${labelMinY}, Bottom=${labelMaxY}, Height=${labelMaxY - labelMinY}, Left=${labelMinX}, Right=${labelMaxX}, CenterX=${(labelMinX + labelMaxX)/2}, Width=${labelMaxX - labelMinX}`);

  // Find bottle base in light template:
  let baseMaxY = 0;
  for (let y = 700; y < h; y++) {
    for (let x = 320; x < 480; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx+3] > 180) {
        if (y > baseMaxY) baseMaxY = y;
      }
    }
  }
  console.log(`LIGHT BOTTLE BASE BOTTOM: ${baseMaxY}`);
  console.log(`LIGHT TOTAL BOTTLE SPAN: ${baseMaxY - capMinY}px`);
}

analyzeLightTemplate().catch(console.error);
