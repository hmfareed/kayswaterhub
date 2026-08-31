const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processDarkSplash() {
  const inputPath = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const lightTrimmedPath = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const outputPath = path.join(__dirname, '../public/images/voltic-splash-dark-transparent.png');

  // Load light trimmed metadata for target dimensions & positioning
  const lightMeta = await sharp(lightTrimmedPath).metadata();
  console.log('Light trimmed dimensions:', lightMeta.width, 'x', lightMeta.height);

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Let's create an alpha mask by analyzing pixel brightness & color distance from the dark navy backdrop
  // The dark background has very low brightness (typically R < 10, G < 20, B < 35)
  // Water splashes and bottle highlights have high brightness or strong blue/white color
  const outData = Buffer.from(data);

  // Sample corner background
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  for (let x = 0; x < width; x++) {
    for (let y of [0, 1, 2, height - 3, height - 2, height - 1]) {
      const idx = (y * width + x) * channels;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
      bgCount++;
    }
  }
  bgR /= bgCount;
  bgG /= bgCount;
  bgB /= bgCount;
  console.log('Background baseline RGB:', bgR, bgG, bgB);

  // For each pixel, calculate distance from background & brightness
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxVal = Math.max(r, g, b);
      const colorDist = Math.sqrt(
        Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
      );

      // Distance from dark navy background
      // If brightness is very low (< 12) and color is near background -> fully transparent
      if (brightness < 12 && colorDist < 16) {
        outData[idx + 3] = 0;
      } else if (brightness < 28 && colorDist < 30) {
        // Smooth feather
        const t = (colorDist - 10) / 20;
        const alpha = Math.max(0, Math.min(255, Math.floor(255 * Math.pow(Math.max(0, t), 1.4))));
        outData[idx + 3] = alpha;
      } else {
        outData[idx + 3] = 255;
      }
    }
  }

  // Save intermediate transparent
  const intermediateBuffer = await sharp(outData, {
    raw: { width, height, channels: 4 }
  })
  .trim() // Trim transparent edges
  .png()
  .toBuffer();

  const trimmedMeta = await sharp(intermediateBuffer).metadata();
  console.log('Trimmed dark dimensions:', trimmedMeta.width, 'x', trimmedMeta.height);

  // Resize trimmed dark bottle to fit into the exact 778 x 864 container with transparent padding
  // so it matches voltic-splash-trimmed.png 1:1!
  await sharp(intermediateBuffer)
    .resize({
      width: lightMeta.width,
      height: lightMeta.height,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ quality: 100 })
    .toFile(outputPath);

  console.log('Saved transparent dark splash image to:', outputPath);
}

processDarkSplash().catch(console.error);
