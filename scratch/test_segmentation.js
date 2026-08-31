const sharp = require('sharp');
const path = require('path');

async function testSegmentation() {
  const lightPath = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const darkPath = path.join(__dirname, '../public/images/voltic-splash-dark.png');

  const { data: lData, info: lInfo } = await sharp(lightPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: dData, info: dInfo } = await sharp(darkPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  console.log(`Light image: ${lInfo.width}x${lInfo.height}`);
  console.log(`Dark image: ${dInfo.width}x${dInfo.height}`);

  // Measure light bottle geometry precisely
  // 1. Cap top in light:
  let lightCapTop = -1;
  for (let y = 0; y < 200; y++) {
    for (let x = 350; x < 450; x++) {
      const idx = (y * lInfo.width + x) * 4;
      if (lData[idx+3] > 150 && lData[idx+2] > 120 && lData[idx] < 60) {
        if (lightCapTop === -1) lightCapTop = y;
      }
    }
  }

  // 2. Cap width & center in light:
  let lightCapMinX = 999, lightCapMaxX = 0;
  for (let x = 300; x < 500; x++) {
    const idx = ((lightCapTop + 20) * lInfo.width + x) * 4;
    if (lData[idx+3] > 150 && lData[idx+2] > 100 && lData[idx] < 60) {
      if (x < lightCapMinX) lightCapMinX = x;
      if (x > lightCapMaxX) lightCapMaxX = x;
    }
  }
  const lightCapCenterX = (lightCapMinX + lightCapMaxX) / 2;
  const lightCapWidth = lightCapMaxX - lightCapMinX;

  // 3. Label in light:
  let lightLabelTop = -1, lightLabelBottom = -1, lightLabelMinX = 999, lightLabelMaxX = 0;
  for (let y = 350; y < 550; y++) {
    for (let x = 280; x < 520; x++) {
      const idx = (y * lInfo.width + x) * 4;
      if (lData[idx+3] > 150 && lData[idx+2] > 60 && lData[idx] < 40 && lData[idx+1] < 50) {
        if (lightLabelTop === -1) lightLabelTop = y;
        lightLabelBottom = y;
        if (x < lightLabelMinX) lightLabelMinX = x;
        if (x > lightLabelMaxX) lightLabelMaxX = x;
      }
    }
  }
  const lightLabelWidth = lightLabelMaxX - lightLabelMinX;
  const lightLabelHeight = lightLabelBottom - lightLabelTop;

  // 4. Base bottom in light:
  let lightBaseBottom = -1;
  for (let y = 600; y < 860; y++) {
    for (let x = 350; x < 450; x++) {
      const idx = (y * lInfo.width + x) * 4;
      if (lData[idx+3] > 200) {
        lightBaseBottom = y;
      }
    }
  }

  console.log(`LIGHT GEOMETRY:
  Cap Top: ${lightCapTop}
  Cap Center X: ${lightCapCenterX}
  Cap Width: ${lightCapWidth}
  Label Top: ${lightLabelTop}, Bottom: ${lightLabelBottom}, Height: ${lightLabelHeight}, Width: ${lightLabelWidth}
  Base Bottom: ${lightBaseBottom}
  Bottle Height (CapTop -> BaseBottom): ${lightBaseBottom - lightCapTop}`);

  // Measure dark bottle geometry precisely
  let darkCapTop = -1;
  for (let y = 50; y < 200; y++) {
    for (let x = 290; x < 390; x++) {
      const idx = (y * dInfo.width + x) * 4;
      const r = dData[idx], g = dData[idx+1], b = dData[idx+2];
      if (b > 65 && (b - r) > 40 && (b - g) > 20) {
        if (darkCapTop === -1) darkCapTop = y;
      }
    }
  }

  let darkCapMinX = 999, darkCapMaxX = 0;
  for (let x = 250; x < 420; x++) {
    const idx = ((darkCapTop + 20) * dInfo.width + x) * 4;
    const r = dData[idx], g = dData[idx+1], b = dData[idx+2];
    if (b > 65 && (b - r) > 40) {
      if (x < darkCapMinX) darkCapMinX = x;
      if (x > darkCapMaxX) darkCapMaxX = x;
    }
  }
  const darkCapCenterX = (darkCapMinX + darkCapMaxX) / 2;
  const darkCapWidth = darkCapMaxX - darkCapMinX;

  let darkLabelTop = -1, darkLabelBottom = -1, darkLabelMinX = 999, darkLabelMaxX = 0;
  for (let y = 300; y < 550; y++) {
    for (let x = 220; x < 450; x++) {
      const idx = (y * dInfo.width + x) * 4;
      const r = dData[idx], g = dData[idx+1], b = dData[idx+2];
      if (b > 50 && (b - r) > 30 && r < 40 && g < 50) {
        if (darkLabelTop === -1) darkLabelTop = y;
        darkLabelBottom = y;
        if (x < darkLabelMinX) darkLabelMinX = x;
        if (x > darkLabelMaxX) darkLabelMaxX = x;
      }
    }
  }
  const darkLabelWidth = darkLabelMaxX - darkLabelMinX;
  const darkLabelHeight = darkLabelBottom - darkLabelTop;

  let darkBaseBottom = -1;
  for (let y = 600; y < 780; y++) {
    for (let x = 300; x < 380; x++) {
      const idx = (y * dInfo.width + x) * 4;
      const r = dData[idx], g = dData[idx+1], b = dData[idx+2];
      if (r > 30 || g > 40 || b > 60) {
        darkBaseBottom = y;
      }
    }
  }

  console.log(`DARK GEOMETRY:
  Cap Top: ${darkCapTop}
  Cap Center X: ${darkCapCenterX}
  Cap Width: ${darkCapWidth}
  Label Top: ${darkLabelTop}, Bottom: ${darkLabelBottom}, Height: ${darkLabelHeight}, Width: ${darkLabelWidth}
  Base Bottom: ${darkBaseBottom}
  Bottle Height (CapTop -> BaseBottom): ${darkBaseBottom - darkCapTop}`);

  const capWidthScale = lightCapWidth / darkCapWidth;
  const bottleHeightScale = (lightBaseBottom - lightCapTop) / (darkBaseBottom - darkCapTop);
  const labelWidthScale = lightLabelWidth / darkLabelWidth;

  console.log(`Scales:
  By Cap Width: ${capWidthScale.toFixed(4)}
  By Bottle Height: ${bottleHeightScale.toFixed(4)}
  By Label Width: ${labelWidthScale.toFixed(4)}`);
}

testSegmentation().catch(console.error);
