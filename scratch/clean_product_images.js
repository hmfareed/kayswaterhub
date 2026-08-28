const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const productsDir = path.join(__dirname, '../public/images/products');

async function cleanImageBackground(filename) {
  const filePath = path.join(productsDir, filename);
  if (!fs.existsSync(filePath)) return;

  const fileBuffer = fs.readFileSync(filePath);

  const { data, info } = await sharp(fileBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Process pixels to replace off-white/light-blue background with pure white
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const diff = maxVal - minVal;

    // Detect light studio background (greyish / bluish white)
    if (minVal > 195 && diff < 38 && (b >= r || minVal > 220)) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    } else if (minVal > 225 && diff < 45) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }

  const outputBuffer = await sharp(data, {
    raw: { width, height, channels: 4 }
  })
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .jpeg({ quality: 95 })
  .toBuffer();

  fs.writeFileSync(filePath, outputBuffer);
  console.log(`Cleaned background for: ${filename}`);
}

async function run() {
  const files = fs.readdirSync(productsDir);
  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
      if (!file.includes('.clean.')) {
        await cleanImageBackground(file);
      }
    }
  }
}

run().catch(console.error);
