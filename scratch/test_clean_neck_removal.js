const sharp = require('sharp');
const path = require('path');

async function testCleanNeckRemoval() {
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
  console.log(`Measured background color: R=${bgR.toFixed(2)}, G=${bgG.toFixed(2)}, B=${bgB.toFixed(2)}`);

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

      // 1. Remove 4 corner static bokeh circles
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

      // 2. Strict check above bottle cap: above y = 105, only splash droplets exist
      if (y < 105) {
        if (colorDist < 12 && brightness < 15) {
          outBuf[idx] = 0;
          outBuf[idx + 1] = 0;
          outBuf[idx + 2] = 0;
          outBuf[idx + 3] = 0;
          continue;
        }
      }

      const distFromCenter = Math.abs(x - centerX);

      // 3. CAP & NECK & SHOULDERS (y from 105 to 260):
      // NO geometric radius polygon! ONLY real cap blue or glass highlights!
      if (y >= 105 && y < 260) {
        // Is cap blue:
        const isCapBlue = (y <= 150 && distFromCenter <= 41 && b > 60 && (b - r) > 35);
        // Is glass highlight or refraction:
        const isGlassHighlight = (distFromCenter <= 90 && (colorDist >= 16.0 || brightness >= 20.0));

        if (isCapBlue) {
          outBuf[idx] = r;
          outBuf[idx + 1] = g;
          outBuf[idx + 2] = b;
          outBuf[idx + 3] = 255;
          continue;
        } else if (isGlassHighlight) {
          // Glass reflection: clean alpha
          const alpha = Math.min(1.0, 0.4 + (colorDist / 35.0));
          outBuf[idx] = r;
          outBuf[idx + 1] = g;
          outBuf[idx + 2] = b;
          outBuf[idx + 3] = Math.floor(Math.max(0, Math.min(255, alpha * 255)));
          continue;
        } else {
          // If neither cap blue nor glass highlight, outside/inside background is 100% transparent!
          // NO shadow around neck/cap!
          if (colorDist < 12.0 && brightness < 16.0) {
            outBuf[idx] = 0;
            outBuf[idx + 1] = 0;
            outBuf[idx + 2] = 0;
            outBuf[idx + 3] = 0;
            continue;
          }
        }
      }

      // 4. LOWER BOTTLE BODY & LABEL (y from 260 to 660):
      // Inside cylinder (distFromCenter <= 87.5), keep solid 255 so the VOLTIC label & dark body are solid
      if (y >= 260 && y <= 660 && distFromCenter <= 87.5) {
        outBuf[idx] = r;
        outBuf[idx + 1] = g;
        outBuf[idx + 2] = b;
        outBuf[idx + 3] = 255;
        continue;
      }

      // 5. BASE (y from 660 to 730):
      const baseRadius = 87.5 - 12.0 * ((y - 660) / 70);
      if (y > 660 && y <= 730 && distFromCenter <= baseRadius && (colorDist > 8.0 || brightness > 12.0)) {
        outBuf[idx] = r;
        outBuf[idx + 1] = g;
        outBuf[idx + 2] = b;
        outBuf[idx + 3] = 255;
        continue;
      }

      // 6. ALL WATER SPLASHES & DROPLETS (Everywhere outside the bottle):
      if (colorDist < 8.0 && brightness < 14.0) {
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

  console.log('Saved 100% clean dark splash without ANY shadows to both assets!');
}

testCleanNeckRemoval().catch(console.error);
