const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function analyzeImages() {
  const darkPath = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const lightPath = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');

  const darkMeta = await sharp(darkPath).metadata();
  const lightMeta = await sharp(lightPath).metadata();

  console.log('Dark image size:', darkMeta.width, 'x', darkMeta.height);
  console.log('Light image size:', lightMeta.width, 'x', lightMeta.height);

  const { data: darkData } = await sharp(darkPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = darkMeta.width;
  const h = darkMeta.height;

  // Let's sample the 4 corners for background color
  const samplePoints = [
    { x: 5, y: 5 }, { x: w - 5, y: 5 },
    { x: 5, y: 150 }, { x: w - 5, y: 150 },
    { x: 5, y: h - 5 }, { x: w - 5, y: h - 5 }
  ];

  for (const pt of samplePoints) {
    const idx = (pt.y * w + pt.x) * 4;
    console.log(`Point (${pt.x}, ${pt.y}): R=${darkData[idx]}, G=${darkData[idx+1]}, B=${darkData[idx+2]}, A=${darkData[idx+3]}`);
  }
}

analyzeImages().catch(console.error);
