import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const isTest =
  env.nodeEnv === "test" ||
  process.env.NODE_ENV === "test" ||
  Boolean(process.env.NODE_TEST_CONTEXT) ||
  process.execArgv.includes("--test");

/**
 * Standard factory for rate limiters
 */
function createLimiter({ windowMs, max, message, code }) {
  return rateLimit({
    windowMs,
    max: isTest ? 100000 : max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: code || "RATE_LIMIT_EXCEEDED",
        message: message || "Too many requests. Please try again later.",
      },
    },
  });
}

/**
 * Auth rate limiter to prevent brute-force attacks on credential endpoints
 */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  code: "AUTH_RATE_LIMIT_EXCEEDED",
  message: "Too many login/registration attempts from this IP. Please try again after 15 minutes.",
});

/**
 * Checkout & Payment rate limiter to prevent fraudulent card testing and race conditions
 */
export const checkoutLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  code: "CHECKOUT_RATE_LIMIT_EXCEEDED",
  message: "Order transaction rate limit reached. Please wait a few moments before trying again.",
});

/**
 * Content rate limiter for contact form submissions and newsletter signups
 */
export const contentLimiter = createLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  code: "CONTENT_RATE_LIMIT_EXCEEDED",
  message: "Inquiry submission rate limit reached. Please wait before submitting another message.",
});

/**
 * General API limiter for all routes
 */
export const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  code: "RATE_LIMIT_EXCEEDED",
  message: "Too many requests from this IP. Please try again after 15 minutes.",
});
