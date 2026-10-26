import http from "http";

const API_BASE = "http://localhost:5000";
const STOREFRONT_BASE = "http://localhost:3000";

const CHECKS = [
  // Backend API Endpoints
  {
    name: "API Health Telemetry",
    url: `${API_BASE}/api/v1/health`,
    validate: (status, body) => status === 200 && body.status === "OK" && body.services?.database === "connected",
  },
  {
    name: "Category Hierarchy",
    url: `${API_BASE}/api/v1/categories`,
    validate: (status, body) => status === 200 && Array.isArray(body.data) && body.data.length > 0,
  },
  {
    name: "Catalogue Pagination",
    url: `${API_BASE}/api/v1/products?limit=4`,
    validate: (status, body) => status === 200 && Array.isArray(body.data) && body.data.length > 0,
  },
  {
    name: "PIN Code Serviceability",
    url: `${API_BASE}/api/v1/orders/serviceability/302001`,
    validate: (status, body) => status === 200 && body.success === true,
  },
  {
    name: "Editorial Journal Posts",
    url: `${API_BASE}/api/v1/content/blog`,
    validate: (status, body) => status === 200 && Array.isArray(body.data),
  },
  {
    name: "Policy Content Delivery",
    url: `${API_BASE}/api/v1/content/pages/shipping-policy`,
    validate: (status, body) => status === 200 && body.data?.title?.includes("Shipping"),
  },

  // Storefront Frontend Routes
  {
    name: "Storefront Homepage",
    url: `${STOREFRONT_BASE}/`,
    validate: (status, body, text) => status === 200 && (text.includes("House of Laado") || text.includes("Jaipur")),
  },
  {
    name: "Storefront Shop & Filters",
    url: `${STOREFRONT_BASE}/shop`,
    validate: (status, body, text) => status === 200 && text.length > 1000,
  },
  {
    name: "Storefront Cart Experience",
    url: `${STOREFRONT_BASE}/cart`,
    validate: (status, body, text) => status === 200,
  },
  {
    name: "Storefront Checkout Flow",
    url: `${STOREFRONT_BASE}/checkout`,
    validate: (status, body, text) => status === 200,
  },
  {
    name: "Storefront Order Tracking",
    url: `${STOREFRONT_BASE}/track-order`,
    validate: (status, body, text) => status === 200,
  },
  {
    name: "Storefront Customer Portal",
    url: `${STOREFRONT_BASE}/account`,
    validate: (status, body, text) => status === 200,
  },
  {
    name: "Storefront Admin Dashboard",
    url: `${STOREFRONT_BASE}/admin`,
    validate: (status, body, text) => status === 200,
  },
  {
    name: "Robots Crawler Directives",
    url: `${STOREFRONT_BASE}/robots.txt`,
    validate: (status, body, text) => status === 200 && text.toLowerCase().includes("user-agent"),
  },
  {
    name: "Dynamic XML Sitemap",
    url: `${STOREFRONT_BASE}/sitemap.xml`,
    validate: (status, body, text) => status === 200 && text.includes("urlset"),
  },
];

function fetchEndpoint(targetUrl) {
  return new Promise((resolve) => {
    const urlObj = new URL(targetUrl);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        headers: {
          "User-Agent": "HouseOfLaado-SmokeTest/1.0",
          Accept: "application/json, text/html, */*",
        },
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          let parsedJson = null;
          try {
            parsedJson = JSON.parse(rawData);
          } catch {
            // Not JSON
          }
          resolve({
            statusCode: res.statusCode,
            body: parsedJson,
            text: rawData,
            headers: res.headers,
          });
        });
      }
    );

    req.on("error", (err) => {
      resolve({
        statusCode: 0,
        body: null,
        text: "",
        error: err.message,
      });
    });

    req.end();
  });
}

async function runSmokeTests() {
  console.log("==================================================================");
  console.log("     HOUSE OF LAADO: PRODUCTION DEPLOYMENT SMOKE TEST SUITE       ");
  console.log("==================================================================");
  console.log(`Running ${CHECKS.length} verification checks across API and Storefront...\n`);

  let passed = 0;
  let failed = 0;

  for (const check of CHECKS) {
    const res = await fetchEndpoint(check.url);
    const isOk = check.validate(res.statusCode, res.body, res.text);

    if (isOk) {
      passed++;
      console.log(`[PASS ${res.statusCode}] ${check.name.padEnd(28)} -> ${check.url}`);
    } else {
      failed++;
      console.error(`[FAIL ${res.statusCode}] ${check.name.padEnd(28)} -> ${check.url} (Error: ${res.error || "Validation mismatch"})`);
    }
  }

  console.log("\n------------------------------------------------------------------");
  console.log(`Smoke Test Summary: ${passed} PASSED / ${failed} FAILED (Total: ${CHECKS.length})`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error("Smoke test execution aborted:", err);
  process.exit(1);
});
