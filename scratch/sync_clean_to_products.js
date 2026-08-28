const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const cleanDir = path.join(__dirname, '../public/images/products-clean');
const productsDir = path.join(__dirname, '../public/images/products');

async function syncToProducts() {
  const map = [
    { clean: 'bel-aqua-pack.png', targetJpg: 'bel-aqua-15x750ml.jpg', targetPng: 'bel-aqua-15x750ml.png' },
    { clean: 'voltic-pack.png', targetJpg: 'newvoltic15x500ml.jpg', targetPng: 'newvoltic15x500ml.png' },
    { clean: 'verna-500-pack.png', targetJpg: 'verna-15x500ml.jpg', targetPng: 'verna-15x500ml.png' },
    { clean: 'verna-750-pack.png', targetJpg: 'verna-16x750ml.jpg', targetPng: 'verna-16x750ml.png' },
    { clean: 'awake-pack.png', targetJpg: 'awake-16x750ml.jpg', targetPng: 'awake-16x750ml.png' },
    { clean: 'slemfit-pack.png', targetJpg: 'slemfit-16x500ml.jpg', targetPng: 'slemfit-16x500ml.png' },
    { clean: 'verna-jar-pack.png', targetJpg: 'verna-jar-15ltr.jpeg', targetPng: 'verna-jar-15ltr.png' },
    { clean: 'voltic-pocket-pack.png', targetJpg: 'voltic.jpg', targetPng: 'voltic.png' },
  ];

  for (const item of map) {
    const cleanPath = path.join(cleanDir, item.clean);
    if (!fs.existsSync(cleanPath)) continue;

    // 1. Copy transparent PNG
    fs.copyFileSync(cleanPath, path.join(productsDir, item.targetPng));

    // 2. Save pure white flattened JPG
    await sharp(cleanPath)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 98 })
      .toFile(path.join(productsDir, item.targetJpg));

    console.log(`Synced ${item.clean} to products dir!`);
  }
}

syncToProducts().catch(console.error);
