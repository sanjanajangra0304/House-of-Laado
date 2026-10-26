import { env } from "../config/env.js";

/**
 * Centralized OWASP-compliant error handling middleware
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "An unexpected error occurred.";
  let details = err.details || null;

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_RESOURCE";
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A resource with this ${field} already exists.`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = `Resource not found with invalid identifier '${err.value}'.`;
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "SCHEMA_VALIDATION_ERROR";
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Do not expose stack traces or raw server internals in production
  const response = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(req.id && { requestId: req.id }),
    },
  };

  if (env.nodeEnv !== "production" && statusCode === 500) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 Route Not Found middleware
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    },
  });
}
