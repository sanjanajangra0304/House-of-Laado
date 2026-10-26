import { Router } from "express";
import * as productController from "./product.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, requireAdmin, requireStaff } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import {
  listProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
} from "./product.validation.js";

const router = Router();

// Public catalog routes
router.get("/", validate(listProductsQuerySchema, "query"), productController.listProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/id/:id", productController.getProductById);

// Admin bulk & export operations (Declared before /:slug so "export-csv" is not parsed as a slug)
router.get("/export-csv", authenticate, requireStaff, productController.exportCSV);
router.patch(
  "/bulk-price",
  authenticate,
  requireAdmin,
  auditAction("BULK_PRICE_UPDATE", "Product"),
  productController.bulkUpdatePrices
);
router.patch(
  "/bulk-stock",
  authenticate,
  requireStaff,
  auditAction("BULK_STOCK_UPDATE", "Product"),
  productController.bulkUpdateStock
);

// Public single product by slug
router.get("/:slug", productController.getProduct);

// Admin-protected catalog management routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createProductSchema, "body"),
  auditAction("CREATE_PRODUCT", "Product"),
  productController.createProduct
);

router.put(
  "/:id",
  authenticate,
  requireAdmin,
  validate(updateProductSchema, "body"),
  auditAction("UPDATE_PRODUCT", "Product"),
  productController.updateProduct
);

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(updateProductSchema, "body"),
  auditAction("UPDATE_PRODUCT", "Product"),
  productController.updateProduct
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  auditAction("ARCHIVE_PRODUCT", "Product"),
  productController.deleteProduct
);

export default router;
