const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processImage() {
  const inputPath = path.join(__dirname, '../public/images/voltic-splash-hero.jpg');
  const outputPath = path.join(__dirname, '../public/images/voltic-splash-transparent.png');

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  // data is a buffer of RGBA pixels

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check if pixel is near white
    // If r, g, b are all high
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);
    const brightness = (r + g + b) / 3;

    // Background threshold
    if (minVal > 248) {
      // Pure white background -> fully transparent
      data[i + 3] = 0;
    } else if (minVal > 225 && (maxVal - minVal) < 15) {
      // Near white / grey vignette edge -> smooth feather to 0
      const factor = (248 - minVal) / (248 - 225); // 0 to 1
      data[i + 3] = Math.floor(255 * Math.pow(factor, 1.5));
    }
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png({ quality: 100 })
  .toFile(outputPath);

  console.log('Successfully generated transparent PNG:', outputPath);
}

processImage().catch(console.error);
