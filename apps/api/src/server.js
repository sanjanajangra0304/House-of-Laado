import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/database.js";
import { env } from "./config/environment.js";
import { ensureAdminUser } from "./services/authService.js";

async function bootstrap() {
  try {
    // 1. Establish database connection (non-blocking failure in dev so tests/endpoints can still run)
    try {
      await connectDB();
      await ensureAdminUser();
    } catch (dbErr) {
      console.warn(`[Warning] Database connection deferred: ${dbErr.message}`);
    }

    // 2. Initialize Express application
    const app = createApp();

    // 3. Start HTTP server
    const server = app.listen(env.port, () => {
      console.log(`===============================================`);
      console.log(`[House of Laado API] Server running in ${env.nodeEnv.toUpperCase()} mode`);
      console.log(`[House of Laado API] Listening on port: ${env.port}`);
      console.log(`[House of Laado API] Health check: http://localhost:${env.port}/api/v1/health`);
      console.log(`===============================================`);
    });

    // 4. Graceful Shutdown Handler
    const shutdown = async (signal) => {
      console.log(`\n[House of Laado API] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log("[House of Laado API] HTTP server closed.");
        try {
          await disconnectDB();
        } catch (err) {
          console.error("[House of Laado API] Error disconnecting DB:", err.message);
        }
        process.exit(0);
      });

      // Force shutdown after 10s timeout
      setTimeout(() => {
        console.error("[House of Laado API] Forcefully terminating after shutdown timeout.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      console.error("[House of Laado API] Unhandled Rejection at Promise:", reason);
    });

    process.on("uncaughtException", (err) => {
      console.error("[House of Laado API] Uncaught Exception:", err);
      shutdown("UNCAUGHT_EXCEPTION");
    });
  } catch (fatalErr) {
    console.error("[House of Laado API Fatal Startup Error]:", fatalErr);
    process.exit(1);
  }
}

bootstrap();
