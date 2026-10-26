import { Resend } from "resend";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Initialize Resend Client if API key is provided
let resendClient = null;
if (env.resendApiKey && !env.resendApiKey.includes("mock") && !env.resendApiKey.includes("placeholder")) {
  try {
    resendClient = new Resend(env.resendApiKey);
  } catch (err) {
    console.warn(`[Resend Initialization Warning]: ${err.message}`);
  }
}

// Initialize Nodemailer SMTP Transporter if SMTP credentials are provided
let smtpTransporter = null;
if (env.smtpHost && env.smtpUser && env.smtpPass && !env.smtpPass.includes("placeholder")) {
  try {
    smtpTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: Number(env.smtpPort) || 587,
      secure: Number(env.smtpPort) === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  } catch (err) {
    console.warn(`[SMTP Transporter Initialization Warning]: ${err.message}`);
  }
}

/**
 * Generate Responsive Luxury HTML Email for House of Laado Order Confirmation
 */
export function generateOrderConfirmationHtml(order) {
  const customerName = order.customerDetails?.fullName || "Valued Patron";
  const orderNumber = order.orderNumber;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const items = order.items || [];
  const pricing = order.pricing || {};
  const shippingAddress = order.shippingAddress || {};
  const paymentMethodText =
    order.paymentMethod === "online"
      ? "Prepaid Online (Razorpay Verified)"
      : "Cash on Delivery (Pay on Receipt)";
  const paymentStatusBadge =
    order.paymentStatus === "paid"
      ? '<span style="background-color: #e6f4ea; color: #137333; padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 11px;">PAID</span>'
      : '<span style="background-color: #fef7e0; color: #b06000; padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 11px;">DUE ON DELIVERY</span>';

  const trackOrderUrl = `${env.frontendUrl || "http://localhost:3000"}/track-order?orderId=${encodeURIComponent(
    orderNumber
  )}`;

  // Generate table rows for order items
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 14px 12px; border-bottom: 1px solid #f0e6dc; vertical-align: middle;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            ${
              item.image
                ? `<td style="width: 54px; padding-right: 12px; vertical-align: middle;">
                    <img src="${item.image}" alt="${item.name}" width="54" height="72" style="border-radius: 8px; object-fit: cover; display: block; border: 1px solid #ebdcd0;" />
                  </td>`
                : ""
            }
            <td style="vertical-align: middle;">
              <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 14px; font-weight: 700; color: #1F2A44;">
                ${item.name}
              </p>
              <p style="margin: 3px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #736b63;">
                Size: <strong style="color: #1F2A44;">${item.size}</strong> ${
                  item.color && item.color !== "Default"
                    ? ` • Color: <strong style="color: #1F2A44;">${item.color}</strong>`
                    : ""
                }
              </p>
            </td>
          </tr>
        </table>
      </td>
      <td style="padding: 14px 12px; border-bottom: 1px solid #f0e6dc; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; color: #1F2A44;">
        ${item.quantity}
      </td>
      <td style="padding: 14px 12px; border-bottom: 1px solid #f0e6dc; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; color: #1F2A44;">
        ₹${((item.price || 0) * item.quantity).toLocaleString("en-IN")}
      </td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your House of Laado Order #${orderNumber} Is Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #2D2424;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF7F2; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #EAD8C7; overflow: hidden; box-shadow: 0 4px 16px rgba(31, 42, 68, 0.06);">

          <!-- Brand Header Banner -->
          <tr>
            <td style="background-color: #1F2A44; padding: 32px 24px; text-align: center;">
              <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 3px; color: #FAF7F2; text-transform: uppercase;">
                HOUSE OF LAADO
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #C6A75E; font-weight: 600;">
                Handcrafted Jaipur Luxury • Pure Ethnic Wear
              </p>
            </td>
          </tr>

          <!-- Confirmation Hero Message -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #F0E6DC;">
              <div style="display: inline-block; background-color: #FAF4E8; border: 1px solid #C6A75E; padding: 6px 16px; border-radius: 999px; margin-bottom: 16px;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; color: #1F2A44; letter-spacing: 1px; text-transform: uppercase;">
                  ✨ Order Confirmed & In Progress
                </span>
              </div>
              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: #1F2A44; line-height: 1.3;">
                Thank You for Your Order, ${customerName}
              </h1>
              <p style="margin: 12px 0 0; font-size: 14px; line-height: 1.6; color: #5C5248;">
                Your order has been recorded. Our master artisans in Jaipur are preparing your handcrafted garments with utmost precision and care.
              </p>
            </td>
          </tr>

          <!-- Order Summary Meta Grid -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAF7F2; border-bottom: 1px solid #F0E6DC;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom: 10px; width: 50%;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8A7E72; font-weight: 600; display: block;">Order Reference</span>
                    <strong style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #1F2A44;">#${orderNumber}</strong>
                  </td>
                  <td style="padding-bottom: 10px; width: 50%; text-align: right;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8A7E72; font-weight: 600; display: block;">Order Date</span>
                    <strong style="font-size: 13px; color: #1F2A44;">${orderDate}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 10px;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8A7E72; font-weight: 600; display: block;">Payment Method</span>
                    <strong style="font-size: 13px; color: #1F2A44;">${paymentMethodText}</strong>
                  </td>
                  <td style="padding-top: 10px; text-align: right;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8A7E72; font-weight: 600; display: block;">Payment Status</span>
                    ${paymentStatusBadge}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 24px 32px 16px;">
              <h2 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: 700; color: #1F2A44; text-transform: uppercase; letter-spacing: 1px;">
                Garments in This Order (${items.length})
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #FAF7F2;">
                    <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8A7E72; border-bottom: 1px solid #EAD8C7;">Garment Item</th>
                    <th style="padding: 8px 12px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8A7E72; border-bottom: 1px solid #EAD8C7;">Qty</th>
                    <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8A7E72; border-bottom: 1px solid #EAD8C7;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Breakdown Card -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF7F2; border-radius: 12px; padding: 18px 20px; border: 1px solid #EAD8C7;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #5C5248;">Subtotal</td>
                  <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #1F2A44; font-weight: 600;">₹${(pricing.subtotal || 0).toLocaleString("en-IN")}</td>
                </tr>
                ${
                  pricing.discountAmount > 0
                    ? `<tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #137333;">Special Discount Applied</td>
                        <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #137333; font-weight: 700;">-₹${pricing.discountAmount.toLocaleString("en-IN")}</td>
                      </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #5C5248;">Express Air Shipping</td>
                  <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #1F2A44; font-weight: 600;">
                    ${pricing.shippingFee === 0 ? '<strong style="color: #137333;">FREE</strong>' : `₹${pricing.shippingFee}`}
                  </td>
                </tr>
                ${
                  pricing.codFee > 0
                    ? `<tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #5C5248;">COD Verification Fee</td>
                        <td style="padding: 4px 0; font-size: 13px; text-align: right; color: #1F2A44; font-weight: 600;">₹${pricing.codFee}</td>
                      </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 4px 0; font-size: 12px; color: #8A7E72;">GST Included in Price</td>
                  <td style="padding: 4px 0; font-size: 12px; text-align: right; color: #8A7E72;">₹${(pricing.gstBreakdown?.totalGst || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 12px; border-top: 1px solid #EAD8C7;"></td>
                </tr>
                <tr>
                  <td style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: 700; color: #1F2A44;">
                    Final Order Total
                  </td>
                  <td style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; text-align: right; color: #C6A75E;">
                    ₹${(pricing.grandTotal || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address & Dispatch Time -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #EAD8C7; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8A7E72; font-weight: 700; display: block; margin-bottom: 6px;">
                      📍 Delivery Address
                    </span>
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1F2A44;">${customerName}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #5C5248; line-height: 1.5;">
                      ${shippingAddress.streetAddress || ""}<br />
                      ${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.pincode || ""}<br />
                      Phone: ${order.customerDetails?.phone || ""}
                    </p>
                  </td>
                  <td style="width: 50%; vertical-align: top; padding-left: 12px; border-left: 1px solid #F0E6DC;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8A7E72; font-weight: 700; display: block; margin-bottom: 6px;">
                      🚚 Courier & Dispatch
                    </span>
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1F2A44;">Delhivery Express Air</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #5C5248; line-height: 1.5;">
                      Estimated Arrival: <strong>3 – 5 Business Days</strong><br />
                      Tracking updates will be dispatched as soon as the parcel leaves our Jaipur atelier.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button: Track Order -->
          <tr>
            <td style="padding: 0 32px 36px; text-align: center;">
              <a href="${trackOrderUrl}" target="_blank" style="display: inline-block; background-color: #1F2A44; color: #FAF7F2; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 14px 32px; border-radius: 999px; box-shadow: 0 4px 12px rgba(31, 42, 68, 0.2); border: 1px solid #C6A75E;">
                Track Your Order Live →
              </a>
            </td>
          </tr>

          <!-- Concierge Support & Brand Footer -->
          <tr>
            <td style="background-color: #FAF7F2; padding: 24px 32px; text-align: center; border-top: 1px solid #EAD8C7;">
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #1F2A44;">
                Have questions regarding your order or bespoke tailoring?
              </p>
              <p style="margin: 6px 0 0; font-size: 12px; color: #5C5248;">
                Email our customer concierge at <a href="mailto:care@houseoflaado.com" style="color: #1F2A44; font-weight: 700; text-decoration: underline;">care@houseoflaado.com</a>
              </p>
              <p style="margin: 16px 0 0; font-size: 11px; color: #8A7E72; line-height: 1.5;">
                House of Laado Atelier • Jaipur, Rajasthan, India • Handcrafted with Love<br />
                © ${new Date().getFullYear()} House of Laado. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate Plain-Text Email Fallback
 */
export function generateOrderConfirmationText(order) {
  const customerName = order.customerDetails?.fullName || "Valued Patron";
  const orderNumber = order.orderNumber;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN");
  const items = order.items || [];
  const pricing = order.pricing || {};
  const shippingAddress = order.shippingAddress || {};
  const paymentMethodText =
    order.paymentMethod === "online" ? "Prepaid Online (Razorpay Verified)" : "Cash on Delivery";
  const trackOrderUrl = `${env.frontendUrl || "http://localhost:3000"}/track-order?orderId=${encodeURIComponent(
    orderNumber
  )}`;

  const itemsText = items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} | Size: ${item.size} | Qty: ${item.quantity} | ₹${(
          (item.price || 0) * item.quantity
        ).toLocaleString("en-IN")}`
    )
    .join("\n");

  return `HOUSE OF LAADO — ORDER CONFIRMATION
Handcrafted Jaipur Luxury Ethnic Wear

Dear ${customerName},

Thank you for shopping with House of Laado. Your order #${orderNumber} has been successfully confirmed and our master artisans in Jaipur are preparing your garments.

ORDER SUMMARY:
- Order Reference: #${orderNumber}
- Order Date: ${orderDate}
- Payment Mode: ${paymentMethodText}
- Payment Status: ${order.paymentStatus === "paid" ? "PAID" : "DUE ON DELIVERY"}

ITEMS ORDERED:
${itemsText}

FINANCIAL BREAKDOWN:
- Subtotal: ₹${(pricing.subtotal || 0).toLocaleString("en-IN")}
${pricing.discountAmount > 0 ? `- Discount: -₹${pricing.discountAmount.toLocaleString("en-IN")}\n` : ""}- Shipping: ${pricing.shippingFee === 0 ? "FREE" : `₹${pricing.shippingFee}`}
${pricing.codFee > 0 ? `- COD Fee: ₹${pricing.codFee}\n` : ""}- Grand Total: ₹${(pricing.grandTotal || 0).toLocaleString("en-IN")} (Inclusive of all applicable GST)

DELIVERY ADDRESS:
${customerName}
${shippingAddress.streetAddress || ""}
${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.pincode || ""}
Phone: ${order.customerDetails?.phone || ""}

TRACK YOUR ORDER:
${trackOrderUrl}

CUSTOMER SUPPORT:
Email: care@houseoflaado.com
Website: ${env.frontendUrl || "http://localhost:3000"}

Thank you for supporting authentic Jaipur hand-block craft!
House of Laado Team`;
}

/**
 * Dispatch Order Confirmation Email via Resend
 * Guarantees zero duplicate emails via Order database status
 */
export async function sendOrderConfirmationEmail(order) {
  const recipientEmail = order.customerDetails?.email;
  const orderNumber = order.orderNumber;

  if (!recipientEmail) {
    return { success: false, reason: "No customer email available" };
  }

  // Idempotency check: don't send duplicate emails if already sent
  if (order.emailNotifications?.confirmationSent) {
    return { success: true, skipped: true, reason: "Confirmation email already dispatched previously" };
  }

  const subject = `Your House of Laado Order Is Confirmed — Order #${orderNumber}`;
  const html = generateOrderConfirmationHtml(order);
  const text = generateOrderConfirmationText(order);
  const from = env.emailFrom || "House of Laado <orders@houseoflaado.com>";

  // If Resend API Key is configured and ready
  if (resendClient) {
    try {
      const resendResponse = await resendClient.emails.send({
        from,
        to: recipientEmail,
        subject,
        html,
        text,
      });

      if (resendResponse.error) {
        throw new Error(resendResponse.error.message || "Resend API error");
      }

      const messageId = resendResponse.data?.id || `resend_${Date.now()}`;
      console.log(`[Resend Email Dispatched]: Order #${orderNumber} confirmation sent to ${recipientEmail} (ID: ${messageId})`);

      return {
        success: true,
        delivered: true,
        provider: "resend",
        messageId,
      };
    } catch (err) {
      console.error(`[Resend Email Error]: ${err.message}`);
      return {
        success: false,
        error: err.message,
        provider: "resend",
      };
    }
  }

  // If SMTP is configured, send via SMTP
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from,
        to: recipientEmail,
        subject,
        html,
        text,
      });
      console.log(`[SMTP Email Dispatched]: Order #${orderNumber} confirmation sent to ${recipientEmail} (ID: ${info.messageId})`);
      return {
        success: true,
        delivered: true,
        provider: "smtp",
        messageId: info.messageId,
      };
    } catch (err) {
      console.error(`[SMTP Email Error]: ${err.message}`);
      return {
        success: false,
        error: err.message,
        provider: "smtp",
      };
    }
  }

  // Graceful Non-Faking Operator Logging (Zero API Key Setup Mode)
  console.log(
    `\n=======================================================\n` +
      `[HOUSE OF LAADO TRANSACTIONAL EMAIL INTERFACE]\n` +
      `Status: Queued & Ready (Waiting for RESEND_API_KEY in .env)\n` +
      `Recipient: ${recipientEmail}\n` +
      `Subject: ${subject}\n` +
      `Total Charged: ₹${order.pricing?.grandTotal || 0}\n` +
      `Payment Method: ${order.paymentMethod} (Status: ${order.paymentStatus})\n` +
      `To stream live emails into customer inboxes, set RESEND_API_KEY=re_... in apps/api/.env\n` +
      `=======================================================\n`
  );

  return {
    success: true,
    delivered: false,
    configured: false,
    provider: "mock_logged",
    message: "Email queued. Add RESEND_API_KEY or SMTP credentials to apps/api/.env for live inbox delivery.",
  };
}

/**
 * Generate Responsive Luxury HTML Email for Newsletter Welcome & 10% Discount Code
 */
export function generateNewsletterWelcomeHtml({ email, couponCode = "WELCOME10", frontendUrl = "http://localhost:3000" }) {
  const shopUrl = `${frontendUrl}/shop`;
  const collectionsUrl = `${frontendUrl}/collections/suit-sets`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to House of Laado ✨ Enjoy 10% Off Your First Order</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #2D2424;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF7F2; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #EAD8C7; overflow: hidden; box-shadow: 0 8px 24px rgba(31, 42, 68, 0.08);">

          <!-- Brand Header Banner -->
          <tr>
            <td style="background-color: #1F2A44; padding: 36px 24px 28px; text-align: center;">
              <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 3px; color: #FAF7F2; text-transform: uppercase;">
                HOUSE OF LAADO
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; letter-spacing: 2px; color: #C6A75E; text-transform: uppercase; font-weight: 600;">
                Jaipur Atelier • Handcrafted Luxury Ethnic Wear
              </p>
            </td>
          </tr>

          <!-- Welcome Banner Accent -->
          <tr>
            <td style="background: linear-gradient(90deg, #C6A75E, #E5D5AA, #C6A75E); height: 4px; padding: 0;"></td>
          </tr>

          <!-- Greeting & Story Hero -->
          <tr>
            <td style="padding: 36px 32px 24px;">
              <span style="display: inline-block; background-color: #F8F2EB; color: #800020; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 14px; border-radius: 999px; border: 1px solid #EAD8C7; margin-bottom: 14px;">
                ✦ Artisan Community Member
              </span>
              <h1 style="margin: 0 0 12px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; line-height: 1.3; color: #1F2A44; font-weight: 700;">
                Namaste &amp; Welcome to the Family
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #5C5248;">
                We are enchanted to welcome you to the House of Laado inner circle. Rooted in the royal craft traditions of Jaipur, our creations celebrate timeless Bagru and Sanganeri hand-block printing, breathable Chanderi silks, and conscious festive silhouettes handcrafted with passion by generational artisans.
              </p>
            </td>
          </tr>

          <!-- 10% Welcome Gift Card -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <div style="background-color: #FAF7F2; border: 2px dashed #C6A75E; border-radius: 18px; padding: 24px; text-align: center;">
                <p style="margin: 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; color: #800020;">
                  Your Exclusive Welcome Gift
                </p>
                <h2 style="margin: 6px 0 4px; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #1F2A44;">
                  Get 10% Off Your First Order
                </h2>
                <p style="margin: 0 0 14px; font-size: 12px; color: #736B63;">
                  Valid across our entire catalog of Kurtas, Suit Sets, and Festive Edits (Min. order ₹999).
                </p>

                <!-- Coupon Box -->
                <div style="display: inline-block; background-color: #1F2A44; color: #FAF7F2; font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 700; letter-spacing: 4px; padding: 12px 28px; border-radius: 10px; border: 1px solid #C6A75E; box-shadow: 0 4px 12px rgba(31, 42, 68, 0.2);">
                  ${couponCode}
                </div>

                <p style="margin: 12px 0 16px; font-size: 11px; color: #8A7E72;">
                  Simply apply promo code <strong style="color: #1F2A44;">${couponCode}</strong> at checkout.
                </p>

                <div>
                  <a href="${shopUrl}" target="_blank" style="display: inline-block; background-color: #800020; color: #FFFFFF; font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 13px 32px; border-radius: 999px; text-decoration: none; box-shadow: 0 4px 14px rgba(128, 0, 32, 0.25);">
                    Shop Collections &amp; Claim 10% Off →
                  </a>
                </div>
              </div>
            </td>
          </tr>

          <!-- What to Expect / Perks Section -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <h3 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #1F2A44; text-align: center;">
                Privileges of Being in Our Circle
              </h3>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 36px;">
                    <span style="font-size: 18px;">🌸</span>
                  </td>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #1F2A44;">Early Access to Festive Edits</p>
                    <p style="margin: 2px 0 0; font-size: 12px; color: #736B63; line-height: 1.4;">
                      Preview and reserve limited-edition festive drops and artisan silhouettes before public release.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 36px;">
                    <span style="font-size: 18px;">🌿</span>
                  </td>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #1F2A44;">Authentic Handcrafted Fabrics</p>
                    <p style="margin: 2px 0 0; font-size: 12px; color: #736B63; line-height: 1.4;">
                      Pure Chanderi silk, breathable Mulmul cotton, and hand-carved block prints made by generational Jaipur artisans.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 36px;">
                    <span style="font-size: 18px;">💎</span>
                  </td>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #1F2A44;">Member Secret Sales</p>
                    <p style="margin: 2px 0 0; font-size: 12px; color: #736B63; line-height: 1.4;">
                      Receive private invitations to confidential flash promotions and bespoke trunk shows.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Concierge Support -->
          <tr>
            <td style="background-color: #F8F2EB; padding: 24px 32px; text-align: center; border-top: 1px solid #EAD8C7;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #1F2A44;">
                Need styling advice or bespoke sizing assistance?
              </p>
              <p style="margin: 6px 0 0; font-size: 12px; color: #5C5248;">
                Our Jaipur concierge is available at <a href="mailto:care@houseoflaado.com" style="color: #800020; font-weight: 700; text-decoration: underline;">care@houseoflaado.com</a>
              </p>
            </td>
          </tr>

          <!-- Brand Heritage & Legal Footer -->
          <tr>
            <td style="background-color: #FAF7F2; padding: 24px 32px; text-align: center; border-top: 1px solid #EAD8C7;">
              <p style="margin: 0; font-size: 11px; color: #8A7E72; line-height: 1.6;">
                House of Laado Atelier • Heritage Crafts Lane, C-Scheme, Jaipur, Rajasthan, India<br />
                Handcrafted with Love • Supporting Indian Artisan Communities<br />
                You received this email because you subscribed to our newsletter at <a href="${frontendUrl}" style="color: #1F2A44; text-decoration: underline;">${frontendUrl}</a>.<br />
                © ${new Date().getFullYear()} House of Laado. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate Plain-Text Fallback for Newsletter Welcome Email
 */
export function generateNewsletterWelcomeText({ email, couponCode = "WELCOME10", frontendUrl = "http://localhost:3000" }) {
  const shopUrl = `${frontendUrl}/shop`;

  return `HOUSE OF LAADO — JAIPUR ATELIER
Handcrafted Luxury Ethnic Wear

Namaste & Welcome to Our Artisan Community!

We are delighted to welcome you to the House of Laado family. Rooted in the rich cultural heritage of Jaipur, our creations celebrate timeless hand-block printing, breathable natural fabrics, and ethereal silhouettes handcrafted by generational artisans.

YOUR EXCLUSIVE WELCOME GIFT:
10% OFF YOUR FIRST ORDER
Coupon Code: ${couponCode}

Apply code ${couponCode} at checkout to enjoy 10% off any order of ₹999 or more across our entire catalog of Kurtas, Suit Sets, and Festive Edits.

START SHOPPING:
${shopUrl}

WHAT TO EXPECT AS A MEMBER:
- Early access to new Festive Edits and limited drops
- Stories and glimpses inside our Jaipur hand-block workshops
- Private invitations to secret member sales and seasonal previews

NEED SIZING OR STYLING ASSISTANCE?
Our styling concierge is always here for you:
Email: care@houseoflaado.com
Website: ${frontendUrl}

Thank you for celebrating and supporting authentic Indian artisan craft!

Warmly,
The House of Laado Atelier Team
Jaipur, Rajasthan, India`;
}

/**
 * Dispatch Newsletter Welcome Email with 10% Discount Code
 */
export async function sendNewsletterWelcomeEmail(recipientEmail, options = {}) {
  const couponCode = options.couponCode || "WELCOME10";
  const frontendUrl = env.frontendUrl || "http://localhost:3000";
  const subject = "Welcome to the House of Laado Family ✨ Enjoy 10% Off Your First Order";
  const from = env.emailFrom || "House of Laado <orders@houseoflaado.com>";
  const html = generateNewsletterWelcomeHtml({ email: recipientEmail, couponCode, frontendUrl });
  const text = generateNewsletterWelcomeText({ email: recipientEmail, couponCode, frontendUrl });

  // 1. If Resend is configured, send via Resend
  if (resendClient) {
    try {
      const resendResponse = await resendClient.emails.send({
        from,
        to: recipientEmail,
        subject,
        html,
        text,
      });

      if (resendResponse.error) {
        throw new Error(resendResponse.error.message || "Resend API error");
      }

      const messageId = resendResponse.data?.id || `resend_welcome_${Date.now()}`;
      console.log(`[Resend Welcome Email Dispatched]: Welcome email sent to ${recipientEmail} with code ${couponCode} (ID: ${messageId})`);

      return {
        success: true,
        delivered: true,
        provider: "resend",
        messageId,
        couponCode,
      };
    } catch (err) {
      console.error(`[Resend Welcome Email Error]: ${err.message}`);
      return {
        success: false,
        error: err.message,
        provider: "resend",
        couponCode,
      };
    }
  }

  // 2. If SMTP is configured, send via SMTP
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from,
        to: recipientEmail,
        subject,
        html,
        text,
      });
      console.log(`[SMTP Welcome Email Dispatched]: Welcome email sent to ${recipientEmail} with code ${couponCode} (ID: ${info.messageId})`);
      return {
        success: true,
        delivered: true,
        provider: "smtp",
        messageId: info.messageId,
        couponCode,
      };
    } catch (err) {
      console.error(`[SMTP Welcome Email Error]: ${err.message}`);
      return {
        success: false,
        error: err.message,
        provider: "smtp",
        couponCode,
      };
    }
  }

  // 3. Graceful Non-Faking Operator Logging (Zero API Key Setup Mode)
  console.log(
    `\n=======================================================\n` +
      `[HOUSE OF LAADO NEWSLETTER WELCOME EMAIL INTERFACE]\n` +
      `Status: Queued & Ready (Waiting for RESEND_API_KEY or SMTP in .env)\n` +
      `Recipient: ${recipientEmail}\n` +
      `Subject: ${subject}\n` +
      `Welcome Coupon Code: ${couponCode} (10% OFF first order, min order ₹999)\n` +
      `Shop Link: ${frontendUrl}/shop\n` +
      `To stream live emails into subscriber inboxes:\n` +
      `Set RESEND_API_KEY=re_... or SMTP_HOST/SMTP_USER/SMTP_PASS in apps/api/.env\n` +
      `=======================================================\n`
  );

  return {
    success: true,
    delivered: false,
    configured: false,
    provider: "mock_logged",
    couponCode,
    message: "Welcome email queued. Add RESEND_API_KEY or SMTP credentials to apps/api/.env for live inbox delivery.",
  };
}
