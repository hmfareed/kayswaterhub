const sharp = require('sharp');
const path = require('path');

async function createPerfectShadowFreeSplash() {
  const inputDark = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const lightRef = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const outTransparent = path.join(__dirname, '../public/images/voltic-splash-dark-transparent.png');
  const outTrimmed = path.join(__dirname, '../public/images/voltic-splash-dark-trimmed.png');

  const lightMeta = await sharp(lightRef).metadata();
  const { data, info } = await sharp(inputDark).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Background baseline color
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
  console.log(`Background baseline: R=${bgR.toFixed(2)}, G=${bgG.toFixed(2)}, B=${bgB.toFixed(2)}`);

  const outBuf = Buffer.alloc(width * height * channels);
  const centerX = 338.0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const colorDist = Math.sqrt(
        Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
      );

      // 1. Remove 4 corner static bokeh blobs
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

      // 2. Above cap: strictly transparent for background
      if (y < 105) {
        if (colorDist < 12 && brightness < 15) {
          outBuf[idx] = 0;
          outBuf[idx + 1] = 0;
          outBuf[idx + 2] = 0;
          outBuf[idx + 3] = 0;
          continue;
        }
      }

      // 3. Exact Label Region (y in [355..475], x in [250..425]):
      // Within this exact rectangle, keep solid so the VOLTIC dark navy label and emblem are 100% opaque
      const isInsideLabel = (y >= 355 && y <= 475 && x >= 250 && x <= 425);
      if (isInsideLabel) {
        outBuf[idx] = r;
        outBuf[idx + 1] = g;
        outBuf[idx + 2] = b;
        outBuf[idx + 3] = 255;
        continue;
      }

      // 4. Blue Cap (y in [105..145], x in [295..380]):
      // Only keep actual blue cap pixels (b > 50 && b - r > 25)
      const isCapArea = (y >= 105 && y <= 145 && x >= 295 && x <= 380);
      if (isCapArea && b > 50 && (b - r) > 25) {
        outBuf[idx] = r;
        outBuf[idx + 1] = g;
        outBuf[idx + 2] = b;
        outBuf[idx + 3] = 255;
        continue;
      }

      // 5. All Other Pixels (Neck, shoulders, bottle sides, water splashes):
      // Pure background: colorDist < 8.0 and brightness < 14.0 -> 100% transparent!
      if (colorDist < 8.0 && brightness < 14.0) {
        outBuf[idx] = 0;
        outBuf[idx + 1] = 0;
        outBuf[idx + 2] = 0;
        outBuf[idx + 3] = 0;
        continue;
      }

      // Smooth feathering for translucent highlights & splashes
      let alpha = 0;
      if (colorDist < 24.0 && brightness < 28.0) {
        const t = Math.max(0, (colorDist - 7.5) / 16.5);
        alpha = Math.pow(t, 1.25);
      } else {
        alpha = Math.min(1.0, 0.45 + (colorDist / 30.0));
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

  // SCALE: 1.248x to match light bottle 1:1
  const scale = 1.248;
  const scaledW = Math.round(width * scale);
  const scaledH = Math.round(height * scale);

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

  console.log('Saved 100% clean, shadow-free dark splash to both assets!');
}

createPerfectShadowFreeSplash().catch(console.error);
