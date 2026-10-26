import { Router } from "express";
import * as adminController from "./admin.controller.js";
import {
  authenticate,
  requireStaff,
  requireAdmin,
  requireRole,
} from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";

const router = Router();

// Base authentication required for all administrative endpoints
router.use(authenticate);

// 1. Dashboard Stats (Staff, Admin, Owner)
router.get("/stats", requireStaff, adminController.getStats);

// 2. Coupons (Staff can view, Admin/Owner can mutate)
router.get("/coupons", requireStaff, adminController.getCoupons);
router.post(
  "/coupons",
  requireAdmin,
  auditAction("CREATE_COUPON", "Coupon"),
  adminController.createCoupon
);
router.put(
  "/coupons/:id",
  requireAdmin,
  auditAction("UPDATE_COUPON", "Coupon"),
  adminController.updateCoupon
);
router.delete(
  "/coupons/:id",
  requireAdmin,
  auditAction("DELETE_COUPON", "Coupon"),
  adminController.deleteCoupon
);

// 3. Banners (Staff can view, Admin/Owner can mutate)
router.get("/banners", requireStaff, adminController.getBanners);
router.post(
  "/banners",
  requireAdmin,
  auditAction("CREATE_BANNER", "Banner"),
  adminController.createBanner
);
router.put(
  "/banners/:id",
  requireAdmin,
  auditAction("UPDATE_BANNER", "Banner"),
  adminController.updateBanner
);
router.delete(
  "/banners/:id",
  requireAdmin,
  auditAction("DELETE_BANNER", "Banner"),
  adminController.deleteBanner
);

// 4. Settings (Staff can view, ONLY Admin or Owner can edit!)
router.get("/settings", requireStaff, adminController.getSettings);
router.put(
  "/settings/:key",
  requireRole("admin", "owner"), // Staff is denied (returns 403)
  auditAction("UPDATE_SETTING", "Setting"),
  adminController.updateSetting
);

// 5. Users & Owner Protection (Admin/Owner can view and delete)
router.get("/users", requireAdmin, adminController.getUsers);
router.delete(
  "/users/:id",
  requireAdmin,
  auditAction("DELETE_USER", "User"),
  adminController.deleteUser
);

// 6. Audit Logs (Admin/Owner can view)
router.get("/audit-logs", requireAdmin, adminController.getAuditLogs);

export default router;
