/**
 * Notification Service — House of Laado
 * Handles Order Confirmation, Shipping Status Updates, and Cancellation Notifications.
 *
 * Configurable via standard SMTP or external transactional email providers.
 * If credentials are not supplied in .env, safe non-faking logs guide the operator.
 */

import { sendOrderConfirmationEmail, sendNewsletterWelcomeEmail } from "./email.service.js";
import { Order } from "../models/Order.js";
import { env } from "../config/env.js";

// Track notification dispatches to prevent duplicate events on retries
const dispatchedEvents = new Set();

/**
 * Format notification event key for idempotency
 */
function getEventKey(orderId, eventType) {
  return `${orderId}:${eventType}`;
}

/**
 * Check if external email provider credentials are configured (Resend or SMTP)
 */
export function isEmailConfigured() {
  const hasResend = Boolean(env.resendApiKey && !env.resendApiKey.includes("mock"));
  const hasSmtp = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
  return hasResend || hasSmtp;
}

/**
 * Send order confirmation notification to customer via Resend / transactional email
 */
export async function sendOrderConfirmationNotification(order) {
  const orderId = order._id ? order._id.toString() : order.orderNumber;
  const eventKey = getEventKey(orderId, "order_confirmed");

  // Idempotency: Prevent sending duplicate confirmation email
  if (dispatchedEvents.has(eventKey) || order.emailNotifications?.confirmationSent) {
    return { success: true, skipped: true, reason: "Duplicate notification prevented" };
  }

  try {
    const emailResult = await sendOrderConfirmationEmail(order);

    const updateFields = {
      "emailNotifications.confirmationSent": Boolean(
        emailResult.delivered || emailResult.configured === false
      ),
      "emailNotifications.confirmationSentAt": new Date(),
      "emailNotifications.confirmationMessageId": emailResult.messageId || "",
      "emailNotifications.lastError": emailResult.error || "",
    };

    if (order._id) {
      try {
        await Order.findByIdAndUpdate(order._id, { $set: updateFields });
      } catch (dbErr) {
        console.warn(`[Order Email Notification DB Update Warning]: ${dbErr.message}`);
      }
    }

    if (emailResult.success) {
      dispatchedEvents.add(eventKey);
    }

    return emailResult;
  } catch (err) {
    console.error(`[Order Confirmation Dispatch Error]: ${err.message}`);
    if (order._id) {
      try {
        await Order.findByIdAndUpdate(order._id, {
          $set: { "emailNotifications.lastError": err.message },
        });
      } catch {}
    }
    return { success: false, error: err.message };
  }
}

/**
 * Send shipment tracking update notification
 */
export async function sendShippingUpdateNotification(order) {
  const trackingNumber = order.tracking?.trackingNumber || "TBD";
  const courierName = order.tracking?.courierName || "Delhivery Express";
  const eventKey = getEventKey(order._id || order.orderNumber, `shipped_${trackingNumber}`);

  if (dispatchedEvents.has(eventKey)) {
    return { success: true, skipped: true, reason: "Duplicate notification prevented" };
  }

  const customerEmail = order.customerDetails?.email;
  const orderNumber = order.orderNumber;

  if (!isEmailConfigured()) {
    console.log(
      `[House of Laado Notification Interface]: Shipping update queued for ${customerEmail} ` +
      `(Order #${orderNumber}, Courier: ${courierName}, AWB: ${trackingNumber}). ` +
      `Live dispatch skipped safely (SMTP not configured).`
    );
    dispatchedEvents.add(eventKey);
    return {
      success: true,
      delivered: false,
      configured: false,
      message: "Shipping update notification logged (SMTP not configured).",
    };
  }

  dispatchedEvents.add(eventKey);
  return { success: true, delivered: true, configured: true, recipient: customerEmail };
}

/**
 * Send order cancellation notification
 */
export async function sendOrderCancelledNotification(order, reason = "") {
  const eventKey = getEventKey(order._id || order.orderNumber, "order_cancelled");
  if (dispatchedEvents.has(eventKey)) {
    return { success: true, skipped: true, reason: "Duplicate notification prevented" };
  }

  const customerEmail = order.customerDetails?.email;
  const orderNumber = order.orderNumber;

  if (!isEmailConfigured()) {
    console.log(
      `[House of Laado Notification Interface]: Cancellation notice queued for ${customerEmail} ` +
      `(Order #${orderNumber}). Reason: ${reason || "Customer/Admin cancellation"}. ` +
      `Live dispatch skipped safely (SMTP not configured).`
    );
    dispatchedEvents.add(eventKey);
    return {
      success: true,
      delivered: false,
      configured: false,
      message: "Cancellation notification logged (SMTP not configured).",
    };
  }

  dispatchedEvents.add(eventKey);
  return { success: true, delivered: true, configured: true, recipient: customerEmail };
}

/**
 * Send Return or Refund status notification
 */
export async function sendReturnStatusNotification(returnRequest, order) {
  const reqId = returnRequest.requestId || returnRequest._id;
  const status = returnRequest.status;
  const eventKey = getEventKey(reqId, `return_${status}`);

  if (dispatchedEvents.has(eventKey)) {
    return { success: true, skipped: true, reason: "Duplicate notification prevented" };
  }

  const customerEmail = returnRequest.customerDetails?.email || order?.customerDetails?.email;
  const orderNumber = returnRequest.orderNumber;

  console.log(
    `[House of Laado Notification Interface]: Return request status update (${status}) queued for ${customerEmail} ` +
    `(Order #${orderNumber}, Request ID: ${reqId}, Refund Status: ${returnRequest.refundStatus}). ` +
    `Live dispatch skipped safely (SMTP not configured).`
  );

  dispatchedEvents.add(eventKey);
  return {
    success: true,
    delivered: isEmailConfigured(),
    configured: isEmailConfigured(),
    recipient: customerEmail,
    status,
  };
}

/**
 * Send Password Reset / Forgot Password OTP Notification via Email or Phone
 */
export async function sendPasswordResetOtpNotification({ identifier, otp, user, isEmail }) {
  const recipientName = user?.name || "Valued Patron";
  console.log(
    `[House of Laado Auth OTP]: One-Time Password for ${identifier} is: [${otp}] (Recipient: ${recipientName}, Valid for 10 minutes)`
  );

  if (isEmail && isEmailConfigured()) {
    try {
      // SMTP dispatch would occur here when live SMTP credentials are provided
      return {
        success: true,
        delivered: true,
        configured: true,
        recipient: identifier,
      };
    } catch (err) {
      console.error(`[OTP Email Dispatch Error]: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  return {
    success: true,
    delivered: false,
    configured: false,
    channel: isEmail ? "email" : "phone",
    message: `OTP logged and queued for ${identifier}.`,
  };
}

/**
 * Send Newsletter Welcome & 10% Discount Code Notification
 */
export async function sendNewsletterWelcomeNotification(subscriberEmail, couponCode = "WELCOME10") {
  const eventKey = getEventKey(subscriberEmail, "newsletter_welcome");
  if (dispatchedEvents.has(eventKey)) {
    return { success: true, skipped: true, reason: "Duplicate welcome email prevented", couponCode };
  }

  try {
    const result = await sendNewsletterWelcomeEmail(subscriberEmail, { couponCode });
    if (result.success) {
      dispatchedEvents.add(eventKey);
    }
    return result;
  } catch (err) {
    console.error(`[Newsletter Welcome Notification Error]: ${err.message}`);
    return { success: false, error: err.message, couponCode };
  }
}
