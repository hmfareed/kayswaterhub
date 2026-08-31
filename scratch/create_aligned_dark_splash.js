const sharp = require('sharp');
const path = require('path');

async function createPerfectDarkSplash() {
  const inputDark = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const lightRef = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const outputClean = path.join(__dirname, '../public/images/voltic-splash-dark-trimmed.png');

  const lightMeta = await sharp(lightRef).metadata();
  const { data, info } = await sharp(inputDark).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`Original dark dimensions: ${width}x${height}`);

  // Sample exact corner background
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
  bgR /= bgCount; bgG /= bgCount; bgB /= bgCount;
  console.log(`Measured background color: R=${bgR.toFixed(2)}, G=${bgG.toFixed(2)}, B=${bgB.toFixed(2)}`);

  const outBuf = Buffer.alloc(width * height * channels);
  const centerX = 337.5;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const distFromCenter = Math.abs(x - centerX);

      // 1. Remove the 4 corner static bokeh circles (replaced by glowing CSS orbs)
      // Top-left bokeh orb
      const isTopLeftBokeh = (x < 105 && y < 115);
      // Bottom-left bokeh orb
      const isBottomLeftBokeh = (x < 120 && y > 620);
      // Bottom-right bokeh orb
      const isBottomRightBokeh = (x > 585 && y > 600);
      // Mid-right bokeh orb
      const isMidRightBokeh = (x > 615 && y >= 150 && y <= 290);

      if (isTopLeftBokeh || isBottomLeftBokeh || isBottomRightBokeh || isMidRightBokeh) {
        outBuf[idx] = 0;
        outBuf[idx + 1] = 0;
        outBuf[idx + 2] = 0;
        outBuf[idx + 3] = 0;
        continue;
      }

      // 2. Precise Bottle Silhouette (solid bottle interior)
      let bottleRadius = 0;
      if (y >= 105 && y <= 159) {
        // Cap
        bottleRadius = 42.5;
      } else if (y > 159 && y <= 245) {
        // Neck & shoulders
        const t = (y - 159) / 86;
        bottleRadius = 42.5 + 45.5 * Math.sin(t * (Math.PI / 2));
      } else if (y > 245 && y <= 665) {
        // Cylinder Body & Label
        bottleRadius = 88;
      } else if (y > 665 && y <= 695) {
        // Base
        const t = (y - 665) / 30;
        bottleRadius = 88 - 10 * t;
      }

      const isInsideBottle = (bottleRadius > 0 && distFromCenter <= bottleRadius);

      if (isInsideBottle) {
        // Inside bottle: keep fully opaque
        outBuf[idx] = r;
        outBuf[idx + 1] = g;
        outBuf[idx + 2] = b;
        outBuf[idx + 3] = 255;
      } else {
        // Outside bottle: Water splash, droplets, and background
        const colorDist = Math.sqrt(
          Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
        );

        let alpha = 0;
        if (colorDist < 10 && brightness < 15) {
          alpha = 0;
        } else if (colorDist < 28 && brightness < 32) {
          const t = Math.max(0, (colorDist - 8) / 20);
          alpha = Math.pow(t, 1.3);
        } else {
          alpha = Math.min(1.0, 0.35 + (colorDist / 45));
        }

        // Smoothly fade bottom reflection
        if (y > 695) {
          const fade = Math.max(0, 1.0 - ((y - 695) / 95));
          alpha *= fade;
        }

        if (alpha <= 0.02) {
          outBuf[idx] = 0;
          outBuf[idx + 1] = 0;
          outBuf[idx + 2] = 0;
          outBuf[idx + 3] = 0;
        } else {
          // Decontaminate background dark tint from water edges
          let outR = r;
          let outG = g;
          let outB = b;

          if (alpha < 0.95) {
            outR = Math.min(255, Math.max(0, Math.round((r - bgR * (1 - alpha)) / alpha)));
            outG = Math.min(255, Math.max(0, Math.round((g - bgG * (1 - alpha)) / alpha)));
            outB = Math.min(255, Math.max(0, Math.round((b - bgB * (1 - alpha)) / alpha)));
          }

          outBuf[idx] = outR;
          outBuf[idx + 1] = outG;
          outBuf[idx + 2] = outB;
          outBuf[idx + 3] = Math.floor(Math.max(0, Math.min(255, alpha * 255)));
        }
      }
    }
  }

  // Scaling & Positioning to match voltic-splash-trimmed.png (778 x 864)
  const scale = 1.15;
  const scaledW = Math.round(width * scale); // 808
  const scaledH = Math.round(height * scale); // 922

  console.log(`Rescaling to: ${scaledW}x${scaledH}`);

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

  const darkScaledCapCenterX = Math.round(centerX * scale); // ~388
  const darkScaledCapTop = Math.round(105 * scale); // ~121

  // Target cap center is 398, target cap top is 67
  const padLeft = Math.max(0, 398 - darkScaledCapCenterX); // ~10
  const cropTop = Math.max(0, Math.round(darkScaledCapTop - 67)); // ~54

  console.log(`Alignment params: padLeft=${padLeft}, cropTop=${cropTop}, targetW=${targetW}, targetH=${targetH}`);

  // Step 1: Extend left padding
  const extendedBuffer = await sharp(scaledBuffer)
    .extend({
      top: 0,
      bottom: 0,
      left: padLeft,
      right: 0,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // Step 2: Extract exact targetW x targetH
  await sharp(extendedBuffer)
    .extract({
      left: 0,
      top: cropTop,
      width: targetW,
      height: targetH
    })
    .png({ quality: 100 })
    .toFile(outputClean);

  const finalMeta = await sharp(outputClean).metadata();
  console.log(`Final output generated: ${finalMeta.width}x${finalMeta.height} at: ${outputClean}`);
}

createPerfectDarkSplash().catch(console.error);
