const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../Bottle images');
const outputDir = path.join(__dirname, '../public/images/products-clean');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert image to transparent PNG by detecting the background from the corners / borders
async function removeBackgroundAndSave(inputFilename, outputFilename, threshold = 230) {
  const inputPath = path.join(inputDir, inputFilename);
  const outputPath = path.join(outputDir, outputFilename);

  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    return;
  }

  const image = sharp(inputPath);
  const meta = await image.metadata();

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Let's sample background color from the 4 corners
  const samplePixels = [
    0, // top-left
    (width - 1) * channels, // top-right
    (height - 1) * width * channels, // bottom-left
    ((height - 1) * width + (width - 1)) * channels, // bottom-right
  ];

  let bgR = 0, bgG = 0, bgB = 0;
  for (const p of samplePixels) {
    bgR += data[p];
    bgG += data[p + 1];
    bgB += data[p + 2];
  }
  bgR /= samplePixels.length;
  bgG /= samplePixels.length;
  bgB /= samplePixels.length;

  console.log(`${inputFilename} sampled BG: (${bgR.toFixed(1)}, ${bgG.toFixed(1)}, ${bgB.toFixed(1)})`);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const minRGB = Math.min(r, g, b);
      const maxRGB = Math.max(r, g, b);
      const diff = maxRGB - minRGB;

      // Check if this pixel is close to white or background color
      const distToBg = Math.sqrt(
        Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
      );

      // Distance from borders
      const isNearEdge = x < 15 || x > width - 15 || y < 15 || y > height - 15;

      if ((minRGB > 240 && diff < 20) || (minRGB > 220 && diff < 15 && distToBg < 40)) {
        // High confidence background
        data[idx + 3] = 0;
      } else if (distToBg < 28 && diff < 25) {
        data[idx + 3] = 0;
      } else if (minRGB > 210 && diff < 12) {
        // Light grey/white studio gradient
        const alpha = Math.max(0, Math.min(255, Math.floor((240 - minRGB) * 8.5)));
        data[idx + 3] = alpha;
      }
    }
  }

  // Save as high-res PNG
  await sharp(data, {
    raw: { width, height, channels: 4 }
  })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

  console.log(`Generated: ${outputPath}`);
}

async function processAll() {
  await removeBackgroundAndSave('newvoltic15x500ml.jpg', 'voltic-pack.png', 230);
  await removeBackgroundAndSave('bel-aqua-15x750ml.jpg', 'bel-aqua-pack.png', 230);
  await removeBackgroundAndSave('verna-15x500ml.jpg', 'verna-500-pack.png', 230);
  await removeBackgroundAndSave('verna-16x750ml.jpg', 'verna-750-pack.png', 230);
  await removeBackgroundAndSave('awake-16x750ml.jpg', 'awake-pack.png', 230);
  await removeBackgroundAndSave('awake-12x750ml.jpg', 'awake-12x750-pack.png', 230);
  await removeBackgroundAndSave('slemfit-16x500ml.jpg', 'slemfit-pack.png', 230);
  await removeBackgroundAndSave('verna-jar-15ltr.jpeg', 'verna-jar-pack.png', 230);
  await removeBackgroundAndSave('voltic.jpg', 'voltic-pocket-pack.png', 230);
  await removeBackgroundAndSave('volticsingle.jpg', 'voltic-single.png', 230);
  console.log('All product images processed successfully!');
}

processAll().catch(console.error);
