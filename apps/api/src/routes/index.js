/**
 * Central Routes Aggregator (MVC Pattern)
 * House of Laado API
 */
import { Router } from "express";

import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import orderRoutes from "./orderRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import adminRoutes from "./adminRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import wishlistRoutes from "./wishlistRoutes.js";
import contentRoutes from "./contentRoutes.js";
import healthRoutes from "./healthRoutes.js";

const router = Router();

// Health routes
router.use("/health", healthRoutes);

// Feature routes
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);
router.use("/uploads", uploadRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/content", contentRoutes);

export default router;
export {
  authRoutes,
  productRoutes,
  categoryRoutes,
  orderRoutes,
  reviewRoutes,
  adminRoutes,
  uploadRoutes,
  wishlistRoutes,
  contentRoutes,
  healthRoutes,
};
