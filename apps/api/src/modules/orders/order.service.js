import mongoose from "mongoose";
import { Order } from "../../models/Order.js";
import { Product } from "../../models/Product.js";
import { Coupon } from "../../models/Coupon.js";
import { InventoryReservation } from "../../models/InventoryReservation.js";
import { WebhookEvent } from "../../models/WebhookEvent.js";
import { Payment } from "../../models/Payment.js";
import { ReturnRequest } from "../../models/ReturnRequest.js";
import { AuditLog } from "../../models/AuditLog.js";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  fetchRazorpayPayment,
  getRazorpayClient,
  createRazorpayRefund,
  isRazorpayConfigured,
} from "../../services/razorpay.service.js";
import {
  createOrderShipment,
  checkPincodeServiceability,
} from "../../services/shiprocket.service.js";
import {
  sendOrderConfirmationNotification,
  sendShippingUpdateNotification,
  sendOrderCancelledNotification,
  sendReturnStatusNotification,
} from "../../services/notification.service.js";
import { env } from "../../config/env.js";

/**
 * Match variant by SKU, or by Size + Color, or fallback to Size
 */
function findMatchingVariant(variants, item) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  if (item.sku) {
    const bySku = variants.find((v) => v.sku && v.sku.trim().toLowerCase() === item.sku.trim().toLowerCase());
    if (bySku) return bySku;
  }
  if (item.color && item.color !== "Default") {
    const bySizeAndColor = variants.find(
      (v) =>
        v.size === item.size &&
        v.color &&
        v.color.trim().toLowerCase() === item.color.trim().toLowerCase()
    );
    if (bySizeAndColor) return bySizeAndColor;
  }
  return variants.find((v) => v.size === item.size) || null;
}

/**
 * Create a new Customer Order & initialize Payment Gateway
 */
export async function createCustomerOrder(payload, userId = null) {
  const {
    customerDetails,
    shippingAddress,
    items,
    paymentMethod,
    couponCode,
    gstin = "",
    deliveryInstructions = "",
  } = payload;

  const normalizedCustomerDetails = {
    fullName: (customerDetails?.fullName || "").trim(),
    email: (customerDetails?.email || "").trim().toLowerCase(),
    phone: (customerDetails?.phone || "").trim(),
  };

  // Resolve valid product ObjectIds & check stock
  const resolvedItems = [];
  for (const item of items) {
    let prod = null;
    if (mongoose.Types.ObjectId.isValid(item.product)) {
      prod = await Product.findById(item.product);
    }
    if (!prod) {
      prod = await Product.findOne({
        $or: [{ slug: item.product }, { name: item.name }],
      });
    }
    if (!prod) {
      const err = new Error(
        `Item '${item.name || item.product}' is no longer available for purchase.`
      );
      err.statusCode = 400;
      err.code = "PRODUCT_NOT_FOUND";
      throw err;
    }

    if (prod.status === "archived" || prod.status !== "active" || prod.stock < item.quantity) {
      const err = new Error(
        `Item '${prod.name}' is ${prod.status === "archived" ? "no longer available for purchase" : "out of stock"}.`
      );
      err.statusCode = 400;
      err.code = "OUT_OF_STOCK";
      throw err;
    }

    const variantMatch = findMatchingVariant(prod?.variants, item);
    if (variantMatch && variantMatch.stock < item.quantity) {
      const colorDesc = item.color && item.color !== "Default" ? `, Color: ${item.color}` : "";
      const err = new Error(
        `Item '${prod.name}' (Size: ${item.size}${colorDesc}) is out of stock.`
      );
      err.statusCode = 400;
      err.code = "OUT_OF_STOCK";
      throw err;
    }
    const itemSku = item.sku || variantMatch?.sku || prod?.sku || "";

    resolvedItems.push({
      ...item,
      sku: itemSku,
      product: prod ? prod._id : new mongoose.Types.ObjectId(),
      price: prod ? prod.sellingPrice : item.price,
    });
  }

  // 1. Calculate subtotal
  const subtotal = resolvedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // 2. Validate COD Limit (Max ₹5,000 for Cash on Delivery)
  if (paymentMethod === "cod" && subtotal > 5000) {
    const err = new Error(
      "Cash on Delivery is only available for orders up to ₹5,000. Please select Online Payment."
    );
    err.statusCode = 400;
    err.code = "COD_LIMIT_EXCEEDED";
    throw err;
  }

  // 3. Process Coupon discount
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });

    if (coupon && subtotal >= coupon.minOrderValue) {
      if (coupon.discountType === "percentage") {
        discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
        }
      } else {
        discountAmount = coupon.discountValue;
      }
    }
  }

  // 4. Prepaid 5% instant discount if paying online and no other coupon applied
  if (paymentMethod === "online" && discountAmount === 0) {
    discountAmount = Math.round(subtotal * 0.05);
  }

  // 5. Free shipping over ₹999, else standard ₹99
  const shippingFee = subtotal >= 999 ? 0 : 99;

  // 6. COD verification fee: flat ₹50
  const codFee = paymentMethod === "cod" ? 50 : 0;

  // 7. Indian GST Calculation (Prices inclusive of GST: 5% under ₹1,000, 12% over ₹1,000)
  let gst5 = 0;
  let gst12 = 0;
  for (const item of resolvedItems) {
    const itemTotal = item.price * item.quantity;
    if (item.price < 1000) {
      gst5 += Math.round(itemTotal - itemTotal / 1.05);
    } else {
      gst12 += Math.round(itemTotal - itemTotal / 1.12);
    }
  }
  const totalGst = gst5 + gst12;

  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee + codFee);

  // 8. Generate sequential human-readable order number (e.g. HOL-39482-ABC)
  const orderNumber = `HOL-${Date.now().toString().slice(-6)}-${Math.random()
    .toString(36)
    .substring(2, 5)
    .toUpperCase()}`;

  // 9. Handle Online Payment Gateway (Razorpay)
  let razorpayOrder = null;
  if (paymentMethod === "online") {
    razorpayOrder = await createRazorpayOrder({
      amount: grandTotal,
      currency: "INR",
      receipt: orderNumber,
    });
  }

  // 10. Save Order Document
  const order = new Order({
    orderNumber,
    user: userId,
    customerDetails: normalizedCustomerDetails,
    shippingAddress,
    items: resolvedItems,
    pricing: {
      subtotal,
      discountAmount,
      shippingFee,
      codFee,
      gstBreakdown: {
        gst5,
        gst12,
        totalGst,
      },
      grandTotal,
    },
    gstin: gstin.trim(),
    deliveryInstructions: deliveryInstructions.trim(),
    paymentMethod,
    paymentStatus: "pending",
    orderStatus: "placed",
    cancellation: null,
    statusHistory: [
      {
        status: "placed",
        changedAt: new Date(),
        note:
          paymentMethod === "cod"
            ? "Order placed via Cash on Delivery"
            : "Order initiated via Razorpay online payment",
      },
    ],
    razorpayDetails: {
      orderId: razorpayOrder?.id || null,
    },
    tracking: {
      courierName: "Delhivery Express",
      trackingNumber: "",
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
  });

  await order.save();

  // 11. Decrement inventory stock on product and matching variant
  for (const item of resolvedItems) {
    if (item.product) {
      const prod = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (prod) {
        if (prod.variants && prod.variants.length) {
          const v = findMatchingVariant(prod.variants, item);
          if (v) {
            v.stock = Math.max(0, v.stock - item.quantity);
            await Product.findByIdAndUpdate(prod._id, { variants: prod.variants });
          }
        }

        // 12. Create Inventory Reservation with 15-Minute TTL
        await InventoryReservation.create({
          product: prod._id,
          variantSize: item.size || "Standard",
          quantity: item.quantity,
          checkoutSessionId: orderNumber,
          userId: userId || null,
          status: "active",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins TTL
        });
      }
    }
  }

  // 13. Dispatch Order Confirmation Notification for COD orders (Prepaid online orders wait until payment is verified)
  if (paymentMethod === "cod") {
    sendOrderConfirmationNotification(order).catch((err) =>
      console.warn("[COD Notification Warning]:", err.message)
    );
  }

  return {
    order,
    razorpayOrder,
    keyId: env.razorpayKeyId,
  };
}

/**
 * Verify Razorpay payment and mark order as confirmed
 */
export async function verifyOrderPayment({
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    const error = new Error("Missing required payment verification parameters.");
    error.statusCode = 400;
    error.code = "INVALID_PAYMENT_DETAILS";
    throw error;
  }

  // 1. Verify Cryptographic Signature
  const isValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValid) {
    const error = new Error("Payment signature verification failed.");
    error.statusCode = 400;
    error.code = "PAYMENT_VERIFICATION_FAILED";
    throw error;
  }

  // 2. Find Order by orderId or orderNumber or razorpayDetails.orderId
  let order;
  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    order = await Order.findById(orderId);
  }
  if (!order) {
    order = await Order.findOne({
      $or: [{ orderNumber: orderId }, { "razorpayDetails.orderId": razorpayOrderId }],
    });
  }

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  // 3. Security: Prevent order tampering - Ensure Razorpay Order ID matches internal order
  if (order.razorpayDetails?.orderId && order.razorpayDetails.orderId !== razorpayOrderId) {
    const error = new Error("Order ID mismatch. Payment does not belong to this order.");
    error.statusCode = 400;
    error.code = "ORDER_MISMATCH";
    throw error;
  }

  // 4. Ensure payment method is online (never allow verifying a COD order as online Razorpay payment)
  if (order.paymentMethod !== "online") {
    const error = new Error("Cannot verify online payment for a Cash on Delivery order.");
    error.statusCode = 400;
    error.code = "INVALID_PAYMENT_METHOD";
    throw error;
  }

  // 5. Idempotency Check: If already paid, return order immediately without duplicate processing
  if (order.paymentStatus === "paid") {
    return order;
  }

  // 6. Verify Payment details with Razorpay API if live client is active
  try {
    const client = getRazorpayClient();
    if (client && process.env.NODE_ENV !== "test") {
      const paymentInfo = await fetchRazorpayPayment(razorpayPaymentId);
      if (paymentInfo) {
        if (paymentInfo.order_id && paymentInfo.order_id !== razorpayOrderId) {
          const error = new Error("Payment is not associated with this Razorpay order ID.");
          error.statusCode = 400;
          error.code = "PAYMENT_ORDER_MISMATCH";
          throw error;
        }
        // Verify amount in paise matches order grandTotal
        const expectedPaise = Math.round(order.pricing.grandTotal * 100);
        if (paymentInfo.amount && paymentInfo.amount !== expectedPaise) {
          const error = new Error("Payment amount mismatch detected.");
          error.statusCode = 400;
          error.code = "AMOUNT_MISMATCH";
          throw error;
        }
        if (paymentInfo.status && !["captured", "authorized"].includes(paymentInfo.status)) {
          const error = new Error(`Payment is in invalid status: ${paymentInfo.status}`);
          error.statusCode = 400;
          error.code = "INVALID_PAYMENT_STATUS";
          throw error;
        }
      }
    }
  } catch (apiErr) {
    if (apiErr.code) throw apiErr;
    console.warn("[Razorpay fetchPayment Check Warning]:", apiErr.message);
  }

  // 7. Update order status
  order.paymentStatus = "paid";
  order.orderStatus = "confirmed";
  order.razorpayDetails = {
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  };

  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status: "confirmed",
    changedAt: new Date(),
    note: `Online payment verified. Payment ID: ${razorpayPaymentId}`,
  });

  await order.save();

  // 8. Create / Upsert payment record
  await Payment.findOneAndUpdate(
    { razorpayPaymentId },
    {
      order: order._id,
      orderNumber: order.orderNumber,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount: order.pricing.grandTotal,
      currency: "INR",
      status: "captured",
      method: "upi",
    },
    { upsert: true, new: true }
  );

  // 9. Mark InventoryReservation as completed
  await InventoryReservation.updateMany(
    { checkoutSessionId: order.orderNumber },
    { status: "completed" }
  );

  // 10. Dispatch Order Confirmation Email now that online payment is verified
  sendOrderConfirmationNotification(order).catch((err) =>
    console.warn("[Verified Payment Notification Warning]:", err.message)
  );

  return order;
}

/**
 * Process Razorpay webhook idempotently
 */
export async function processRazorpayWebhook({ eventId, eventType, payload }) {
  // Check idempotency via WebhookEvent
  const existing = await WebhookEvent.findOne({ eventId });
  if (existing) {
    return { status: "already_processed", eventId };
  }

  const webhookRecord = await WebhookEvent.create({
    eventId,
    provider: "razorpay",
    eventType,
    payload,
    status: "pending",
  });

  try {
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload.payment?.entity || payload.order?.entity || {};
      const razorpayOrderId = paymentEntity.order_id || paymentEntity.id;
      const razorpayPaymentId = paymentEntity.id;

      if (razorpayOrderId) {
        const order = await Order.findOne({
          $or: [
            { "razorpayDetails.orderId": razorpayOrderId },
            { orderNumber: paymentEntity.receipt },
          ],
        });

        if (order && order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.orderStatus = "confirmed";
          order.razorpayDetails.paymentId = razorpayPaymentId;
          if (!order.statusHistory) order.statusHistory = [];
          order.statusHistory.push({
            status: "confirmed",
            changedAt: new Date(),
            note: `Payment confirmed via webhook: ${razorpayPaymentId}`,
          });
          await order.save();

          // Upsert Payment record
          await Payment.findOneAndUpdate(
            { razorpayPaymentId },
            {
              order: order._id,
              orderNumber: order.orderNumber,
              razorpayOrderId: razorpayOrderId || order.razorpayDetails?.orderId,
              razorpayPaymentId,
              amount: order.pricing.grandTotal,
              currency: "INR",
              status: "captured",
              method: paymentEntity.method || "upi",
            },
            { upsert: true, new: true }
          );

          // Mark InventoryReservation as completed
          await InventoryReservation.updateMany(
            { checkoutSessionId: order.orderNumber },
            { status: "completed" }
          );

          // Dispatch Order Confirmation Email via webhook (idempotent; will skip if verifyPayment already dispatched)
          sendOrderConfirmationNotification(order).catch((err) =>
            console.warn("[Webhook Notification Warning]:", err.message)
          );
        }
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = payload.payment?.entity || {};
      const razorpayOrderId = paymentEntity.order_id;
      if (razorpayOrderId) {
        const order = await Order.findOne({ "razorpayDetails.orderId": razorpayOrderId });
        if (order && order.paymentStatus !== "paid") {
          order.paymentStatus = "failed";
          if (!order.statusHistory) order.statusHistory = [];
          order.statusHistory.push({
            status: order.orderStatus,
            changedAt: new Date(),
            note: `Payment failed via webhook. Reason: ${paymentEntity.error_description || "Declined"}`,
          });
          await order.save();
        }
      }
    } else if (eventType === "refund.processed" || eventType === "refund.speed_changed") {
      const refundEntity = payload.refund?.entity || payload.refund || {};
      const refundId = refundEntity.id;
      const paymentId = refundEntity.payment_id;
      const refundAmount = refundEntity.amount ? refundEntity.amount / 100 : 0;

      if (paymentId) {
        const payment = await Payment.findOne({ razorpayPaymentId: paymentId });
        if (payment) {
          if (!payment.refunds) payment.refunds = [];
          const existingRefund = payment.refunds.find((r) => r.refundId === refundId);
          if (existingRefund) {
            existingRefund.status = "processed";
          } else {
            payment.refunds.push({
              refundId,
              amount: refundAmount,
              status: "processed",
              reason: refundEntity.notes?.reason || "Refund processed via Razorpay",
              createdAt: new Date(),
            });
          }

          const totalProcessed = payment.refunds
            .filter((r) => ["processed", "completed"].includes(r.status))
            .reduce((s, r) => s + r.amount, 0);

          if (totalProcessed >= payment.amount) {
            payment.status = "refunded";
          } else {
            payment.status = "partially_refunded";
          }
          await payment.save();

          const order = await Order.findById(payment.order);
          if (order) {
            if (totalProcessed >= (order.pricing?.grandTotal || 0)) {
              order.paymentStatus = "refunded";
            } else {
              order.paymentStatus = "partially_refunded";
            }
            if (order.cancellation) {
              order.cancellation.refundStatus = "processed";
              order.cancellation.refundId = refundId;
              order.cancellation.refundAmount = refundAmount;
            }
            if (!order.statusHistory) order.statusHistory = [];
            order.statusHistory.push({
              status: order.orderStatus,
              changedAt: new Date(),
              note: `Refund of ₹${refundAmount} confirmed via Razorpay webhook (${refundId})`,
            });
            await order.save();
          }

          const returnReq = await ReturnRequest.findOne({
            $or: [{ providerRefundId: refundId }, { order: payment.order }],
            status: { $in: ["approved", "item_received", "inspection_passed", "refund_processing"] },
          });
          if (returnReq) {
            returnReq.refundStatus = "completed";
            returnReq.status = "completed";
            returnReq.providerRefundId = refundId;
            returnReq.statusHistory.push({
              status: "completed",
              changedAt: new Date(),
              changedBy: "razorpay_webhook",
              note: `Refund of ₹${refundAmount} confirmed via Razorpay webhook (${refundId})`,
            });
            await returnReq.save();
          }
        }
      }
    } else if (eventType === "refund.failed") {
      const refundEntity = payload.refund?.entity || payload.refund || {};
      const refundId = refundEntity.id;
      const paymentId = refundEntity.payment_id;

      if (paymentId) {
        const payment = await Payment.findOne({ razorpayPaymentId: paymentId });
        if (payment && payment.refunds) {
          const existingRefund = payment.refunds.find((r) => r.refundId === refundId);
          if (existingRefund) {
            existingRefund.status = "failed";
            await payment.save();
          }
        }
      }

      const returnReq = await ReturnRequest.findOne({ providerRefundId: refundId });
      if (returnReq) {
        returnReq.refundStatus = "failed";
        returnReq.statusHistory.push({
          status: "inspection_passed",
          changedAt: new Date(),
          changedBy: "razorpay_webhook",
          note: `Razorpay refund failed: ${refundEntity.error_description || "Gateway declined refund"}`,
        });
        await returnReq.save();
      }
    }

    webhookRecord.status = "processed";
    webhookRecord.processedAt = new Date();
    await webhookRecord.save();

    return { status: "processed", eventId };
  } catch (err) {
    webhookRecord.status = "failed";
    webhookRecord.errorDetails = err.message;
    await webhookRecord.save();
    throw err;
  }
}

/**
 * Public Order Tracking by Order Number
 */
export async function getOrderByNumber(orderNumber) {
  const order = await Order.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
  })
    .select("-razorpayDetails.signature")
    .lean();

  return order;
}

/**
 * List orders with pagination and filtering (Admin)
 */
export async function getOrders(query = {}) {
  const { page = 1, limit = 20, status } = query;
  const filter = {};

  if (status && status !== "all") {
    filter.orderStatus = status;
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    items: orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Get single order details (Admin)
 */
export async function getOrderById(id) {
  return Order.findById(id).populate("user", "name email phone").lean();
}

/**
 * Get customer orders by user ID or customer email
 */
export async function getUserOrders(userId, email) {
  const query = {};
  const normalizedEmail = email ? email.trim().toLowerCase() : "";

  if (userId && normalizedEmail) {
    query.$or = [
      { user: userId },
      { "customerDetails.email": normalizedEmail },
      { "customerDetails.email": { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
    ];
  } else if (userId) {
    query.user = userId;
  } else if (normalizedEmail) {
    query.$or = [
      { "customerDetails.email": normalizedEmail },
      { "customerDetails.email": { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
    ];
  }

  return Order.find(query).sort({ createdAt: -1 }).lean();
}

/**
 * Update order status and tracking (Admin)
 * Automatically triggers Shiprocket shipment manifest when order status becomes 'packed'
 */
export async function updateOrderStatus(id, { orderStatus, trackingNumber, courierName, note = "" }) {
  const order = await Order.findById(id);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    err.code = "ORDER_NOT_FOUND";
    throw err;
  }

  if (orderStatus) {
    if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
      // Restore inventory stock on product and variant
      for (const item of order.items) {
        if (item.product) {
          const prod = await Product.findById(item.product);
          if (prod) {
            prod.stock += item.quantity;
            if (prod.variants && prod.variants.length) {
              const v = findMatchingVariant(prod.variants, item);
              if (v) {
                v.stock += item.quantity;
              }
            }
            await Product.findByIdAndUpdate(prod._id, {
              stock: prod.stock,
              variants: prod.variants,
            });
          }
        }
      }
      sendOrderCancelledNotification(order, note).catch((err) =>
        console.warn("[Cancellation Notification Warning]:", err.message)
      );
    } else if (orderStatus === "packed" && order.orderStatus !== "packed") {
      // Automatically create shipment manifest via Shiprocket service
      try {
        const shipment = await createOrderShipment(order);
        if (shipment) {
          order.tracking.trackingNumber = shipment.awbNumber;
          order.tracking.courierName = shipment.courierName;
        }
      } catch (shipErr) {
        console.warn("[Shipment Generation Warning]:", shipErr.message);
      }
    } else if (orderStatus === "dispatched" && order.orderStatus !== "dispatched") {
      sendShippingUpdateNotification(order).catch((err) =>
        console.warn("[Shipping Notification Warning]:", err.message)
      );
    }

    order.orderStatus = orderStatus;

    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: orderStatus,
      changedAt: new Date(),
      note: note || `Order status updated to ${orderStatus}`,
    });
  }

  if (trackingNumber !== undefined) {
    order.tracking.trackingNumber = trackingNumber;
  }

  if (courierName) {
    order.tracking.courierName = courierName;
  }

  await order.save();
  return order;
}

/**
 * Verify Coupon validity and compute discount amount
 */
export async function verifyCoupon(code, subtotal = 0) {
  if (!code || !code.trim()) {
    return {
      success: false,
      message: "Please enter a coupon code.",
    };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

  if (!coupon) {
    return {
      success: false,
      message: `Coupon code '${cleanCode}' is invalid or has expired.`,
    };
  }

  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
    return {
      success: false,
      message: `Coupon code '${cleanCode}' has expired.`,
    };
  }

  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return {
      success: false,
      message: `Coupon '${cleanCode}' requires a minimum order value of ₹${coupon.minOrderValue}.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, subtotal);
  }

  return {
    success: true,
    data: {
      code: coupon.code,
      title: coupon.title || "",
      description: coupon.description || "",
      badge: coupon.badge || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      minOrderValue: coupon.minOrderValue,
      maxDiscountAmount: coupon.maxDiscountAmount || null,
    },
  };
}

/**
 * Retrieve public active promotional coupons
 */
export async function getActiveCoupons() {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .select("code title description badge discountType discountValue minOrderValue maxDiscountAmount")
    .sort({ minOrderValue: 1 })
    .lean();

  return coupons;
}

/**
 * Check pincode delivery serviceability via Shiprocket
 */
export async function checkPincode(pincode, weightKg = 0.5, isCod = false) {
  return checkPincodeServiceability(pincode, weightKg, isCod);
}

/**
 * Customer Self-Service Order Cancellation
 * Enforces policy, restores inventory exactly once, triggers Razorpay refund for prepaid orders,
 * prevents duplicate cancellation requests, and logs audit events.
 */
export async function customerCancelOrder(orderId, user, { reason = "", note = "" } = {}) {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    err.code = "ORDER_NOT_FOUND";
    throw err;
  }

  // IDOR & Ownership verification
  const isUserMatch = order.user && user && user._id && order.user.toString() === user._id.toString();
  const orderEmail = order.customerDetails?.email || order.customer?.email;
  const isEmailMatch = orderEmail && user?.email && orderEmail.toLowerCase() === user.email.toLowerCase();

  if (!isUserMatch && !isEmailMatch) {
    const err = new Error("You do not have permission to cancel this order.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  // Idempotency: Prevent duplicate cancellations
  if (order.orderStatus === "cancelled") {
    const err = new Error(`Order #${order.orderNumber} is already cancelled.`);
    err.statusCode = 400;
    err.code = "ORDER_ALREADY_CANCELLED";
    throw err;
  }

  // Only placed or confirmed orders can be self-cancelled before fulfillment/dispatch
  if (!["placed", "confirmed"].includes(order.orderStatus)) {
    const err = new Error(
      `Order #${order.orderNumber} cannot be cancelled as it is already '${order.orderStatus}'. Please contact atelier support.`
    );
    err.statusCode = 400;
    err.code = "ORDER_NOT_CANCELLABLE";
    throw err;
  }

  // Restore inventory stock on product and variant exactly once
  for (const item of order.items) {
    if (item.product) {
      const prod = await Product.findById(item.product);
      if (prod) {
        prod.stock += item.quantity;
        if (prod.variants && prod.variants.length) {
          const v = findMatchingVariant(prod.variants, item);
          if (v) {
            v.stock += item.quantity;
          }
        }
        await Product.findByIdAndUpdate(prod._id, {
          stock: prod.stock,
          variants: prod.variants,
        });
      }
    }
  }

  // Release any active inventory reservations
  try {
    await InventoryReservation.updateMany(
      { checkoutSessionId: order.orderNumber },
      { status: "released" }
    );
  } catch (resErr) {
    console.warn("[Reservation Release Warning]:", resErr.message);
  }

  // Handle Payment Refund for Prepaid vs COD
  let refundId = null;
  let refundAmount = 0;
  let refundStatus = "not_applicable";

  if (order.paymentMethod === "online" && order.paymentStatus === "paid") {
    const payment = await Payment.findOne({
      order: order._id,
      status: "captured",
    });

    const paymentId =
      order.razorpayPaymentId ||
      order.razorpayDetails?.razorpayPaymentId ||
      order.razorpayDetails?.paymentId ||
      payment?.gatewayPaymentId ||
      payment?.razorpayPaymentId;
    if (paymentId) {
      const alreadyRefunded = (payment?.refunds || []).reduce(
        (sum, r) => (["processed", "completed"].includes(r.status) ? sum + r.amount : sum),
        0
      );
      const eligibleAmount = Math.max(0, (order.pricing?.grandTotal || 0) - alreadyRefunded);

      if (eligibleAmount > 0) {
        refundAmount = eligibleAmount;
        if (isRazorpayConfigured() && paymentId) {
          try {
            const refundResult = await createRazorpayRefund({
              paymentId,
              amount: eligibleAmount,
              notes: {
                orderNumber: order.orderNumber,
                reason: reason || note || "Customer self-cancellation",
              },
            });

            refundId = refundResult.id;
            refundStatus = refundResult.status === "processed" ? "completed" : "pending";

            if (payment) {
              if (!payment.refunds) payment.refunds = [];
              payment.refunds.push({
                refundId,
                amount: refundAmount,
                status: refundStatus,
                reason: reason || note || "Customer self-cancellation",
                gatewayResponse: refundResult,
                createdAt: new Date(),
              });
              payment.status = "refunded";
              await payment.save();
            }
            if (refundStatus === "completed") {
              order.paymentStatus = "refunded";
            }
          } catch (rfndErr) {
            console.warn(`[Razorpay Refund Provider Warning during cancellation]: ${rfndErr.message}`);
            refundStatus = "pending";
          }
        } else {
          // Phase 1 Safe Guard: Razorpay is not activated on this website yet.
          // Customer cancellation proceeds cleanly and inventory is safely restored.
          // Refund is legitimately queued as "pending" for manual review and offline settlement.
          refundId = null;
          refundStatus = "pending";
        }
      }
    }
  } else if (order.paymentMethod === "cod") {
    // For COD, no payment was collected; no online refund needed
    order.paymentStatus = "failed";
    refundStatus = "not_applicable";
  }

  order.orderStatus = "cancelled";
  order.cancellation = {
    reason: reason || note || "Customer self-cancelled via online portal",
    cancelledBy: user.email || "customer",
    cancelledAt: new Date(),
    refundId,
    refundAmount,
    refundStatus,
  };

  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status: "cancelled",
    changedAt: new Date(),
    note: reason ? `Customer self-cancellation: ${reason}` : "Customer self-cancelled via online portal",
  });

  await order.save();

  // Audit Log
  try {
    await AuditLog.create({
      user: user._id || null,
      userEmail: user.email || "customer",
      action: "CUSTOMER_CANCEL_ORDER",
      resourceType: "Order",
      resourceId: order._id.toString(),
      changes: {
        fromStatus: "placed",
        toStatus: "cancelled",
        refundId,
        refundAmount,
        refundStatus,
        reason,
      },
    });
  } catch (auditErr) {
    console.warn("[AuditLog Warning]:", auditErr.message);
  }

  // Trigger Notification
  sendOrderCancelledNotification(order, reason).catch((err) =>
    console.warn("[Cancellation Notification Warning]:", err.message)
  );

  return order;
}

/**
 * Customer Self-Service Return / Exchange Request
 * Enforces 7-day return window from delivery, validates item eligibility and quantity,
 * generates unique return requestId, handles COD payout details, and logs audit events.
 */
export async function customerRequestReturn(orderId, user, payload) {
  const {
    reason,
    type = "return_refund",
    description = "",
    photos = [],
    items: requestedItems = [],
    requestedSize = null,
    requestedColor = null,
    payoutDetails = null,
  } = payload;

  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    err.code = "ORDER_NOT_FOUND";
    throw err;
  }

  // IDOR & Ownership verification
  const isUserMatch = order.user && user && user._id && order.user.toString() === user._id.toString();
  const orderEmail = order.customerDetails?.email || order.customer?.email;
  const isEmailMatch = orderEmail && user?.email && orderEmail.toLowerCase() === user.email.toLowerCase();

  if (!isUserMatch && !isEmailMatch) {
    const err = new Error("You do not have permission to request return for this order.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  // Fulfillment status check: only delivered orders can be returned or exchanged
  if (order.orderStatus !== "delivered") {
    const err = new Error("Return or exchange can only be requested once the parcel has been successfully delivered.");
    err.statusCode = 400;
    err.code = "ORDER_NOT_DELIVERED";
    throw err;
  }

  // Return policy / window check: 7 calendar days from delivery
  const RETURN_WINDOW_DAYS = 7;
  let deliveredDate = null;

  if (Array.isArray(order.statusHistory)) {
    const deliveredEntry = order.statusHistory.find((s) => s.status === "delivered");
    if (deliveredEntry?.changedAt) {
      deliveredDate = new Date(deliveredEntry.changedAt);
    }
  }
  if (!deliveredDate) {
    deliveredDate = new Date(order.updatedAt || order.createdAt);
  }

  const windowMs = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() - deliveredDate.getTime() > windowMs) {
    const err = new Error(
      `Return window of ${RETURN_WINDOW_DAYS} calendar days has expired for Order #${order.orderNumber}.`
    );
    err.statusCode = 400;
    err.code = "RETURN_WINDOW_EXPIRED";
    throw err;
  }

  // Prevent duplicate active return requests
  const existingRequest = await ReturnRequest.findOne({
    order: order._id,
    status: { $nin: ["rejected"] },
  });
  if (existingRequest) {
    const err = new Error("A return or exchange request is already active for this order.");
    err.statusCode = 400;
    err.code = "DUPLICATE_RETURN_REQUEST";
    throw err;
  }

  // Item validation and calculation
  let returnItems = [];
  let calculatedRefundAmount = 0;

  if (Array.isArray(requestedItems) && requestedItems.length > 0) {
    for (const reqItem of requestedItems) {
      const orderItem = order.items.find(
        (it) => it.product && it.product.toString() === reqItem.product.toString()
      );
      if (!orderItem) {
        const err = new Error(`Item was not found in Order #${order.orderNumber}.`);
        err.statusCode = 400;
        err.code = "INVALID_RETURN_ITEM";
        throw err;
      }
      const qty = Number(reqItem.quantity) || 1;
      if (qty > orderItem.quantity) {
        const err = new Error(
          `Requested return quantity (${qty}) exceeds purchased quantity (${orderItem.quantity}) for ${orderItem.name}.`
        );
        err.statusCode = 400;
        err.code = "INVALID_RETURN_QUANTITY";
        throw err;
      }
      returnItems.push({
        product: orderItem.product,
        name: orderItem.name,
        sku: orderItem.sku,
        price: orderItem.price,
        size: orderItem.size,
        color: orderItem.color,
        quantity: qty,
        image: orderItem.image,
        exchangeSize: reqItem.exchangeSize || requestedSize || null,
        exchangeColor: reqItem.exchangeColor || requestedColor || null,
      });
      calculatedRefundAmount += orderItem.price * qty;
    }
  } else {
    // Default to all order items
    returnItems = order.items.map((it) => ({
      product: it.product,
      name: it.name,
      sku: it.sku,
      price: it.price,
      size: it.size,
      color: it.color,
      quantity: it.quantity,
      image: it.image,
      exchangeSize: requestedSize || null,
      exchangeColor: requestedColor || null,
    }));
    calculatedRefundAmount = order.pricing?.subtotal || 0;
    if (order.pricing?.discountAmount) {
      calculatedRefundAmount = Math.max(0, calculatedRefundAmount - order.pricing.discountAmount);
    }
  }

  if (type === "exchange") {
    calculatedRefundAmount = 0; // Exchange orders replace garments, no direct refund
  } else {
    calculatedRefundAmount = Math.min(calculatedRefundAmount, order.pricing?.grandTotal || calculatedRefundAmount);
  }

  const requestId = `RET-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const returnReq = await ReturnRequest.create({
    requestId,
    order: order._id,
    orderNumber: order.orderNumber,
    user: user._id || order.user,
    customerDetails: {
      fullName: order.customerDetails?.fullName || user.name || "Customer",
      email: order.customerDetails?.email || user.email || "",
      phone: order.customerDetails?.phone || user.phone || "",
    },
    items: returnItems,
    type,
    reason,
    description: description || "",
    photos: Array.isArray(photos) ? photos : [],
    exchangeDetails: {
      requestedSize,
      requestedColor,
    },
    status: "requested",
    statusHistory: [
      {
        status: "requested",
        changedAt: new Date(),
        changedBy: user.email || "customer",
        note: `Return/Exchange initiated (${type}): ${reason}`,
      },
    ],
    refundStatus: type === "return_refund" ? "requested" : "not_applicable",
    refundAmount: calculatedRefundAmount,
    payoutDetails:
      order.paymentMethod === "cod" && payoutDetails
        ? {
            method: payoutDetails.method || "upi",
            upiId: payoutDetails.upiId || "",
            bankAccountNumber: payoutDetails.bankAccountNumber || "",
            ifscCode: payoutDetails.ifscCode || "",
            accountHolderName: payoutDetails.accountHolderName || "",
          }
        : undefined,
  });

  order.orderStatus = "return_requested";
  order.returnRequest = returnReq._id;
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status: "return_requested",
    changedAt: new Date(),
    note: `Return/Exchange requested (${type}, Request #${requestId}): ${reason}`,
  });
  await order.save();

  try {
    await AuditLog.create({
      user: user._id || null,
      userEmail: user.email || "customer",
      action: "CUSTOMER_RETURN_REQUEST",
      resourceType: "ReturnRequest",
      resourceId: returnReq._id.toString(),
      changes: {
        orderNumber: order.orderNumber,
        requestId,
        type,
        reason,
        refundAmount: calculatedRefundAmount,
      },
    });
  } catch (auditErr) {
    console.warn("[AuditLog Warning]:", auditErr.message);
  }

  sendReturnStatusNotification(returnReq, order).catch((err) =>
    console.warn("[Return Notification Warning]:", err.message)
  );

  return { returnRequest: returnReq, order };
}

/**
 * Customer: Get My Return & Exchange Requests
 */
export async function getCustomerReturnRequests(userId, email) {
  const query = {};
  if (userId && email) {
    query.$or = [{ user: userId }, { "customerDetails.email": email.toLowerCase() }];
  } else if (userId) {
    query.user = userId;
  } else if (email) {
    query["customerDetails.email"] = email.toLowerCase();
  }

  return ReturnRequest.find(query).populate("order").sort({ createdAt: -1 }).lean();
}

/**
 * Get Single Return Request Details (IDOR Protected)
 */
export async function getReturnRequestById(id, user) {
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { requestId: id };
  const returnReq = await ReturnRequest.findOne(query).populate("order");
  if (!returnReq) {
    const err = new Error("Return request not found");
    err.statusCode = 404;
    err.code = "RETURN_REQUEST_NOT_FOUND";
    throw err;
  }

  // IDOR Protection: Staff/Admin/Owner can view any request. Customer can only view own request.
  const isPrivileged = user && ["staff", "admin", "owner"].includes(user.role);
  const isUserMatch = returnReq.user && user && user._id && returnReq.user.toString() === user._id.toString();
  const returnEmail = returnReq.customerDetails?.email;
  const isEmailMatch = returnEmail && user?.email && returnEmail.toLowerCase() === user.email.toLowerCase();

  if (!isPrivileged && !isUserMatch && !isEmailMatch) {
    const err = new Error("Access denied. You do not have permission to view this return request.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  return returnReq;
}

/**
 * Admin: List Return Requests with Filters & Pagination
 */
export async function listReturnRequests(query = {}) {
  const { status, type, orderNumber, search, page = 1, limit = 20 } = query;
  const filter = {};

  if (status && status !== "all") {
    filter.status = status;
  }
  if (type && type !== "all") {
    filter.type = type;
  }
  if (orderNumber) {
    filter.orderNumber = { $regex: orderNumber.trim(), $options: "i" };
  }
  if (search) {
    filter.$or = [
      { requestId: { $regex: search.trim(), $options: "i" } },
      { orderNumber: { $regex: search.trim(), $options: "i" } },
      { "customerDetails.fullName": { $regex: search.trim(), $options: "i" } },
      { "customerDetails.email": { $regex: search.trim(), $options: "i" } },
      { "customerDetails.phone": { $regex: search.trim(), $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    ReturnRequest.find(filter)
      .populate("order")
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ReturnRequest.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
}

/**
 * Admin: Update Return Request Status, Decision, and Inspection Details
 */
export async function updateReturnRequest(id, payload, adminUser) {
  const returnReq = await ReturnRequest.findById(id).populate("order");
  if (!returnReq) {
    const err = new Error("Return request not found");
    err.statusCode = 404;
    err.code = "RETURN_REQUEST_NOT_FOUND";
    throw err;
  }

  const { status, adminNotes, decisionReason, refundStatus, refundAmount, pickupTracking } = payload;

  const validStatuses = [
    "requested",
    "approved",
    "rejected",
    "pickup_scheduled",
    "item_received",
    "received_at_warehouse",
    "inspection_passed",
    "inspection_failed",
    "refund_processing",
    "completed",
  ];

  if (status && !validStatuses.includes(status)) {
    const err = new Error(`Invalid return status: ${status}`);
    err.statusCode = 400;
    err.code = "INVALID_STATUS";
    throw err;
  }

  // Server-side status transition state machine
  const allowedTransitions = {
    requested: ["approved", "pickup_scheduled", "rejected"],
    approved: ["pickup_scheduled", "item_received", "received_at_warehouse", "inspection_passed", "rejected"],
    pickup_scheduled: ["item_received", "received_at_warehouse", "inspection_passed", "inspection_failed", "rejected"],
    item_received: ["inspection_passed", "inspection_failed", "rejected"],
    received_at_warehouse: ["inspection_passed", "inspection_failed", "rejected"],
    inspection_passed: ["refund_processing", "completed", "rejected"],
    inspection_failed: ["rejected"],
    refund_processing: ["completed", "rejected"],
    completed: [],
    rejected: [],
  };

  if (status && status !== returnReq.status) {
    const allowed = allowedTransitions[returnReq.status] || [];
    if (!allowed.includes(status)) {
      const err = new Error(
        `Invalid status transition from '${returnReq.status}' to '${status}'.`
      );
      err.statusCode = 400;
      err.code = "INVALID_STATUS_TRANSITION";
      throw err;
    }
  }

  // Restore inventory only if inspection passes, and restore exactly once
  if (status === "inspection_passed" && !returnReq.stockRestored) {
    for (const item of returnReq.items) {
      if (item.product) {
        const prod = await Product.findById(item.product);
        if (prod) {
          prod.stock += item.quantity;
          if (prod.variants && prod.variants.length) {
            const v = findMatchingVariant(prod.variants, item);
            if (v) {
              v.stock += item.quantity;
            }
          }
          await Product.findByIdAndUpdate(prod._id, {
            stock: prod.stock,
            variants: prod.variants,
          });
        }
      }
    }
    returnReq.stockRestored = true;
  }

  const previousStatus = returnReq.status;
  if (status) returnReq.status = status;
  if (adminNotes !== undefined) returnReq.adminNotes = adminNotes;
  if (decisionReason !== undefined) returnReq.decisionReason = decisionReason;
  if (refundStatus) returnReq.refundStatus = refundStatus;
  if (refundAmount !== undefined) returnReq.refundAmount = Number(refundAmount);
  if (pickupTracking) {
    returnReq.pickupTracking = {
      ...returnReq.pickupTracking,
      ...pickupTracking,
    };
  }

  if (!returnReq.statusHistory) returnReq.statusHistory = [];
  returnReq.statusHistory.push({
    status: status || returnReq.status,
    changedAt: new Date(),
    changedBy: adminUser?.email || "admin",
    note: adminNotes || decisionReason || `Status updated to ${status}`,
  });

  await returnReq.save();

  // If return is rejected, revert order status back to delivered
  if (status === "rejected" && returnReq.order) {
    const order = await Order.findById(returnReq.order._id);
    if (order) {
      order.orderStatus = "delivered";
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status: "delivered",
        changedAt: new Date(),
        note: `Return request #${returnReq.requestId} rejected: ${decisionReason || adminNotes || "Condition criteria not met"}`,
      });
      await order.save();
    }
  }

  // If return is completed, update order status to returned
  if (status === "completed" && returnReq.order) {
    const order = await Order.findById(returnReq.order._id);
    if (order) {
      order.orderStatus = "returned";
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status: "returned",
        changedAt: new Date(),
        note: `Return process completed (#${returnReq.requestId}). Refund status: ${returnReq.refundStatus}`,
      });
      await order.save();
    }
  }

  // Audit log
  try {
    await AuditLog.create({
      user: adminUser?._id || null,
      userEmail: adminUser?.email || "admin",
      action: "UPDATE_RETURN_REQUEST",
      resourceType: "ReturnRequest",
      resourceId: returnReq._id.toString(),
      changes: {
        previousStatus,
        newStatus: status || returnReq.status,
        adminNotes,
        decisionReason,
      },
    });
  } catch (auditErr) {
    console.warn("[AuditLog Warning]:", auditErr.message);
  }

  sendReturnStatusNotification(returnReq, returnReq.order).catch((err) =>
    console.warn("[Return Notification Warning]:", err.message)
  );

  return returnReq;
}

/**
 * Admin: Process Return Refund (Online via Razorpay or Verified COD Payout)
 * Verifies captured payment, ensures refund does not exceed captured amount,
 * prevents duplicate refunds, and updates order and return statuses safely.
 */
export async function processReturnRefund(returnRequestId, payload = {}, adminUser) {
  const returnReq = await ReturnRequest.findById(returnRequestId).populate("order");
  if (!returnReq) {
    const err = new Error("Return request not found");
    err.statusCode = 404;
    err.code = "RETURN_REQUEST_NOT_FOUND";
    throw err;
  }

  if (returnReq.refundStatus === "completed") {
    const err = new Error("Refund has already been completed for this return request.");
    err.statusCode = 400;
    err.code = "REFUND_ALREADY_COMPLETED";
    throw err;
  }

  if (!["inspection_passed", "approved", "refund_processing"].includes(returnReq.status)) {
    const err = new Error(
      `Cannot process refund while return request is in '${returnReq.status}' status. Item must pass inspection first.`
    );
    err.statusCode = 400;
    err.code = "INVALID_RETURN_STATE_FOR_REFUND";
    throw err;
  }

  const order = await Order.findById(returnReq.order._id);
  if (!order) {
    const err = new Error("Associated order not found");
    err.statusCode = 404;
    err.code = "ORDER_NOT_FOUND";
    throw err;
  }

  const refundAmount = Number(payload.refundAmount) || returnReq.refundAmount || order.pricing?.grandTotal || 0;
  if (refundAmount <= 0) {
    const err = new Error("Refund amount must be greater than zero.");
    err.statusCode = 400;
    err.code = "INVALID_REFUND_AMOUNT";
    throw err;
  }

  let refundId = null;
  let providerStatus = "completed";

  if (order.paymentMethod === "online") {
    const payment = await Payment.findOne({
      order: order._id,
      status: { $in: ["captured", "partially_refunded"] },
    });

    const paymentId = order.razorpayDetails?.paymentId || payment?.razorpayPaymentId;
    if (!paymentId) {
      const err = new Error("No captured payment transaction found to issue an online refund.");
      err.statusCode = 400;
      err.code = "NO_CAPTURED_PAYMENT";
      throw err;
    }

    const alreadyRefunded = (payment?.refunds || []).reduce(
      (sum, r) => (["processed", "completed"].includes(r.status) ? sum + r.amount : sum),
      0
    );

    if (alreadyRefunded + refundAmount > (order.pricing?.grandTotal || 0)) {
      const remainingEligible = Math.max(0, (order.pricing?.grandTotal || 0) - alreadyRefunded);
      const err = new Error(
        `Refund amount ₹${refundAmount} exceeds the eligible remaining captured amount (₹${remainingEligible}).`
      );
      err.statusCode = 400;
      err.code = "EXCESSIVE_REFUND_AMOUNT";
      throw err;
    }

    if (isRazorpayConfigured()) {
      const refundResult = await createRazorpayRefund({
        paymentId,
        amount: refundAmount,
        notes: {
          returnRequestId: returnReq.requestId,
          orderNumber: order.orderNumber,
          reason: payload.notes || returnReq.reason || "Return inspection passed refund",
        },
      });

      refundId = refundResult.id;
      providerStatus = refundResult.status === "processed" ? "completed" : "processing";

      if (payment) {
        if (!payment.refunds) payment.refunds = [];
        payment.refunds.push({
          refundId,
          amount: refundAmount,
          status: refundResult.status,
          reason: payload.notes || returnReq.reason,
          gatewayResponse: refundResult,
          createdAt: new Date(),
        });
        const newTotal = alreadyRefunded + refundAmount;
        payment.status = newTotal >= payment.amount ? "refunded" : "partially_refunded";
        await payment.save();
      }

      order.paymentStatus = (alreadyRefunded + refundAmount >= order.pricing.grandTotal) ? "refunded" : "partially_refunded";
    } else {
      // Phase 1 Safe Guard: Automated Razorpay is not active.
      // Require the admin to provide a verified transaction/bank payout reference (UTR / Reference ID)
      const payoutRef = payload.payoutReference || payload.transactionReference;
      if (!payoutRef || !payoutRef.trim()) {
        const err = new Error(
          "Automated Razorpay gateway is not activated for Phase 1. To settle this refund, manually verify the payout or gateway disbursement and enter the transaction reference number (UTR / Reference ID)."
        );
        err.statusCode = 400;
        err.code = "MANUAL_REFERENCE_REQUIRED";
        throw err;
      }
      returnReq.payoutDetails = {
        method: "manual_online_settlement",
        payoutReference: payoutRef.trim(),
        processedAt: new Date(),
        processedBy: adminUser?.email || "admin",
      };
      providerStatus = "completed";
      refundId = payoutRef.trim();
      order.paymentStatus = (alreadyRefunded + refundAmount >= order.pricing.grandTotal) ? "refunded" : "partially_refunded";
    }
  } else if (order.paymentMethod === "cod") {
    // For COD, require verified payout reference (UTR / IMPS / UPI)
    const payoutRef = payload.payoutReference || returnReq.payoutDetails?.payoutReference;
    if (!payoutRef || !payoutRef.trim()) {
      const err = new Error(
        "For Cash on Delivery orders, a valid payout transaction reference (UTR / IMPS / UPI reference number) must be recorded."
      );
      err.statusCode = 400;
      err.code = "MISSING_PAYOUT_REFERENCE";
      throw err;
    }

    returnReq.payoutDetails = {
      ...returnReq.payoutDetails,
      payoutReference: payoutRef.trim(),
      processedAt: new Date(),
      processedBy: adminUser?.email || "admin",
    };
    providerStatus = "completed";
    order.paymentStatus = "refunded";
  }

  returnReq.refundAmount = refundAmount;
  returnReq.providerRefundId = refundId || payload.payoutReference || returnReq.payoutDetails?.payoutReference;
  returnReq.refundStatus = providerStatus;
  returnReq.refundDetails = {
    refundId: refundId || payload.payoutReference || returnReq.payoutDetails?.payoutReference || "",
    status: providerStatus === "completed" ? "processed" : providerStatus,
  };
  if (providerStatus === "completed") {
    returnReq.status = "completed";
  } else {
    returnReq.status = "refund_processing";
  }

  if (!returnReq.statusHistory) returnReq.statusHistory = [];
  returnReq.statusHistory.push({
    status: returnReq.status,
    changedAt: new Date(),
    changedBy: adminUser?.email || "admin",
    note: `Refund of ₹${refundAmount} processed via ${order.paymentMethod.toUpperCase()}${
      refundId ? ` (Razorpay ID: ${refundId})` : ""
    }${payload.payoutReference ? ` (Payout Ref: ${payload.payoutReference})` : ""}`,
  });

  await returnReq.save();

  if (returnReq.status === "completed") {
    order.orderStatus = "returned";
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: "returned",
      changedAt: new Date(),
      note: `Return completed and refund of ₹${refundAmount} finalized (#${returnReq.requestId})`,
    });
  }
  await order.save();

  // Audit Log
  try {
    await AuditLog.create({
      user: adminUser?._id || null,
      userEmail: adminUser?.email || "admin",
      action: "PROCESS_RETURN_REFUND",
      resourceType: "ReturnRequest",
      resourceId: returnReq._id.toString(),
      changes: {
        orderNumber: order.orderNumber,
        refundAmount,
        refundId,
        payoutReference: payload.payoutReference || null,
        refundStatus: providerStatus,
      },
    });
  } catch (auditErr) {
    console.warn("[AuditLog Warning]:", auditErr.message);
  }

  sendReturnStatusNotification(returnReq, order).catch((err) =>
    console.warn("[Return Notification Warning]:", err.message)
  );

  return returnReq;
}

/**
 * Admin/Staff: Re-send customer order confirmation email
 */
export async function resendConfirmationEmail(orderId) {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    err.code = "ORDER_NOT_FOUND";
    throw err;
  }

  // Allow re-send by resetting confirmationSent flag
  if (order.emailNotifications) {
    order.emailNotifications.confirmationSent = false;
  }

  const result = await sendOrderConfirmationNotification(order);
  return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    recipient: order.customerDetails?.email,
    result,
  };
}

/**
 * Release expired or abandoned online orders (TTL: 30 minutes default)
 * Restores product stock and variant stock safely
 */
export async function releaseExpiredOnlineOrders(expiryMinutes = 30) {
  const cutoffTime = new Date(Date.now() - expiryMinutes * 60 * 1000);

  const abandonedOrders = await Order.find({
    paymentMethod: "online",
    paymentStatus: "pending",
    orderStatus: "placed",
    createdAt: { $lt: cutoffTime },
  });

  const releasedOrderNumbers = [];

  for (const order of abandonedOrders) {
    // Restore stock for items
    for (const item of order.items) {
      if (item.product) {
        const prod = await Product.findById(item.product);
        if (prod) {
          prod.stock += item.quantity;
          if (prod.variants && prod.variants.length && item.size) {
            const v = findMatchingVariant(prod.variants, item);
            if (v) {
              v.stock += item.quantity;
            }
          }
          await prod.save();
        }
      }
    }

    order.orderStatus = "cancelled";
    order.paymentStatus = "failed";
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: "cancelled",
      changedAt: new Date(),
      note: "Auto-cancelled: Online payment session timed out / abandoned without payment confirmation. Inventory released.",
    });
    await order.save();

    await InventoryReservation.updateMany(
      { checkoutSessionId: order.orderNumber },
      { status: "expired" }
    );

    releasedOrderNumbers.push(order.orderNumber);
  }

  return { releasedCount: releasedOrderNumbers.length, orders: releasedOrderNumbers };
}

/**
 * Admin: Delete Order permanently from Admin Portal
 * If the order was in 'placed' or 'confirmed' state, safely restore stock to inventory.
 * Clean up associated reservations or return requests, and log an audit log.
 */
export async function deleteOrder(orderId, adminUser) {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error(`Order #${orderId} does not exist.`);
    err.statusCode = 404;
    err.code = "ORDER_NOT_FOUND";
    throw err;
  }

  // If order was in 'placed' or 'confirmed' state, safely restore stock to inventory
  if (["placed", "confirmed"].includes(order.orderStatus)) {
    for (const item of order.items) {
      if (item.product) {
        const prod = await Product.findById(item.product);
        if (prod) {
          prod.stock += item.quantity;
          if (prod.variants && prod.variants.length) {
            const v = findMatchingVariant(prod.variants, item);
            if (v) {
              v.stock += item.quantity;
            }
          }
          await Product.findByIdAndUpdate(prod._id, {
            stock: prod.stock,
            variants: prod.variants,
          });
        }
      }
    }

    try {
      await InventoryReservation.deleteMany({ checkoutSessionId: order.orderNumber });
    } catch (e) {
      console.warn("[Reservation cleanup warning]:", e.message);
    }
  }

  // Delete associated return requests
  await ReturnRequest.deleteMany({ order: order._id });
  // Delete associated payments
  await Payment.deleteMany({ order: order._id });

  // Delete the order record
  await Order.findByIdAndDelete(order._id);

  // Audit Log
  try {
    await AuditLog.create({
      user: adminUser?._id || null,
      userEmail: adminUser?.email || "admin",
      action: "DELETE_ORDER",
      resourceType: "Order",
      resourceId: order._id.toString(),
      changes: {
        orderNumber: order.orderNumber,
        customerEmail: order.customerDetails?.email,
        grandTotal: order.pricing?.grandTotal,
        orderStatus: order.orderStatus,
      },
    });
  } catch (auditErr) {
    console.warn("[AuditLog Warning]:", auditErr.message);
  }

  return { orderNumber: order.orderNumber, orderId: order._id, deleted: true };
}

/**
 * Admin: Bulk Delete Orders permanently
 * Deletes multiple orders, restoring inventory safely once if placed/confirmed,
 * cleaning up associated test records, and recording an audit event.
 */
export async function bulkDeleteOrders(orderIds, adminUser) {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    const err = new Error("Please provide a list of order IDs to delete.");
    err.statusCode = 400;
    err.code = "INVALID_REQUEST";
    throw err;
  }

  if (orderIds.length > 200) {
    const err = new Error("Bulk deletion limit exceeded. Maximum 200 orders per batch.");
    err.statusCode = 400;
    err.code = "BATCH_LIMIT_EXCEEDED";
    throw err;
  }

  const deletedOrders = [];
  const errors = [];

  for (const id of orderIds) {
    try {
      const res = await deleteOrder(id, adminUser);
      deletedOrders.push(res);
    } catch (err) {
      errors.push({ id, message: err.message });
    }
  }

  // Bulk audit log
  if (deletedOrders.length > 0) {
    try {
      await AuditLog.create({
        user: adminUser?._id || null,
        userEmail: adminUser?.email || "admin",
        action: "BULK_DELETE_ORDERS",
        resourceType: "Order",
        resourceId: deletedOrders[0].orderId?.toString() || "bulk",
        changes: {
          count: deletedOrders.length,
          orderNumbers: deletedOrders.map((o) => o.orderNumber),
        },
      });
    } catch (auditErr) {
      console.warn("[Bulk AuditLog Warning]:", auditErr.message);
    }
  }

  return {
    deletedCount: deletedOrders.length,
    deletedOrders,
    errors,
  };
}
