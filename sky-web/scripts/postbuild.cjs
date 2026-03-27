const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(__dirname, '../../nginx/html/sky-web');
const sourceIndex = path.join(distDir, 'index.html');

function ensureEntry(targetDirName) {
  const targetDir = path.join(distDir, targetDirName);
  const targetFile = path.join(targetDir, 'index.html');

  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(sourceIndex, targetFile);
}

if (!fs.existsSync(sourceIndex)) {
  throw new Error(`Missing build output: ${sourceIndex}`);
}

ensureEntry('customer');
ensureEntry('console');
