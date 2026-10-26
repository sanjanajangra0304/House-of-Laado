import { recordAuditLog } from "../services/audit.service.js";

/**
 * Middleware factory to automatically record mutating admin actions on route success
 * @param {string} action
 * @param {string} resourceType
 */
export function auditAction(action, resourceType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        recordAuditLog({
          userId: req.user._id,
          userEmail: req.user.email,
          action,
          resourceType,
          resourceId: req.params?.id || req.body?._id || body?.data?._id || null,
          changes: {
            method: req.method,
            path: req.originalUrl,
            params: req.params,
            body: req.body,
          },
          ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
        });
      }
      return originalJson(body);
    };
    next();
  };
}
