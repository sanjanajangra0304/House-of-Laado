import { Router } from "express";
import * as orderController from "./order.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, requireAdmin, requireStaff, optionalAuthenticate } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import {
  checkoutOrderSchema,
  verifyPaymentSchema,
  updateStatusSchema,
  cancelOrderSchema,
  returnOrderSchema,
  adminUpdateReturnRequestSchema,
  adminProcessRefundSchema,
} from "./order.validation.js";

const router = Router();

// Public Customer Checkout & Payment routes
router.post("/checkout", optionalAuthenticate, validate(checkoutOrderSchema, "body"), orderController.checkout);
router.post("/verify-payment", validate(verifyPaymentSchema, "body"), orderController.verifyPayment);
router.post("/validate-coupon", orderController.validateCoupon);
router.get("/coupons", orderController.getActiveCoupons);
router.get("/serviceability/:pincode", orderController.checkServiceability);
router.get("/track/:orderNumber", orderController.trackOrder);
router.get("/my/orders", authenticate, orderController.getMyOrders);
router.get("/my/returns", authenticate, orderController.getMyReturnRequests);
router.post("/webhook/razorpay", orderController.handleRazorpayWebhook);

// Admin / Staff Return Requests Management routes (must precede /:id)
router.get("/returns/requests", authenticate, requireStaff, orderController.listReturnRequests);
router.get("/returns/:id", authenticate, orderController.getReturnRequest);
router.patch(
  "/returns/requests/:id",
  authenticate,
  requireStaff,
  validate(adminUpdateReturnRequestSchema, "body"),
  auditAction("UPDATE_RETURN_REQUEST", "ReturnRequest"),
  orderController.updateReturnRequest
);
router.post(
  "/returns/requests/:id/refund",
  authenticate,
  requireStaff,
  validate(adminProcessRefundSchema, "body"),
  auditAction("PROCESS_RETURN_REFUND", "ReturnRequest"),
  orderController.processReturnRefund
);

// Customer Self-Service Actions (Cancel & Return)
router.post(
  "/:id/cancel",
  authenticate,
  validate(cancelOrderSchema, "body"),
  auditAction("CUSTOMER_CANCEL_ORDER", "Order"),
  orderController.cancelMyOrder
);
router.post(
  "/:id/return",
  authenticate,
  validate(returnOrderSchema, "body"),
  auditAction("CUSTOMER_RETURN_REQUEST", "Order"),
  orderController.returnMyOrder
);
router.get("/", authenticate, requireStaff, orderController.listOrders);
router.post(
  "/bulk-delete",
  authenticate,
  requireStaff,
  auditAction("BULK_DELETE_ORDERS", "Order"),
  orderController.bulkDeleteOrders
);
router.get("/:id", authenticate, orderController.getOrder);
router.patch(
  "/:id/status",
  authenticate,
  requireStaff,
  validate(updateStatusSchema, "body"),
  auditAction("UPDATE_ORDER_STATUS", "Order"),
  orderController.updateOrderStatus
);
router.post(
  "/:id/resend-email",
  authenticate,
  requireStaff,
  auditAction("RESEND_ORDER_EMAIL", "Order"),
  orderController.resendOrderEmail
);
router.delete(
  "/:id",
  authenticate,
  requireStaff,
  auditAction("DELETE_ORDER", "Order"),
  orderController.deleteOrder
);

export default router;
