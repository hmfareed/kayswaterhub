const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../Bottle images');
const outputDir = path.join(__dirname, '../public/images/products-clean');
const productsDir = path.join(__dirname, '../public/images/products');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function removeBackgroundBFS(inputFilename, outputFilename, options = {}) {
  const inputPath = path.join(inputDir, inputFilename);
  if (!fs.existsSync(inputPath)) {
    console.error(`Not found: ${inputPath}`);
    return;
  }

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const isBg = new Uint8Array(width * height);

  // Helper to get pixel RGB
  function getRGB(x, y) {
    const idx = (y * width + x) * channels;
    return [data[idx], data[idx + 1], data[idx + 2]];
  }

  // Sample border colors to know background color profile
  let borderR = 0, borderG = 0, borderB = 0, borderCount = 0;
  for (let x = 0; x < width; x++) {
    const [r1, g1, b1] = getRGB(x, 0);
    const [r2, g2, b2] = getRGB(x, height - 1);
    borderR += r1 + r2; borderG += g1 + g2; borderB += b1 + b2;
    borderCount += 2;
  }
  for (let y = 0; y < height; y++) {
    const [r1, g1, b1] = getRGB(0, y);
    const [r2, g2, b2] = getRGB(width - 1, y);
    borderR += r1 + r2; borderG += g1 + g2; borderB += b1 + b2;
    borderCount += 2;
  }
  const avgBgR = borderR / borderCount;
  const avgBgG = borderG / borderCount;
  const avgBgB = borderB / borderCount;

  console.log(`${inputFilename} -> Avg Border BG: (${avgBgR.toFixed(1)}, ${avgBgG.toFixed(1)}, ${avgBgB.toFixed(1)})`);

  // Check if pixel is background candidate
  function isBackgroundPixel(r, g, b, x, y) {
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const diff = maxVal - minVal;
    const brightness = (r + g + b) / 3;

    // Color distance to average background
    const distToBorderBg = Math.sqrt(
      Math.pow(r - avgBgR, 2) + Math.pow(g - avgBgG, 2) + Math.pow(b - avgBgB, 2)
    );

    // 1. Pure or near white / light grey
    if (minVal > 235 && diff < 30) return true;
    if (minVal > 220 && diff < 20) return true;

    // 2. Bel-Aqua / Voltic blue-grey studio gradient
    if (distToBorderBg < 55 && diff < 38 && brightness > 155) return true;
    if (distToBorderBg < 75 && diff < 28 && brightness > 165) return true;
    if (distToBorderBg < 90 && diff < 20 && brightness > 175) return true;

    // 3. Very low saturation studio light
    if (brightness > 180 && diff < 24) return true;
    if (brightness > 195 && diff < 32) return true;

    return false;
  }

  // BFS Queue
  const queue = [];

  // Enqueue all border pixels
  for (let x = 0; x < width; x++) {
    const p1 = 0 * width + x;
    const p2 = (height - 1) * width + x;
    visited[p1] = 1; isBg[p1] = 1; queue.push(p1);
    visited[p2] = 1; isBg[p2] = 1; queue.push(p2);
  }
  for (let y = 0; y < height; y++) {
    const p1 = y * width + 0;
    const p2 = y * width + (width - 1);
    if (!visited[p1]) { visited[p1] = 1; isBg[p1] = 1; queue.push(p1); }
    if (!visited[p2]) { visited[p2] = 1; isBg[p2] = 1; queue.push(p2); }
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    // 4-way neighbors
    const neighbors = [
      [cx - 1, cy],
      [cx + 1, cy],
      [cx, cy - 1],
      [cx, cy + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          const [nr, ng, nb] = getRGB(nx, ny);
          if (isBackgroundPixel(nr, ng, nb, nx, ny)) {
            isBg[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }
    }
  }

  // Apply alpha transparency
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const pIdx = y * width + x;

      if (isBg[pIdx]) {
        data[idx + 3] = 0; // Fully transparent
      } else {
        // Check if adjacent to background for slight feathering
        let bgNeighbors = 0;
        if (x > 0 && isBg[pIdx - 1]) bgNeighbors++;
        if (x < width - 1 && isBg[pIdx + 1]) bgNeighbors++;
        if (y > 0 && isBg[pIdx - width]) bgNeighbors++;
        if (y < height - 1 && isBg[pIdx + width]) bgNeighbors++;

        if (bgNeighbors > 0) {
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          const brightness = (r + g + b) / 3;
          if (brightness > 200) {
            data[idx + 3] = Math.floor(255 * (1 - (bgNeighbors * 0.18)));
          }
        }
      }
    }
  }

  const outputPath = path.join(outputDir, outputFilename);
  await sharp(data, {
    raw: { width, height, channels: 4 }
  })
  .png({ quality: 100, compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`Saved clean pack: ${outputPath}`);
}

async function processAll() {
  await removeBackgroundBFS('bel-aqua-15x750ml.jpg', 'bel-aqua-pack.png');
  await removeBackgroundBFS('newvoltic15x500ml.jpg', 'voltic-pack.png');
  await removeBackgroundBFS('verna-15x500ml.jpg', 'verna-500-pack.png');
  await removeBackgroundBFS('verna-16x750ml.jpg', 'verna-750-pack.png');
  await removeBackgroundBFS('awake-16x750ml.jpg', 'awake-pack.png');
  await removeBackgroundBFS('awake-12x750ml.jpg', 'awake-12x750-pack.png');
  await removeBackgroundBFS('slemfit-16x500ml.jpg', 'slemfit-pack.png');
  await removeBackgroundBFS('verna-jar-15ltr.jpeg', 'verna-jar-pack.png');
  await removeBackgroundBFS('voltic.jpg', 'voltic-pocket-pack.png');
  await removeBackgroundBFS('volticsingle.jpg', 'voltic-single.png');
  console.log('All backgrounds cleanly removed!');
}

processAll().catch(console.error);
