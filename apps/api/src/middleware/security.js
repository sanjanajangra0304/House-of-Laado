import crypto from "crypto";

/**
 * MongoDB Operator Injection Sanitizer
 * Recursively strips keys starting with '$' or containing '.' from objects.
 */
export function cleanMongoOperators(obj) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanMongoOperators(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop keys starting with '$' (e.g., $gt, $ne, $where) or containing '.'
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    const sanitizedVal = cleanMongoOperators(value);
    if (sanitizedVal !== undefined) {
      cleaned[key] = sanitizedVal;
    }
  }

  // If the object originally had keys but all were stripped as operators, return undefined
  if (Object.keys(obj).length > 0 && Object.keys(cleaned).length === 0) {
    return undefined;
  }

  return cleaned;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params against NoSQL injection
 */
export function mongoSanitize(req, res, next) {
  if (req.body) {
    req.body = cleanMongoOperators(req.body);
  }
  if (req.query) {
    req.query = cleanMongoOperators(req.query);
  }
  if (req.params) {
    req.params = cleanMongoOperators(req.params);
  }
  next();
}

/**
 * HTTP Parameter Pollution (HPP) defense middleware
 * Flattens polluted array parameters in req.query into scalar values unless whitelisted.
 */
export function hpp(options = {}) {
  const whitelist = new Set(options.whitelist || ["category", "color", "size", "tag", "tags"]);

  return (req, res, next) => {
    if (req.query && typeof req.query === "object") {
      for (const [key, value] of Object.entries(req.query)) {
        if (Array.isArray(value) && !whitelist.has(key)) {
          // Take the last item in the array to resolve pollution
          req.query[key] = value[value.length - 1];
        }
      }
    }
    next();
  };
}

/**
 * Request ID middleware
 * Assigns or propagates a unique correlation ID for every inbound HTTP request.
 */
export function attachRequestId(req, res, next) {
  const reqId =
    req.headers["x-request-id"] ||
    `req_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
  req.id = reqId;
  res.setHeader("X-Request-Id", reqId);
  next();
}

/**
 * Sensitive fields to redact from logs and debug traces
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "currentpassword",
  "token",
  "secret",
  "cvv",
  "cardnumber",
  "razorpay_signature",
  "authorization",
  "cookie",
]);

/**
 * PII and Secret Sanitizer for safe structured logging
 */
export function sanitizePII(data) {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePII(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (lowerKey === "email" && typeof value === "string") {
      const parts = value.split("@");
      if (parts.length === 2) {
        sanitized[key] = `${parts[0].slice(0, 2)}***@${parts[1]}`;
      } else {
        sanitized[key] = "[REDACTED_EMAIL]";
      }
    } else if (lowerKey === "phone" && typeof value === "string") {
      sanitized[key] = `******${value.slice(-4)}`;
    } else if (typeof value === "object") {
      sanitized[key] = sanitizePII(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Security Response Headers
 */
export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}
