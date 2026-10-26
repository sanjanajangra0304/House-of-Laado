const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.resolve(__dirname, '../docs/reference-screenshots');
const TEMP_USER_DATA = path.join(OUT_DIR, 'edge-profile');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Pages to capture as required by STEP 1
const pages = [
  { name: 'homepage', url: 'https://thejaipurloom.com/' },
  { name: 'collection_filters', url: 'https://thejaipurloom.com/collections/suit-sets' },
  { name: 'product_page', url: 'https://thejaipurloom.com/products/gulabi-anarkali-suit-set' },
  { name: 'search_results', url: 'https://thejaipurloom.com/search?q=cotton' },
  { name: 'cart_page', url: 'https://thejaipurloom.com/cart' },
  { name: 'contact_page', url: 'https://thejaipurloom.com/pages/contact' },
  { name: 'policy_shipping', url: 'https://thejaipurloom.com/pages/shipping-policy' },
  { name: 'login_account', url: 'https://thejaipurloom.com/account/login' },
  { name: 'not_found_404', url: 'https://thejaipurloom.com/404' }
];

const breakpoints = [
  { label: '1440', width: 1440, height: 960 },
  { label: '1024', width: 1024, height: 800 },
  { label: '768', width: 768, height: 1024 },
  { label: '390', width: 390, height: 844 }
];

console.log('Capturing screenshots for reference store at breakpoints [1440, 1024, 768, 390]...');

for (const page of pages) {
  for (const bp of breakpoints) {
    const filename = `${page.name}-${bp.label}.png`;
    const targetFile = path.join(OUT_DIR, filename);

    if (fs.existsSync(targetFile)) {
      console.log(`[Already Exists] ${filename}`);
      continue;
    }

    console.log(`Capturing ${filename} (${bp.width}x${bp.height}) from ${page.url}...`);
    try {
      const cmd = `"${EDGE_PATH}" --headless --hide-scrollbars --window-size=${bp.width},${bp.height} --user-data-dir="${TEMP_USER_DATA}" --screenshot="${targetFile}" "${page.url}"`;
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
}

console.log('Screenshot capture process finished.');
