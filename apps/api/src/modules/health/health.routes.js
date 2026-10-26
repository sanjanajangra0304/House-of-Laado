import { Router } from "express";
import { getDBStatus, getDBDetails } from "../../config/db.js";

const router = Router();

router.get("/", (req, res) => {
  const dbStatus = getDBStatus();
  const dbDetails = getDBDetails();
  const isHealthy = dbStatus === "connected";
  const mem = process.memoryUsage();

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? "OK" : "DEGRADED",
    brand: "House of Laado",
    uptime: Math.round(process.uptime()),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    services: {
      database: dbStatus,
      databaseHost: dbDetails.host || "unknown",
      databaseName: dbDetails.database || "house_of_laado",
    },
    system: {
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      rssMb: Math.round(mem.rss / 1024 / 1024),
    },
  });
});

export default router;
