const fs = require("fs");
const path = require("path");

const brainDir = "C:\\Users\\Mohammed Fareed\\.gemini\\antigravity-ide\\brain\\93cd5f9c-986a-4fdd-a6f9-473848965282";
const targetDir = path.join(__dirname, "..", "public", "images", "products");

const files = [
  { src: "belaqua_pack_clean_1787764987919.jpg", dest: "bel-aqua-15x750ml.jpg" },
  { src: "verna_pack_clean_1787765032862.jpg", dest: "verna-16x750ml.jpg" },
  { src: "voltic_pack_clean_1787765068094.jpg", dest: "newvoltic15x500ml.jpg" },
  { src: "awake_pack_clean_1787765105504.jpg", dest: "awake-16x750ml.jpg" },
];

for (const file of files) {
  const srcPath = path.join(brainDir, file.src);
  const destPath = path.join(targetDir, file.dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file.src} -> ${file.dest}`);
  } else {
    console.error(`Source file not found: ${srcPath}`);
  }
}
