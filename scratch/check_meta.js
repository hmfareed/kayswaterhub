const sharp = require('sharp');
const path = require('path');

async function checkLightMeta() {
  const p = path.join(__dirname, '../public/images/voltic-splash-trimmed.png');
  const m = await sharp(p).metadata();
  console.log('Light trimmed meta:', m.width, 'x', m.height);
}

checkLightMeta().catch(console.error);
