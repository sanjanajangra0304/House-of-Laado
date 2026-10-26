import { Router } from "express";
import * as reviewController from "./review.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, optionalAuthenticate, requireStaff } from "../../middleware/auth.js";
import {
  createReviewSchema,
  updateReviewSchema,
  updateReviewStatusSchema,
  adminReplySchema,
} from "./review.validation.js";

const router = Router();

// Public routes (anyone/others can view)
router.get("/product/:productId", reviewController.getProductReviews);

// Customer routes
router.get("/eligible/:productId", authenticate, reviewController.checkEligibility);
router.post(
  "/",
  optionalAuthenticate,
  validate(createReviewSchema, "body"),
  reviewController.createReview
);

// Edit review: Only the author customer or Admin/Staff
router.put(
  "/:id",
  authenticate,
  validate(updateReviewSchema, "body"),
  reviewController.updateReview
);

// Delete review: Only the author customer or Admin/Staff
router.delete(
  "/:id",
  authenticate,
  reviewController.deleteReview
);

// Admin / Staff moderation routes
router.get("/admin/all", authenticate, requireStaff, reviewController.listAllReviews);
router.patch(
  "/admin/:id/status",
  authenticate,
  requireStaff,
  validate(updateReviewStatusSchema, "body"),
  reviewController.updateReviewStatus
);
router.post(
  "/admin/:id/reply",
  authenticate,
  requireStaff,
  validate(adminReplySchema, "body"),
  reviewController.addAdminReply
);

export default router;
