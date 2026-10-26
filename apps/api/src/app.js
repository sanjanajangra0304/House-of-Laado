import fs from "fs";
import path from "path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";

// MVC Routes
import {
  healthRoutes,
  authRoutes,
  categoryRoutes,
  productRoutes,
  orderRoutes,
  adminRoutes,
  uploadRoutes,
  reviewRoutes,
  wishlistRoutes,
  contentRoutes,
} from "./routes/index.js";

// Middlewares
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  mongoSanitize,
  hpp,
  attachRequestId,
  securityHeaders,
} from "./middleware/security.js";
import {
  generalLimiter,
  authLimiter,
  checkoutLimiter,
  contentLimiter,
} from "./middleware/rateLimiting.js";

export function createApp() {
  const app = express();

  // 1. Correlation Request ID & Baseline Security Headers
  app.use(attachRequestId);
  app.use(
    helmet({
      contentSecurityPolicy: false, // Configured for decoupled REST API mode
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );
  app.use(securityHeaders);

  // 2. CORS Allowlist (Supports localhost, local Wi-Fi IP for phone testing, and tunnels)
  const allowedOrigins = [
    env.clientUrl,
    env.frontendUrl,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean);
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          /\.vercel\.app$/.test(origin) ||
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin) ||
          /\.trycloudflare\.com$/.test(origin) ||
          /\.ngrok-free\.app$/.test(origin) ||
          /\.loca\.lt$/.test(origin)
        ) {
          callback(null, true);
        } else {
          callback(new Error(`Origin '${origin}' not permitted by CORS policy`));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-Id"],
    })
  );

  // 3. Body parsers & Cookie parser (OWASP 2MB payload ceiling + raw body retention for webhook verification)
  app.use(
    express.json({
      limit: "2mb",
      verify: (req, res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser());

  // 4. NoSQL Operator Injection & Parameter Pollution Defense
  app.use(mongoSanitize);
  app.use(hpp({ whitelist: ["category", "color", "size", "tag", "tags"] }));

  // 5. Rate Limiting (General + Endpoint-Specific)
  app.use("/api/v1", generalLimiter);
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/register", authLimiter);
  app.use("/api/v1/orders/checkout", checkoutLimiter);
  app.use("/api/v1/content/contact", contentLimiter);
  app.use("/api/v1/content/newsletter", contentLimiter);

  // 6. Mount API Routes
  app.use("/health", healthRoutes);
  app.use("/api/v1/health", healthRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/categories", categoryRoutes);
  app.use("/api/v1/products", productRoutes);
  app.use("/api/v1/orders", orderRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/uploads", uploadRoutes);
  app.use("/api/v1/reviews", reviewRoutes);
  app.use("/api/v1/wishlist", wishlistRoutes);
  app.use("/api/v1/content", contentRoutes);

  // Backward compatibility & unversioned /api/ aliases
  app.use("/api/products", productRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/auth", authRoutes);

  // 7. Static Media Serving (Local Uploads Fallback / Media Server)
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));
  app.use("/api/v1/uploads/static", express.static(uploadsDir));

  // 8. 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp();
