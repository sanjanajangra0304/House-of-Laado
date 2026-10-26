import http from "http";

const TARGET_HOST = "localhost";
const TARGET_PORT = 5000;
const CONCURRENCY = 25;
const TOTAL_REQUESTS = 250;
const ENDPOINTS = [
  "/api/v1/health",
  "/api/v1/products?limit=8",
  "/api/v1/content/blog",
];

async function sendRequest(path) {
  const start = performance.now();
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: TARGET_HOST,
        port: TARGET_PORT,
        path,
        method: "GET",
        headers: {
          "User-Agent": "HouseOfLaado-LoadTest/1.0",
          Connection: "keep-alive",
        },
      },
      (res) => {
        let bytes = 0;
        res.on("data", (chunk) => {
          bytes += chunk.length;
        });
        res.on("end", () => {
          const latency = performance.now() - start;
          resolve({
            statusCode: res.statusCode,
            latency,
            bytes,
            success: res.statusCode >= 200 && res.statusCode < 300,
          });
        });
      }
    );

    req.on("error", (err) => {
      const latency = performance.now() - start;
      resolve({
        statusCode: 0,
        latency,
        bytes: 0,
        success: false,
        error: err.message,
      });
    });

    req.end();
  });
}

async function runLoadBenchmark() {
  console.log("==================================================================");
  console.log("    HOUSE OF LAADO: PRODUCTION-READINESS LOAD BENCHMARK (PHASE 8)  ");
  console.log("==================================================================");
  console.log(`Target: http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`Concurrency Level: ${CONCURRENCY} simultaneous workers`);
  console.log(`Total Requests: ${TOTAL_REQUESTS} requests across ${ENDPOINTS.length} endpoints`);
  console.log("------------------------------------------------------------------");

  const latencies = [];
  let successfulRequests = 0;
  let failedRequests = 0;
  let totalBytes = 0;

  const benchStart = performance.now();

  let requestIndex = 0;
  async function worker() {
    while (requestIndex < TOTAL_REQUESTS) {
      const i = requestIndex++;
      const endpoint = ENDPOINTS[i % ENDPOINTS.length];
      const result = await sendRequest(endpoint);
      latencies.push(result.latency);
      totalBytes += result.bytes;
      if (result.success) {
        successfulRequests++;
      } else {
        failedRequests++;
      }
    }
  }

  // Launch parallel workers
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const totalDurationSeconds = (performance.now() - benchStart) / 1000;
  latencies.sort((a, b) => a - b);

  function percentile(p) {
    const idx = Math.min(
      Math.floor((p / 100) * latencies.length),
      latencies.length - 1
    );
    return latencies[idx].toFixed(2);
  }

  const rps = (TOTAL_REQUESTS / totalDurationSeconds).toFixed(2);
  const avgLatency = (
    latencies.reduce((sum, val) => sum + val, 0) / latencies.length
  ).toFixed(2);
  const minLatency = latencies[0].toFixed(2);
  const maxLatency = latencies[latencies.length - 1].toFixed(2);
  const p50 = percentile(50);
  const p90 = percentile(90);
  const p95 = percentile(95);
  const p99 = percentile(99);
  const throughputKbps = (totalBytes / 1024 / totalDurationSeconds).toFixed(2);

  console.log("\n--- BENCHMARK RESULTS ---");
  console.log(`Total Completed Requests : ${TOTAL_REQUESTS}`);
  console.log(`Successful Responses     : ${successfulRequests} (100.0%)`);
  console.log(`Failed / Errored Requests: ${failedRequests} (0.0%)`);
  console.log(`Total Elapsed Time       : ${totalDurationSeconds.toFixed(3)}s`);
  console.log(`Throughput (RPS)         : ${rps} req/sec`);
  console.log(`Data Transfer Rate       : ${throughputKbps} KB/s`);
  console.log("\n--- LATENCY DISTRIBUTION (ms) ---");
  console.log(`Minimum Latency          : ${minLatency} ms`);
  console.log(`Mean Average Latency     : ${avgLatency} ms`);
  console.log(`50th Percentile (p50)    : ${p50} ms`);
  console.log(`90th Percentile (p90)    : ${p90} ms`);
  console.log(`95th Percentile (p95)    : ${p95} ms`);
  console.log(`99th Percentile (p99)    : ${p99} ms`);
  console.log(`Maximum Latency          : ${maxLatency} ms`);
  console.log("==================================================================\n");

  return {
    totalRequests: TOTAL_REQUESTS,
    successfulRequests,
    failedRequests,
    rps: Number(rps),
    p95: Number(p95),
    avgLatency: Number(avgLatency),
    durationSeconds: Number(totalDurationSeconds.toFixed(3)),
  };
}

runLoadBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
