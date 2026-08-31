const sharp = require('sharp');
const path = require('path');

async function analyzeDarkSource() {
  const darkPath = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const { data, info } = await sharp(darkPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  console.log(`Dark source image: ${w}x${h}`);

  // Find exact cap in dark source:
  let capPixels = [];
  for (let y = 90; y < 180; y++) {
    for (let x = 280; x < 400; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // Cap in dark image is blue (b > 65 and b - r > 40)
      if (b > 65 && (b - r) > 40 && (b - g) > 20) {
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

  console.log(`DARK CAP: Top=${capMinY}, Bottom=${capMaxY}, Height=${capHeight}, Left=${capMinX}, Right=${capMaxX}, CenterX=${capCenterX}, Width=${capWidth}`);

  // Find label in dark source:
  let labelPixels = [];
  for (let y = 330; y < 530; y++) {
    for (let x = 230; x < 440; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (b > 45 && (b - r) > 25 && r < 40 && g < 50) {
        labelPixels.push({ x, y });
      }
    }
  }
  const labelMinY = Math.min(...labelPixels.map(p => p.y));
  const labelMaxY = Math.max(...labelPixels.map(p => p.y));
  const labelMinX = Math.min(...labelPixels.map(p => p.x));
  const labelMaxX = Math.max(...labelPixels.map(p => p.x));

  console.log(`DARK LABEL: Top=${labelMinY}, Bottom=${labelMaxY}, Height=${labelMaxY - labelMinY}, Left=${labelMinX}, Right=${labelMaxX}, CenterX=${(labelMinX + labelMaxX)/2}, Width=${labelMaxX - labelMinX}`);

  // Find bottle base in dark source:
  let baseMaxY = 0;
  for (let y = 600; y < h; y++) {
    for (let x = 280; x < 400; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (r > 30 || g > 40 || b > 60) {
        if (y > baseMaxY) baseMaxY = y;
      }
    }
  }
  console.log(`DARK BOTTLE BASE BOTTOM: ${baseMaxY}`);
  console.log(`DARK TOTAL BOTTLE SPAN: ${baseMaxY - capMinY}px`);

  // Target Scale Calculations:
  console.log(`\nTARGET SCALE CALCULATIONS:`);
  console.log(`Scale by Cap Width (100 / ${capWidth}): ${(100 / capWidth).toFixed(4)}`);
  console.log(`Scale by Total Bottle Span (787 / ${baseMaxY - capMinY}): ${(787 / (baseMaxY - capMinY)).toFixed(4)}`);
  console.log(`Scale by Label Width (222 / ${labelMaxX - labelMinX}): ${(222 / (labelMaxX - labelMinX)).toFixed(4)}`);
}

analyzeDarkSource().catch(console.error);
