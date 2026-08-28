const sharp = require("sharp");
const path = require("path");

async function segmentProduct(inputPath, outputPath, options = {}) {
  const { topThreshold = 35, bottomThreshold = 25, sideThreshold = 30, feather = 1.0 } = options;
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();
  const raw = await image.ensureAlpha().raw().toBuffer();

  function getPixel(x, y) {
    const idx = (y * width + x) * 4;
    return [raw[idx], raw[idx + 1], raw[idx + 2], raw[idx + 3]];
  }

  // Top background reference
  let topBg = [0, 0, 0];
  let topCount = 0;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < 10; y++) {
      const p = getPixel(x, y);
      topBg[0] += p[0]; topBg[1] += p[1]; topBg[2] += p[2];
      topCount++;
    }
  }
  topBg = topBg.map(v => v / topCount);

  // Bottom background reference
  let botBg = [0, 0, 0];
  let botCount = 0;
  for (let x = 0; x < width; x++) {
    for (let y = height - 10; y < height; y++) {
      const p = getPixel(x, y);
      botBg[0] += p[0]; botBg[1] += p[1]; botBg[2] += p[2];
      botCount++;
    }
  }
  botBg = botBg.map(v => v / botCount);

  function isBg(p, bg, thresh) {
    const dist = Math.sqrt((p[0] - bg[0])**2 + (p[1] - bg[1])**2 + (p[2] - bg[2])**2);
    return dist < thresh;
  }

  // Find top edge per column x
  const topEdge = new Int32Array(width);
  for (let x = 0; x < width; x++) {
    let edgeY = 0;
    for (let y = 0; y < height * 0.7; y++) {
      const p = getPixel(x, y);
      if (!isBg(p, topBg, topThreshold)) {
        // Check 3 consecutive pixels to avoid single noise
        const p1 = getPixel(x, Math.min(height - 1, y + 1));
        const p2 = getPixel(x, Math.min(height - 1, y + 2));
        if (!isBg(p1, topBg, topThreshold) && !isBg(p2, topBg, topThreshold)) {
          edgeY = y;
          break;
        }
      }
    }
    topEdge[x] = edgeY;
  }

  // Find bottom edge per column x
  const bottomEdge = new Int32Array(width);
  for (let x = 0; x < width; x++) {
    let edgeY = height - 1;
    for (let y = height - 1; y > height * 0.5; y--) {
      const p = getPixel(x, y);
      if (!isBg(p, botBg, bottomThreshold)) {
        const p1 = getPixel(x, Math.max(0, y - 1));
        const p2 = getPixel(x, Math.max(0, y - 2));
        if (!isBg(p1, botBg, bottomThreshold) && !isBg(p2, botBg, bottomThreshold)) {
          edgeY = y;
          break;
        }
      }
    }
    bottomEdge[x] = edgeY;
  }

  // Find left edge per row y
  const leftEdge = new Int32Array(height);
  for (let y = 0; y < height; y++) {
    let edgeX = 0;
    for (let x = 0; x < width * 0.5; x++) {
      const p = getPixel(x, y);
      const bgRef = y < height / 2 ? topBg : botBg;
      if (!isBg(p, bgRef, sideThreshold)) {
        const p1 = getPixel(Math.min(width - 1, x + 1), y);
        if (!isBg(p1, bgRef, sideThreshold)) {
          edgeX = x;
          break;
        }
      }
    }
    leftEdge[y] = edgeX;
  }

  // Find right edge per row y
  const rightEdge = new Int32Array(height);
  for (let y = 0; y < height; y++) {
    let edgeX = width - 1;
    for (let x = width - 1; x > width * 0.5; x--) {
      const p = getPixel(x, y);
      const bgRef = y < height / 2 ? topBg : botBg;
      if (!isBg(p, bgRef, sideThreshold)) {
        const p1 = getPixel(Math.max(0, x - 1), y);
        if (!isBg(p1, bgRef, sideThreshold)) {
          edgeX = x;
          break;
        }
      }
    }
    rightEdge[y] = edgeX;
  }

  // Smooth the edges using moving median/average to avoid jagged contours
  const smoothTop = new Int32Array(width);
  const smoothBot = new Int32Array(width);
  for (let x = 0; x < width; x++) {
    let sumT = 0, sumB = 0, c = 0;
    for (let k = -2; k <= 2; k++) {
      const nx = Math.max(0, Math.min(width - 1, x + k));
      sumT += topEdge[nx];
      sumB += bottomEdge[nx];
      c++;
    }
    smoothTop[x] = Math.round(sumT / c);
    smoothBot[x] = Math.round(sumB / c);
  }

  // Construct alpha mask
  const alphaBuffer = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const insideY = y >= smoothTop[x] && y <= smoothBot[x];
      const insideX = x >= leftEdge[y] && x <= rightEdge[y];
      alphaBuffer[y * width + x] = (insideY && insideX) ? 255 : 0;
    }
  }

  // Feather alpha channel
  const smoothAlpha = await sharp(alphaBuffer, { raw: { width, height, channels: 1 } })
    .blur(feather)
    .toBuffer();

  const resultBuffer = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    resultBuffer[idx] = raw[idx];
    resultBuffer[idx + 1] = raw[idx + 1];
    resultBuffer[idx + 2] = raw[idx + 2];
    resultBuffer[idx + 3] = smoothAlpha[i];
  }

  await sharp(resultBuffer, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 5 })
    .png({ quality: 100 })
    .toFile(outputPath);

  console.log(`Created clean cut-out: ${outputPath}`);
}

async function main() {
  const bottleDir = path.join(__dirname, "..", "Bottle images");
  const targetDir = path.join(__dirname, "..", "public", "images", "products");

  await segmentProduct(
    path.join(bottleDir, "bel-aqua-15x750ml.jpg"),
    path.join(targetDir, "bel-aqua-15x750ml.png"),
    { topThreshold: 35, bottomThreshold: 22, sideThreshold: 25, feather: 0.8 }
  );

  await segmentProduct(
    path.join(bottleDir, "verna-16x750ml.jpg"),
    path.join(targetDir, "verna-16x750ml.png"),
    { topThreshold: 35, bottomThreshold: 22, sideThreshold: 25, feather: 0.8 }
  );

  await segmentProduct(
    path.join(bottleDir, "newvoltic15x500ml.jpg"),
    path.join(targetDir, "newvoltic15x500ml.png"),
    { topThreshold: 35, bottomThreshold: 22, sideThreshold: 25, feather: 0.8 }
  );

  await segmentProduct(
    path.join(bottleDir, "awake-16x750ml.jpg"),
    path.join(targetDir, "awake-16x750ml.png"),
    { topThreshold: 25, bottomThreshold: 20, sideThreshold: 22, feather: 0.8 }
  );
}

main().catch(console.error);
