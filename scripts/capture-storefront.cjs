const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.resolve(__dirname, '../docs/reference-screenshots');
const TEMP_USER_DATA = path.join(OUT_DIR, 'edge-profile-sf');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const prefix = process.argv[2] || 'before';

const pages = [
  { name: 'homepage', url: 'http://localhost:3000/' },
  { name: 'collection', url: 'http://localhost:3000/collections/lounge-co-ord-sets' },
  { name: 'product', url: 'http://localhost:3000/product/divi-embroidered-coord-set-green' }
];

console.log(`Capturing ${prefix} screenshots for storefront...`);

for (const p of pages) {
  const filename = `${p.name}-${prefix}.png`;
  const targetFile = path.join(OUT_DIR, filename);

  console.log(`Capturing ${filename} from ${p.url}...`);
  try {
    const cmd = `"${EDGE_PATH}" --headless --hide-scrollbars --window-size=1440,900 --user-data-dir="${TEMP_USER_DATA}" --screenshot="${targetFile}" "${p.url}"`;
    execSync(cmd, { stdio: 'ignore', timeout: 35000 });
    if (fs.existsSync(targetFile)) {
      const stats = fs.statSync(targetFile);
      console.log(`  -> Success: ${filename} (${Math.round(stats.size / 1024)} KB)`);
    } else {
      console.warn(`  -> File not created: ${filename}`);
    }
  } catch (err) {
    console.warn(`  -> Failed or timed out for ${filename}: ${err.message}`);
  }
}
