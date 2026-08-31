const sharp = require('sharp');
const path = require('path');

async function createFlawlessDarkSplash() {
  const inputDark = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const lightRef = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const outTransparent = path.join(__dirname, '../public/images/voltic-splash-dark-transparent.png');
  const outTrimmed = path.join(__dirname, '../public/images/voltic-splash-dark-trimmed.png');

  const lightMeta = await sharp(lightRef).metadata();
  const { data, info } = await sharp(inputDark).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Exact background color
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  for (let x = 0; x < width; x++) {
    for (let y of [0, 1, 2, 3, 4, height - 5, height - 4, height - 3, height - 2, height - 1]) {
      const idx = (y * width + x) * channels;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
      bgCount++;
    }
  }
  bgR /= bgCount; bgG /= bgCount; bgB /= bgCount;

  const outBuf = Buffer.alloc(width * height * channels);
  const centerX = 338.0;

  // Exact measured bottle profile (half-width radius at each Y in original image coordinates):
  function getExactBottleRadius(y) {
    if (y < 105) return 0;
    if (y <= 140) return 39.0; // Cap
    if (y <= 158) return 38.0; // Neck collar
    if (y <= 175) return 39.5; // Upper neck
    if (y <= 200) {
      // Widening to shoulders
      const t = (y - 175) / 25;
      return 39.5 + 22.5 * Math.sin(t * (Math.PI / 2)); // 39.5 -> 62.0
    }
    if (y <= 230) {
      // Widening to body
      const t = (y - 200) / 30;
      return 62.0 + 25.5 * Math.sin(t * (Math.PI / 2)); // 62.0 -> 87.5
    }
    if (y <= 660) {
      // Cylinder body & label
      return 87.5;
    }
    if (y <= 730) {
      // Base taper
      const t = (y - 660) / 70;
      return 87.5 - 10.0 * t;
    }
    return 0;
  }

  for (let y = 0; y < height; y++) {
    const bottleRadius = getExactBottleRadius(y);

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const colorDist = Math.sqrt(
        Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
      );

      // 1. Remove corner static bokeh circles
      const isTopLeftBokeh = (x < 110 && y < 120);
      const isBottomLeftBokeh = (x < 130 && y > 600);
      const isBottomRightBokeh = (x > 570 && y > 580);
      const isMidRightBokeh = (x > 610 && y >= 140 && y <= 310);

      if (isTopLeftBokeh || isBottomLeftBokeh || isBottomRightBokeh || isMidRightBokeh) {
        outBuf[idx] = 0;
        outBuf[idx + 1] = 0;
        outBuf[idx + 2] = 0;
        outBuf[idx + 3] = 0;
        continue;
      }

      // 2. Strict check above bottle cap
      if (y < 105) {
        if (colorDist < 12 && brightness < 15) {
          outBuf[idx] = 0;
          outBuf[idx + 1] = 0;
          outBuf[idx + 2] = 0;
          outBuf[idx + 3] = 0;
          continue;
        }
      }

      // 3. Inside exact bottle silhouette:
      const distFromCenter = Math.abs(x - centerX);
      const isInsideBottle = (bottleRadius > 0 && distFromCenter <= bottleRadius);

      if (isInsideBottle) {
        // Keep 100% solid inside the bottle (no holes, solid label and dark water)
        outBuf[idx] = r;
        outBuf[idx + 1] = g;
        outBuf[idx + 2] = b;
        outBuf[idx + 3] = 255;
      } else {
        // Outside bottle: Water splashes, droplets, and background
        if (colorDist < 8.5 && brightness < 14.0) {
          // Pure background outside bottle
          outBuf[idx] = 0;
          outBuf[idx + 1] = 0;
          outBuf[idx + 2] = 0;
          outBuf[idx + 3] = 0;
          continue;
        }

        let alpha = 0;
        if (colorDist < 26.0 && brightness < 30.0) {
          const t = Math.max(0, (colorDist - 7.5) / 18.5);
          alpha = Math.pow(t, 1.25);
        } else {
          alpha = Math.min(1.0, 0.4 + (colorDist / 35.0));
        }

        // Smooth bottom ripple fade
        if (y > 700) {
          const fade = Math.max(0, 1.0 - ((y - 700) / 90));
          alpha *= fade;
        }

        if (alpha <= 0.02) {
          outBuf[idx] = 0;
          outBuf[idx + 1] = 0;
          outBuf[idx + 2] = 0;
          outBuf[idx + 3] = 0;
        } else {
          outBuf[idx] = r;
          outBuf[idx + 1] = g;
          outBuf[idx + 2] = b;
          outBuf[idx + 3] = Math.floor(Math.max(0, Math.min(255, alpha * 255)));
        }
      }
    }
  }

  // SCALE: 1.248x for 1:1 match with light bottle
  const scale = 1.248;
  const scaledW = Math.round(width * scale);   // 877
  const scaledH = Math.round(height * scale);  // 1001

  const scaledBuffer = await sharp(outBuf, {
    raw: { width, height, channels: 4 }
  })
  .resize(scaledW, scaledH, {
    kernel: sharp.kernel.lanczos3
  })
  .png()
  .toBuffer();

  const targetW = lightMeta.width;  // 778
  const targetH = lightMeta.height; // 864

  const cropLeft = Math.round(centerX * scale - 398); // 24
  const cropTop = Math.round(105 * scale - 67);       // 64

  const finalBuffer = await sharp(scaledBuffer)
    .extract({
      left: Math.max(0, cropLeft),
      top: Math.max(0, cropTop),
      width: targetW,
      height: targetH
    })
    .png({ quality: 100 })
    .toBuffer();

  await sharp(finalBuffer).toFile(outTransparent);
  await sharp(finalBuffer).toFile(outTrimmed);

  console.log(`Successfully generated flawless dark splash:\n1. ${outTransparent}\n2. ${outTrimmed}`);
}

createFlawlessDarkSplash().catch(console.error);
