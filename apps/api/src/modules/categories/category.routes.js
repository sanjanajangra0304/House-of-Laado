import { Router } from "express";
import * as categoryController from "./category.controller.js";
import { authenticate, requireStaff, requireAdmin } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";

const router = Router();

// Public
router.get("/", categoryController.getCategories);
router.get("/:slug", categoryController.getCategory);

// Staff / Admin CRUD
router.post(
  "/",
  authenticate,
  requireStaff,
  auditAction("CREATE_CATEGORY", "Category"),
  categoryController.createCategory
);

router.put(
  "/:id",
  authenticate,
  requireStaff,
  auditAction("UPDATE_CATEGORY", "Category"),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  auditAction("DELETE_CATEGORY", "Category"),
  categoryController.deleteCategory
);

export default router;
