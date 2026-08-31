const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createAlignedDarkSplash() {
  const inputDark = path.join(__dirname, '../public/images/voltic-splash-dark.png');
  const lightRef = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const outputClean = path.join(__dirname, '../public/images/voltic-splash-dark-trimmed.png');

  const lightMeta = await sharp(lightRef).metadata();
  const { data, info } = await sharp(inputDark).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`Processing dark image: ${width}x${height}`);

  // 1. Identify stray bokeh blobs outside the main splash area
  // The main splash & bottle are within roughly x in [40, width - 40] and attached to bottle structure.
  // Let's create an alpha buffer
  const alphaMap = new Float32Array(width * height);
  const solidMap = new Uint8Array(width * height);

  // Background color sampling
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

  // Compute bottle center line
  const centerX = 336.5;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const pIdx = y * width + x;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const distFromCenter = Math.abs(x - centerX);

      // Check if this pixel is inside the main bottle cylinder
      // The bottle is roughly within 65px of center between y = 105 and y = 680
      const isInsideBottle = (y >= 105 && y <= 660 && distFromCenter <= 62);

      // Distance from dark background
      const colorDist = Math.sqrt(
        Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
      );

      // Remove the 4 corner bokeh dots:
      // Top-left bokeh orb: x < 80, y < 80
      // Bottom-left bokeh orb: x < 90, y > 700
      // Bottom-right bokeh orb: x > 620, y > 680
      // Mid-right bokeh orb: x > 650, y in [180, 260]
      const isCornerBokeh =
        (x < 80 && y < 80) ||
        (x < 90 && y > 680) ||
        (x > 620 && y > 660) ||
        (x > 640 && y >= 170 && y <= 270);

      if (isCornerBokeh) {
        alphaMap[pIdx] = 0;
        continue;
      }

      if (isInsideBottle) {
        // Bottle interior is solid
        alphaMap[pIdx] = 1.0;
        solidMap[pIdx] = 1;
      } else {
        // Water splash / droplets
        if (brightness < 10 && colorDist < 14) {
          alphaMap[pIdx] = 0;
        } else if (brightness < 32 && colorDist < 35) {
          // Smooth transition
          const t = Math.max(0, (colorDist - 12) / 23);
          alphaMap[pIdx] = Math.pow(t, 1.3);
        } else {
          alphaMap[pIdx] = Math.min(1.0, (brightness / 45) + (colorDist / 50));
        }

        // Feather bottom reflection smoothly so there is no rectangular cut
        if (y > 700) {
          const fade = Math.max(0, 1.0 - ((y - 700) / 95));
          alphaMap[pIdx] *= fade;
        }
      }
    }
  }

  // Build the processed RGBA buffer
  const outBuf = Buffer.alloc(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const pIdx = y * width + x;
      const a = alphaMap[pIdx];

      outBuf[idx] = data[idx];
      outBuf[idx + 1] = data[idx + 1];
      outBuf[idx + 2] = data[idx + 2];
      outBuf[idx + 3] = Math.floor(Math.max(0, Math.min(255, a * 255)));
    }
  }

  // Scaling to match light image
  // Scale factor = 104 / 85 = 1.2235
  const scale = 104 / 85;
  const scaledW = Math.round(width * scale);
  const scaledH = Math.round(height * scale);

  console.log(`Rescaling dark splash to: ${scaledW}x${scaledH}`);

  const scaledBuffer = await sharp(outBuf, {
    raw: { width, height, channels: 4 }
  })
  .resize(scaledW, scaledH, {
    kernel: sharp.kernel.lanczos3
  })
  .png()
  .toBuffer();

  // Composite onto the light canvas (778 x 864)
  // Target capTop is 65, target center is 398
  const scaledCapTop = Math.round(105 * scale); // ~128
  const scaledCapCenter = Math.round(336.5 * scale); // ~412

  const leftOffset = Math.round(398 - scaledCapCenter);
  const topOffset = Math.round(65 - scaledCapTop);

  console.log(`Offsets for perfect alignment: Left=${leftOffset}, Top=${topOffset}`);

  // Since scaledBuffer (860x981) has leftOffset = -14 and topOffset = -63,
  // we can extract the exact 778x864 window from scaledBuffer:
  const cropLeft = Math.max(0, -leftOffset);
  const cropTop = Math.max(0, -topOffset);

  console.log(`Cropping window: left=${cropLeft}, top=${cropTop}, width=${lightMeta.width}, height=${lightMeta.height}`);

  await sharp(scaledBuffer)
    .extract({
      left: cropLeft,
      top: cropTop,
      width: lightMeta.width,
      height: lightMeta.height
    })
    .png({ quality: 100 })
    .toFile(outputClean);

  console.log('Successfully saved aligned dark splash to:', outputClean);
}

createAlignedDarkSplash().catch(console.error);
