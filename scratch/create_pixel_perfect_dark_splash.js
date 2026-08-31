const sharp = require('sharp');
const path = require('path');

async function createPixelPerfectDarkSplash() {
  const inputDark = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const lightRef = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const outTransparent = path.join(__dirname, '../public/images/voltic-splash-dark-transparent.png');
  const outTrimmed = path.join(__dirname, '../public/images/voltic-splash-dark-trimmed.png');

  const lightMeta = await sharp(lightRef).metadata();
  const { data, info } = await sharp(inputDark).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`Original dark input: ${width}x${height}`);

  // Sample background color
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
  const centerX = 338.5; // measured dark cap center

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

      // 1. Remove the 4 corner static bokeh circles (replaced by glowing CSS orbs)
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

      // 2. Strict transparency above bottle cap: above y = 105, only genuine splash droplets survive
      if (y < 105) {
        if (colorDist < 12 && brightness < 15) {
          outBuf[idx] = 0;
          outBuf[idx + 1] = 0;
          outBuf[idx + 2] = 0;
          outBuf[idx + 3] = 0;
          continue;
        }
      }

      // 3. Precise Bottle Silhouette
      const distFromCenter = Math.abs(x - centerX);
      let bottleRadius = 0;

      if (y >= 105 && y <= 142) {
        // Cap main body
        bottleRadius = 41.5;
      } else if (y > 142 && y <= 158) {
        // Cap neck thread
        bottleRadius = 37.5;
      } else if (y > 158 && y <= 235) {
        // Shoulders & neck widening
        const t = (y - 158) / 77;
        bottleRadius = 37.5 + 51.0 * Math.sin(t * (Math.PI / 2));
      } else if (y > 235 && y <= 665) {
        // Body cylinder & label
        bottleRadius = 88.5;
      } else if (y > 665 && y <= 730) {
        // Base taper
        const t = (y - 665) / 65;
        bottleRadius = 88.5 - 11.5 * t;
      }

      const isInsideBottle = (bottleRadius > 0 && distFromCenter <= bottleRadius);

      if (isInsideBottle) {
        // Inside bottle: solid opaque 255
        outBuf[idx] = r;
        outBuf[idx + 1] = g;
        outBuf[idx + 2] = b;
        outBuf[idx + 3] = 255;
      } else {
        // Splashes, droplets, highlights
        let alpha = 0;

        if (colorDist < 10 && brightness < 14) {
          alpha = 0;
        } else if (colorDist < 30 && brightness < 32) {
          const t = Math.max(0, (colorDist - 8) / 22);
          alpha = Math.pow(t, 1.25);
        } else {
          alpha = Math.min(1.0, 0.4 + (colorDist / 40));
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

  // SCALE: 1.248x to match light bottle height & width 1:1
  const scale = 1.248;
  const scaledW = Math.round(width * scale);   // 703 * 1.248 = 877
  const scaledH = Math.round(height * scale);  // 802 * 1.248 = 1001

  console.log(`Rescaling with scale=${scale}: ${scaledW}x${scaledH}`);

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

  // Dark cap center X scaled: 338.5 * 1.248 = 422.45
  // Target light cap center X: 398 -> cropLeft = 422.45 - 398 = 24.45 (~24px)
  // Dark cap top scaled: 105 * 1.248 = 131.04
  // Target light cap top: 67 -> cropTop = 131.04 - 67 = 64.04 (~64px)

  const cropLeft = Math.round(338.5 * scale - 398); // 24
  const cropTop = Math.round(105 * scale - 67);     // 64

  console.log(`Extracting exact window: left=${cropLeft}, top=${cropTop}, width=${targetW}, height=${targetH}`);

  const finalBuffer = await sharp(scaledBuffer)
    .extract({
      left: Math.max(0, cropLeft),
      top: Math.max(0, cropTop),
      width: targetW,
      height: targetH
    })
    .png({ quality: 100 })
    .toBuffer();

  // Save to BOTH files so whichever is loaded is pixel-perfect!
  await sharp(finalBuffer).toFile(outTransparent);
  await sharp(finalBuffer).toFile(outTrimmed);

  console.log(`Saved pixel-perfect dark splash to:\n1. ${outTransparent}\n2. ${outTrimmed}`);
}

createPixelPerfectDarkSplash().catch(console.error);
