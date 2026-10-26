process.env.NODE_ENV = "test";
import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import {
  User,
  Product,
  Category,
  Order,
  InventoryReservation,
  WebhookEvent,
  Payment,
} from "../src/models/index.js";
import { releaseExpiredOnlineOrders } from "../src/modules/orders/order.service.js";

const app = createApp();

describe("Razorpay Security, Idempotency & Standard Checkout Verification Tests", () => {
  let customerUser = null;
  let customerToken = "";
  let testCategory = null;
  let testProduct = null;

  before(async () => {
    await connectDB();

    customerUser = await User.findOneAndUpdate(
      { email: "customer_razorpay@vastraloom.com" },
      {
        name: "Meera Rathore",
        email: "customer_razorpay@vastraloom.com",
        password: "CustomerPassword123!",
        role: "customer",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    customerToken = jwt.sign(
      { id: customerUser._id, role: customerUser.role, email: customerUser.email },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    testCategory = await Category.findOneAndUpdate(
      { slug: "razorpay-test-category" },
      {
        name: "Razorpay Test Category",
        slug: "razorpay-test-category",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    testProduct = await Product.findOneAndUpdate(
      { slug: "handblock-cotton-kurta-rzp" },
      {
        name: "Handblock Pure Cotton Kurta",
        slug: "handblock-cotton-kurta-rzp",
        sku: "HOL-KURTA-001",
        category: testCategory._id,
        categorySlug: "razorpay-test-category",
        fabric: "Pure Cotton",
        description: "Artisan block print kurta",
        sellingPrice: 1500,
        mrp: 2200,
        stock: 30,
        isActive: true,
        status: "active",
        isArchived: false,
        primaryImage: "https://example.com/kurta.jpg",
        images: ["https://example.com/kurta.jpg"],
        variants: [
          { sku: "HOL-KURTA-001-M", size: "M", color: "Ruby Red", stock: 15 },
          { sku: "HOL-KURTA-001-L", size: "L", color: "Ruby Red", stock: 15 },
        ],
      },
      { upsert: true, new: true }
    );
  });

  after(async () => {
    await Order.deleteMany({ "customerDetails.email": "customer_razorpay@vastraloom.com" });
    await InventoryReservation.deleteMany({ userId: customerUser?._id });
    await WebhookEvent.deleteMany({ eventId: /^evt_rzp_sec_/ });
    await disconnectDB();
  });

  // 1. ONLINE CHECKOUT & SERVER-SIDE CALCULATION
  describe("Server-Side Order Calculation & Razorpay Order Generation", () => {
    test("Calculates total on server ignoring browser price tampering and applies 5% prepaid discount", async () => {
      const initialStock = testProduct.stock;
      const initialVariantStock = testProduct.variants[0].stock;

      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          customerDetails: {
            fullName: "Meera Rathore",
            email: "customer_razorpay@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "12 Johari Bazaar",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302003",
          },
          items: [
            {
              product: testProduct._id.toString(),
              name: testProduct.name,
              price: 1, // Tampered browser price (real is 1500)
              size: "M",
              color: "Ruby Red",
              quantity: 2,
              image: "https://example.com/kurta.jpg",
            },
          ],
          paymentMethod: "online",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      const { order, razorpayOrder, keyId } = res.body.data;

      // Real subtotal must be 1500 * 2 = 3000
      assert.equal(order.pricing.subtotal, 3000);
      // 5% instant discount = 3000 * 0.05 = 150
      assert.equal(order.pricing.discountAmount, 150);
      // Free shipping over ₹999 -> 0
      assert.equal(order.pricing.shippingFee, 0);
      // Online -> 0 codFee
      assert.equal(order.pricing.codFee, 0);
      // Grand total = 3000 - 150 = 2850
      assert.equal(order.pricing.grandTotal, 2850);
      assert.equal(order.paymentStatus, "pending");
      assert.equal(order.orderStatus, "placed");
      assert.equal(order.paymentMethod, "online");

      // Razorpay order created with amount in paise
      assert.ok(razorpayOrder);
      assert.equal(razorpayOrder.amount, 285000); // 2850 * 100 paise
      assert.equal(razorpayOrder.currency, "INR");
      assert.ok(keyId);

      // Verify stock was safely decremented
      const updatedProduct = await Product.findById(testProduct._id);
      assert.equal(updatedProduct.stock, initialStock - 2);
      const updatedVariant = updatedProduct.variants.find((v) => v.size === "M");
      assert.equal(updatedVariant.stock, initialVariantStock - 2);
    });

    test("Rejects checkout if requested quantity exceeds variant stock", async () => {
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          customerDetails: {
            fullName: "Meera Rathore",
            email: "customer_razorpay@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "12 Johari Bazaar",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302003",
          },
          items: [
            {
              product: testProduct._id.toString(),
              name: testProduct.name,
              price: 1500,
              size: "M",
              color: "Ruby Red",
              quantity: 999, // Exceeds available stock
              image: "https://example.com/kurta.jpg",
            },
          ],
          paymentMethod: "online",
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "OUT_OF_STOCK");
    });
  });

  // 2. SIGNATURE & TAMPERING VERIFICATION
  describe("Payment Verification Security & Tamper Proofing", () => {
    let orderNumber = "";
    let razorpayOrderId = "";

    before(async () => {
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          customerDetails: {
            fullName: "Meera Rathore",
            email: "customer_razorpay@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "12 Johari Bazaar",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302003",
          },
          items: [
            {
              product: testProduct._id.toString(),
              name: testProduct.name,
              price: 1500,
              size: "L",
              color: "Ruby Red",
              quantity: 1,
              image: "https://example.com/kurta.jpg",
            },
          ],
          paymentMethod: "online",
        });

      orderNumber = res.body.data.order.orderNumber;
      razorpayOrderId = res.body.data.razorpayOrder.id;
    });

    test("Rejects invalid cryptographic signature (400 PAYMENT_VERIFICATION_FAILED)", async () => {
      const res = await request(app)
        .post("/api/v1/orders/verify-payment")
        .send({
          orderId: orderNumber,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: "pay_tampered_12345",
          razorpaySignature: "invalid_forged_hex_signature_abcdef1234567890abcdef1234567890abcdef12",
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "PAYMENT_VERIFICATION_FAILED");

      // Verify order remains pending
      const order = await Order.findOne({ orderNumber });
      assert.equal(order.paymentStatus, "pending");
      assert.equal(order.orderStatus, "placed");
    });

    test("Rejects mock, fake, or non-HMAC signatures immediately (400 PAYMENT_VERIFICATION_FAILED)", async () => {
      const res = await request(app)
        .post("/api/v1/orders/verify-payment")
        .send({
          orderId: orderNumber,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: "pay_fake_simulation_12345",
          razorpaySignature: "mock_signature_verified",
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "PAYMENT_VERIFICATION_FAILED");
    });

    test("Rejects payment verification when required parameters are missing (400 INVALID_PAYMENT_DETAILS)", async () => {
      const res = await request(app)
        .post("/api/v1/orders/verify-payment")
        .send({
          orderId: orderNumber,
          razorpayOrderId: razorpayOrderId,
          // Missing paymentId and signature
        });

      assert.equal(res.status, 400);
      assert.ok(
        res.body.error.code === "VALIDATION_ERROR" ||
          res.body.error.code === "INVALID_PAYMENT_DETAILS"
      );
    });

    test("Rejects order ID mismatch when payment belongs to a different order (400 ORDER_MISMATCH)", async () => {
      const diffOrderId = "order_different_order_99999";
      const diffPaymentId = "pay_test_phase5_different";
      const diffSignature = crypto
        .createHmac("sha256", env.razorpayKeySecret)
        .update(`${diffOrderId}|${diffPaymentId}`)
        .digest("hex");

      const res = await request(app)
        .post("/api/v1/orders/verify-payment")
        .send({
          orderId: orderNumber,
          razorpayOrderId: diffOrderId,
          razorpayPaymentId: diffPaymentId,
          razorpaySignature: diffSignature,
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "ORDER_MISMATCH");
    });

    test("Successfully verifies valid payment with authentic HMAC signature and idempotently handles duplicate verification", async () => {
      const paymentId = `pay_test_phase5_${Date.now()}`;
      const validSignature = crypto
        .createHmac("sha256", env.razorpayKeySecret)
        .update(`${razorpayOrderId}|${paymentId}`)
        .digest("hex");

      // 1. Initial valid verification
      const res1 = await request(app)
        .post("/api/v1/orders/verify-payment")
        .send({
          orderId: orderNumber,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
        });

      assert.equal(res1.status, 200);
      assert.equal(res1.body.success, true);
      assert.equal(res1.body.data.paymentStatus, "paid");
      assert.equal(res1.body.data.orderStatus, "confirmed");

      // Verify Payment record was created
      const payment = await Payment.findOne({ orderNumber });
      assert.ok(payment);
      assert.equal(payment.status, "captured");

      // 2. Duplicate verification callback (Idempotency)
      const res2 = await request(app)
        .post("/api/v1/orders/verify-payment")
        .send({
          orderId: orderNumber,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
        });

      assert.equal(res2.status, 200);
      assert.equal(res2.body.success, true);
      assert.equal(res2.body.data.paymentStatus, "paid");

      // Verify stock was not deducted twice
      const paymentsCount = await Payment.countDocuments({ orderNumber });
      assert.equal(paymentsCount, 1, "Duplicate payment records must not be created");
    });
  });

  // 3. CASH ON DELIVERY & SEPARATION OF CONCERNS
  describe("COD Workflow Integrity & Protection", () => {
    let codOrderNumber = "";

    test("Creates COD order with pending status and ₹50 verification fee", async () => {
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          customerDetails: {
            fullName: "Meera Rathore",
            email: "customer_razorpay@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "12 Johari Bazaar",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302003",
          },
          items: [
            {
              product: testProduct._id.toString(),
              name: testProduct.name,
              price: 1500,
              size: "L",
              color: "Ruby Red",
              quantity: 1,
              image: "https://example.com/kurta.jpg",
            },
          ],
          paymentMethod: "cod",
        });

      assert.equal(res.status, 201);
      const { order, razorpayOrder } = res.body.data;
      codOrderNumber = order.orderNumber;

      assert.equal(order.paymentMethod, "cod");
      assert.equal(order.paymentStatus, "pending");
      assert.equal(order.pricing.codFee, 50);
      assert.equal(razorpayOrder, null);
    });

    test("Rejects online payment verification on a COD order (400 INVALID_PAYMENT_METHOD)", async () => {
      const codPaymentId = "pay_test_fake_cod";
      const codOrderId = "order_fake_cod_test";
      const codSignature = crypto
        .createHmac("sha256", env.razorpayKeySecret)
        .update(`${codOrderId}|${codPaymentId}`)
        .digest("hex");

      const res = await request(app)
        .post("/api/v1/orders/verify-payment")
        .send({
          orderId: codOrderNumber,
          razorpayOrderId: codOrderId,
          razorpayPaymentId: codPaymentId,
          razorpaySignature: codSignature,
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "INVALID_PAYMENT_METHOD");

      // Verify COD order is still pending
      const order = await Order.findOne({ orderNumber: codOrderNumber });
      assert.equal(order.paymentStatus, "pending");
    });
  });

  // 4. WEBHOOK CRYPTOGRAPHIC SIGNATURE & IDEMPOTENCY
  describe("Razorpay Webhooks & Raw-Body Verification", () => {
    let webhookOrderId = "";
    let webhookOrderNumber = "";

    before(async () => {
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .send({
          customerDetails: {
            fullName: "Meera Rathore",
            email: "customer_razorpay@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "12 Johari Bazaar",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302003",
          },
          items: [
            {
              product: testProduct._id.toString(),
              name: testProduct.name,
              price: 1500,
              size: "L",
              color: "Ruby Red",
              quantity: 1,
              image: "https://example.com/kurta.jpg",
            },
          ],
          paymentMethod: "online",
        });

      webhookOrderNumber = res.body.data.order.orderNumber;
      webhookOrderId = res.body.data.razorpayOrder.id;
    });

    test("Rejects webhook with forged signature (400 invalid_signature)", async () => {
      const payload = JSON.stringify({
        id: `evt_rzp_sec_bad_${Date.now()}`,
        event: "payment.captured",
        payload: {},
      });

      const res = await request(app)
        .post("/api/v1/orders/webhook/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", "forged_signature_1234567890abcdef")
        .send(payload);

      assert.equal(res.status, 400);
      assert.equal(res.body.status, "invalid_signature");
    });

    test("Accepts webhook with authentic cryptographic HMAC signature and processes payment.captured", async () => {
      const eventId = `evt_rzp_sec_good_${Date.now()}`;
      const payloadObj = {
        id: eventId,
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: `pay_webhook_valid_${Date.now()}`,
              order_id: webhookOrderId,
              receipt: webhookOrderNumber,
              amount: 142500, // 1500 - 5% = 1425 in paise
              method: "upi",
            },
          },
        },
      };

      const payloadStr = JSON.stringify(payloadObj);
      const signature = crypto
        .createHmac("sha256", env.razorpayWebhookSecret)
        .update(payloadStr)
        .digest("hex");

      const res = await request(app)
        .post("/api/v1/orders/webhook/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .set("x-razorpay-event-id", eventId)
        .send(payloadStr);

      assert.equal(res.status, 200);
      assert.equal(res.body.status, "ok");
      assert.equal(res.body.result.status, "processed");

      const order = await Order.findOne({ orderNumber: webhookOrderNumber });
      assert.equal(order.paymentStatus, "paid");
      assert.equal(order.orderStatus, "confirmed");
    });
  });

  // 5. ABANDONED ONLINE PAYMENTS & STOCK RELEASE
  describe("Abandoned Online Payments & Inventory Release Policy", () => {
    test("releaseExpiredOnlineOrders safely releases inventory and auto-cancels abandoned orders", async () => {
      const prodBefore = await Product.findById(testProduct._id);
      const initialStock = prodBefore.stock;
      const initialVariantStock = prodBefore.variants.find((v) => v.size === "M").stock;

      // Create an order
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .send({
          customerDetails: {
            fullName: "Meera Rathore",
            email: "customer_razorpay@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "12 Johari Bazaar",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302003",
          },
          items: [
            {
              product: testProduct._id.toString(),
              name: testProduct.name,
              price: 1500,
              size: "M",
              color: "Ruby Red",
              quantity: 2,
              image: "https://example.com/kurta.jpg",
            },
          ],
          paymentMethod: "online",
        });

      const abandonedOrderNumber = res.body.data.order.orderNumber;

      // Simulate order created 45 minutes ago via direct MongoDB collection update
      await Order.collection.updateOne(
        { orderNumber: abandonedOrderNumber },
        { $set: { createdAt: new Date(Date.now() - 45 * 60 * 1000) } }
      );

      // Trigger stock release routine for orders older than 30 minutes
      const result = await releaseExpiredOnlineOrders(30);

      assert.ok(result.orders.includes(abandonedOrderNumber));

      // Verify order is now cancelled and failed
      const order = await Order.findOne({ orderNumber: abandonedOrderNumber });
      assert.equal(order.orderStatus, "cancelled");
      assert.equal(order.paymentStatus, "failed");

      // Verify product stock and variant stock restored
      const prod = await Product.findById(testProduct._id);
      assert.equal(prod.stock, initialStock);
      const variant = prod.variants.find((v) => v.size === "M");
      assert.equal(variant.stock, initialVariantStock);
    });
  });
});
