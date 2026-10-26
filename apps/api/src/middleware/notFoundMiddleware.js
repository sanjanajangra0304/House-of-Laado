/**
 * 404 Route Not Found Middleware
 * House of Laado API
 */
export { notFoundHandler } from "./errorHandler.js";
export default function notFoundMiddleware(req, res) {
  return res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
    },
  });
}
