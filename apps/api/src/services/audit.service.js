import { AuditLog } from "../models/AuditLog.js";

/**
 * Record an audit log entry for admin actions
 * @param {Object} params
 * @param {string|ObjectId} [params.userId]
 * @param {string} [params.userEmail]
 * @param {string} params.action - e.g. "CREATE_PRODUCT", "UPDATE_ORDER_STATUS"
 * @param {string} params.resourceType - e.g. "Product", "Order", "Setting"
 * @param {string} [params.resourceId]
 * @param {Object} [params.changes]
 * @param {string} [params.ipAddress]
 * @returns {Promise<AuditLog>}
 */
export async function recordAuditLog({
  userId = null,
  userEmail = "system",
  action,
  resourceType,
  resourceId = null,
  changes = null,
  ipAddress = "",
}) {
  try {
    const log = await AuditLog.create({
      user: userId,
      userEmail,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : null,
      changes,
      ipAddress,
    });
    return log;
  } catch (err) {
    // Audit logging failure should not crash the primary operational transaction, but should be logged to stderr
    console.error("[AuditLog Service Error]:", err.message);
    return null;
  }
}
