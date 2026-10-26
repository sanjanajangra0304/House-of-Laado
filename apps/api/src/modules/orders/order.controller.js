import * as orderService from "./order.service.js";
import { verifyWebhookSignature } from "../../services/razorpay.service.js";

/**
 * Public Customer Checkout
 */
export async function checkout(req, res, next) {
  try {
    const userId = req.user ? req.user._id : null;
    const result = await orderService.createCustomerOrder(req.body, userId);

    res.status(201).json({
      success: true,
      message: "Order initiated successfully",
      data: {
        order: result.order,
        razorpayOrder: result.razorpayOrder,
        keyId: result.keyId,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public Payment Verification
 */
export async function verifyPayment(req, res, next) {
  try {
    const order = await orderService.verifyOrderPayment(req.body);

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public Order Tracking
 */
export async function trackOrder(req, res, next) {
  try {
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ORDER_NOT_FOUND",
          message: `Order #${orderNumber} could not be found. Please check your order ID.`,
        },
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Customer: Get My Orders
 */
export async function getMyOrders(req, res, next) {
  try {
    const orders = await orderService.getUserOrders(req.user._id, req.user.email);
    res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: List Orders
 */
export async function listOrders(req, res, next) {
  try {
    const result = await orderService.getOrders(req.query);
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Order Details (Staff/Admin or Order Owner with IDOR protection)
 */
export async function getOrder(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: "ORDER_NOT_FOUND", message: "Order not found" },
      });
    }

    // IDOR Protection: Staff/Admin/Owner can view any order. Customers can only view their own order.
    const isPrivileged = req.user && ["staff", "admin", "owner"].includes(req.user.role);
    const isUserMatch = order.user && req.user && req.user._id && order.user.toString() === req.user._id.toString();
    const orderEmail = order.customerDetails?.email || order.customer?.email;
    const isEmailMatch = orderEmail && req.user?.email && orderEmail.toLowerCase() === req.user.email.toLowerCase();

    if (!isPrivileged && !isUserMatch && !isEmailMatch) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied. You do not have permission to view this order.",
        },
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update Status & Tracking
 */
export async function updateOrderStatus(req, res, next) {
  try {
    const updated = await orderService.updateOrderStatus(req.params.id, req.body);
    res.json({
      success: true,
      message: "Order status updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Razorpay Webhook Handler
 */
export async function handleRazorpayWebhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawPayload = req.rawBody || JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(rawPayload, signature);

    if (signature && !isValid) {
      return res.status(400).json({ status: "invalid_signature", message: "Webhook signature verification failed" });
    }

    if (!signature && process.env.NODE_ENV === "production") {
      return res.status(400).json({ status: "missing_signature", message: "Razorpay signature header missing" });
    }

    const eventId =
      req.headers["x-razorpay-event-id"] ||
      req.body.id ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventType = req.body.event;
    const payload = req.body.payload || req.body;

    console.log(`[Razorpay Webhook Received]: ${eventType} (${eventId})`);

    const result = await orderService.processRazorpayWebhook({
      eventId,
      eventType,
      payload,
    });

    res.json({ status: "ok", result });
  } catch (err) {
    console.error("[Razorpay Webhook Error]:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}

/**
 * Validate Coupon Code
 */
export async function validateCoupon(req, res, next) {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required.",
      });
    }
    const result = await orderService.verifyCoupon(code, subtotal);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Public: Get Active Promotional Coupons
 */
export async function getActiveCoupons(req, res, next) {
  try {
    const coupons = await orderService.getActiveCoupons();
    res.json({
      success: true,
      data: coupons,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Check Indian PIN code delivery serviceability
 */
export async function checkServiceability(req, res, next) {
  try {
    const { pincode } = req.params;
    const { weight, isCod } = req.query;
    const result = await orderService.checkPincode(
      pincode,
      weight ? parseFloat(weight) : 0.5,
      isCod === "true"
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Customer: Cancel My Order
 */
export async function cancelMyOrder(req, res, next) {
  try {
    const { id } = req.params;
    const updatedOrder = await orderService.customerCancelOrder(id, req.user, req.body);
    res.json({
      success: true,
      message: `Order #${updatedOrder.orderNumber} has been successfully cancelled.`,
      data: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Customer: Request Return or Exchange
 */
export async function returnMyOrder(req, res, next) {
  try {
    const { id } = req.params;
    const result = await orderService.customerRequestReturn(id, req.user, req.body);
    res.status(201).json({
      success: true,
      message: "Return / exchange request submitted successfully. Our concierge will review shortly.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Customer: Get My Return & Exchange Requests
 */
export async function getMyReturnRequests(req, res, next) {
  try {
    const returns = await orderService.getCustomerReturnRequests(req.user._id, req.user.email);
    res.json({
      success: true,
      data: returns,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Customer / Admin: Get Return Request Details
 */
export async function getReturnRequest(req, res, next) {
  try {
    const returnReq = await orderService.getReturnRequestById(req.params.id, req.user);
    res.json({
      success: true,
      data: returnReq,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: List Return Requests
 */
export async function listReturnRequests(req, res, next) {
  try {
    const result = await orderService.listReturnRequests(req.query);
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update Return Request
 */
export async function updateReturnRequest(req, res, next) {
  try {
    const updated = await orderService.updateReturnRequest(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: "Return request updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Process Return Refund (Online via Razorpay or Verified COD Payout)
 */
export async function processReturnRefund(req, res, next) {
  try {
    const result = await orderService.processReturnRefund(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: "Return refund processed successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin/Staff: Re-send customer order confirmation email
 */
export async function resendOrderEmail(req, res, next) {
  try {
    const result = await orderService.resendConfirmationEmail(req.params.id);
    res.json({
      success: true,
      message: "Order confirmation email re-triggered successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Delete Order permanently
 */
export async function deleteOrder(req, res, next) {
  try {
    const result = await orderService.deleteOrder(req.params.id, req.user);
    res.json({
      success: true,
      message: `Order #${result.orderNumber} deleted successfully.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Bulk Delete Orders permanently
 */
export async function bulkDeleteOrders(req, res, next) {
  try {
    const { orderIds } = req.body;
    const result = await orderService.bulkDeleteOrders(orderIds, req.user);
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} orders.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
