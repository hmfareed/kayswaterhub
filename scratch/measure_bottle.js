const sharp = require('sharp');
const path = require('path');

async function measureBottle() {
  const darkPath = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const lightPath = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');

  const { data: darkData, info: darkInfo } = await sharp(darkPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: lightData, info: lightInfo } = await sharp(lightPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  console.log('--- Light Bottle Alpha / Dimensions ---');
  // Find top cap of light bottle
  let lightCapTop = -1, lightCapBottom = -1;
  let lightCapLeft = 9999, lightCapRight = -1;
  for (let y = 0; y < lightInfo.height; y++) {
    for (let x = 0; x < lightInfo.width; x++) {
      const idx = (y * lightInfo.width + x) * 4;
      const a = lightData[idx + 3];
      if (a > 200) {
        // Label or cap blue check
        const r = lightData[idx], g = lightData[idx+1], b = lightData[idx+2];
        if (y < 120 && b > 100 && r < 80 && g < 100) {
          if (lightCapTop === -1) lightCapTop = y;
          lightCapBottom = y;
          if (x < lightCapLeft) lightCapLeft = x;
          if (x > lightCapRight) lightCapRight = x;
        }
      }
    }
  }
  console.log(`Light Cap: Top=${lightCapTop}, Bottom=${lightCapBottom}, Left=${lightCapLeft}, Right=${lightCapRight}, CenterX=${(lightCapLeft+lightCapRight)/2}, Width=${lightCapRight-lightCapLeft}`);

  console.log('--- Dark Bottle Cap / Dimensions ---');
  let darkCapTop = -1, darkCapBottom = -1;
  let darkCapLeft = 9999, darkCapRight = -1;
  for (let y = 0; y < darkInfo.height; y++) {
    for (let x = 0; x < darkInfo.width; x++) {
      const idx = (y * darkInfo.width + x) * 4;
      const r = darkData[idx], g = darkData[idx+1], b = darkData[idx+2];
      // Cap is deep royal blue (b > 70, r < 50, g < 70) around top
      if (y < 200 && b > 70 && r < 50 && g < 70) {
        if (darkCapTop === -1) darkCapTop = y;
        darkCapBottom = y;
        if (x < darkCapLeft) darkCapLeft = x;
        if (x > darkCapRight) darkCapRight = x;
      }
    }
  }
  console.log(`Dark Cap: Top=${darkCapTop}, Bottom=${darkCapBottom}, Left=${darkCapLeft}, Right=${darkCapRight}, CenterX=${(darkCapLeft+darkCapRight)/2}, Width=${darkCapRight-darkCapLeft}`);
}

measureBottle().catch(console.error);
