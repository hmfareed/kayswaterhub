const sharp = require('sharp');
const fs = require('fs');

async function inspectImg(name) {
  const { data, info } = await sharp('Bottle images/' + name)
    .raw()
    .toBuffer({ resolveWithObject: true });
  console.log('=== ' + name + ' (' + info.width + 'x' + info.height + ', channels:' + info.channels + ') ===');
  
  const corners = [
    { name: 'TL (0,0)', idx: 0 },
    { name: 'TR (w-1,0)', idx: (info.width - 1) * info.channels },
    { name: 'BL (0,h-1)', idx: (info.height - 1) * info.width * info.channels },
    { name: 'BR (w-1,h-1)', idx: ((info.height - 1) * info.width + (info.width - 1)) * info.channels },
    { name: 'TopMid (w/2, 0)', idx: Math.floor(info.width / 2) * info.channels },
    { name: 'LeftMid (0, h/2)', idx: (Math.floor(info.height / 2) * info.width) * info.channels },
    { name: 'RightMid (w-1, h/2)', idx: (Math.floor(info.height / 2) * info.width + info.width - 1) * info.channels },
    { name: 'Top (100, 100)', idx: (100 * info.width + 100) * info.channels },
  ];

  for (const c of corners) {
    console.log(c.name, 'RGB:', data[c.idx], data[c.idx+1], data[c.idx+2]);
  }
}

async function run() {
  await inspectImg('bel-aqua-15x750ml.jpg');
  await inspectImg('newvoltic15x500ml.jpg');
  await inspectImg('verna-15x500ml.jpg');
  await inspectImg('awake-16x750ml.jpg');
  await inspectImg('slemfit-16x500ml.jpg');
}

run().catch(console.error);
