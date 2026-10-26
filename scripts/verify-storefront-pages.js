const urls = [
  "http://localhost:3000/",
  "http://localhost:3000/shop",
  "http://localhost:3000/search?q=kurta",
  "http://localhost:3000/cart",
  "http://localhost:3000/checkout",
  "http://localhost:3000/track-order",
  "http://localhost:3000/account",
  "http://localhost:3000/admin",
  "http://localhost:3000/admin/orders",
  "http://localhost:3000/admin/products",
  "http://localhost:5000/api/v1/health",
  "http://localhost:5000/api/v1/products",
];

async function verifyPages() {
  console.log("--- Checking Live Storefront & API Routes ---");
  let allPassed = true;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "HealthChecker/1.0" } });
      const text = await res.text();
      if (res.status === 200) {
        console.log(`[PASS 200 OK] ${url} (length: ${text.length} bytes)`);
      } else {
        console.log(`[WARN ${res.status}] ${url}`);
        allPassed = false;
      }
    } catch (err) {
      console.error(`[FAIL] ${url}: ${err.message}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("\nAll storefront and API routes are healthy and responding 200 OK!");
    process.exit(0);
  } else {
    console.log("\nSome routes did not respond with 200 OK.");
    process.exit(1);
  }
}

verifyPages();
