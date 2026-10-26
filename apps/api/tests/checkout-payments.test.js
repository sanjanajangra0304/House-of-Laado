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
  Shipment,
} from "../src/models/index.js";

const app = createApp();

describe("Phase 5: Checkout, Payments & Logistics Automated Tests", () => {
  let customerUser = null;
  let staffUser = null;
  let customerToken = "";
  let staffToken = "";
  let affordableProduct = null; // Under ₹1,000 (5% GST)
  let premiumProduct = null;    // Over ₹1,000 (12% GST)
  let testCategory = null;

  before(async () => {
    await connectDB();

    // 1. Create or get test users
    customerUser = await User.findOneAndUpdate(
      { email: "customer_p5@vastraloom.com" },
      {
        name: "Priya Sharma",
        email: "customer_p5@vastraloom.com",
        password: "CustomerPassword123!",
        role: "customer",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    staffUser = await User.findOneAndUpdate(
      { email: "staff_p5@vastraloom.com" },
      {
        name: "Logistics Manager",
        email: "staff_p5@vastraloom.com",
        password: "StaffPassword123!",
        role: "staff",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    customerToken = jwt.sign(
      { id: customerUser._id, role: customerUser.role, email: customerUser.email },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    staffToken = jwt.sign(
      { id: staffUser._id, role: staffUser.role, email: staffUser.email },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    // 2. Setup category and products with known price tiers for GST verification
    testCategory = await Category.findOneAndUpdate(
      { slug: "checkout-test-category" },
      {
        name: "Checkout Test Category",
        slug: "checkout-test-category",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    affordableProduct = await Product.findOneAndUpdate(
      { slug: "cotton-casual-dupatta-test" },
      {
        name: "Cotton Casual Dupatta",
        slug: "cotton-casual-dupatta-test",
        sku: "VL-DUP-001",
        category: testCategory._id,
        categorySlug: "checkout-test-category",
        fabric: "Pure Cotton",
        description: "Handcrafted pure cotton dupatta from Jaipur artisans.",
        sellingPrice: 800, // Under ₹1,000 -> 5% GST
        mrp: 1200,
        stock: 50,
        isActive: true,
        status: "active",
        isArchived: false,
        primaryImage: "https://example.com/dupatta.jpg",
        images: ["https://example.com/dupatta.jpg"],
        variants: [
          { sku: "VL-DUP-001-FS", size: "Free Size", color: "Indigo", stock: 50 },
        ],
      },
      { upsert: true, new: true }
    );

    premiumProduct = await Product.findOneAndUpdate(
      { slug: "anarkali-silk-suit-set-test" },
      {
        name: "Anarkali Silk Suit Set",
        slug: "anarkali-silk-suit-set-test",
        sku: "VL-SUIT-002",
        category: testCategory._id,
        categorySlug: "checkout-test-category",
        fabric: "Chanderi Silk",
        description: "Regal Chanderi silk suit set with hand embroidery.",
        sellingPrice: 3500, // Over ₹1,000 -> 12% GST
        mrp: 4999,
        stock: 20,
        isActive: true,
        status: "active",
        isArchived: false,
        primaryImage: "https://example.com/suit.jpg",
        images: ["https://example.com/suit.jpg"],
        variants: [
          { sku: "VL-SUIT-002-M", size: "M", color: "Maroon", stock: 20 },
        ],
      },
      { upsert: true, new: true }
    );
  });

  after(async () => {
    // Cleanup test data
    await Order.deleteMany({ "customerDetails.email": "customer_p5@vastraloom.com" });
    await InventoryReservation.deleteMany({ userId: customerUser?._id });
    await WebhookEvent.deleteMany({ eventId: /^evt_test_/ });
    await disconnectDB();
  });

  // 1. PINCODE SERVICEABILITY
  describe("Pincode Serviceability & Postal Zones", () => {
    test("GET /api/v1/orders/serviceability/:pincode - returns delivery estimate for Rajasthan hub", async () => {
      const res = await request(app).get("/api/v1/orders/serviceability/302029");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.serviceable, true);
      assert.ok(res.body.data.zone.includes("Rajasthan"));
      assert.ok(res.body.data.estimatedDays);
    });

    test("GET /api/v1/orders/serviceability/:pincode - returns delivery estimate for Delhi NCR", async () => {
      const res = await request(app).get("/api/v1/orders/serviceability/110001");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.serviceable, true);
      assert.ok(res.body.data.zone.includes("Delhi"));
    });

    test("GET /api/v1/orders/serviceability/:pincode - rejects invalid 5-digit PIN code", async () => {
      const res = await request(app).get("/api/v1/orders/serviceability/12345");
      assert.equal(res.status, 200);
      assert.equal(res.body.data.serviceable, false);
      assert.ok(res.body.data.message);
    });

    test("GET /api/v1/orders/serviceability/:pincode - rejects PIN code starting with 0", async () => {
      const res = await request(app).get("/api/v1/orders/serviceability/012345");
      assert.equal(res.status, 200);
      assert.equal(res.body.data.serviceable, false);
    });
  });

  // 2. COD RULES & RESTRICTIONS
  describe("Cash on Delivery (COD) Rules", () => {
    test("POST /api/v1/orders/checkout - rejects COD orders exceeding ₹5,000 threshold", async () => {
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          customerDetails: {
            fullName: "Priya Sharma",
            email: "customer_p5@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "402 Royal Palms, MI Road",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302001",
          },
          items: [
            {
              product: premiumProduct._id.toString(),
              name: premiumProduct.name,
              price: premiumProduct.sellingPrice,
              size: "M",
              color: "Maroon",
              quantity: 2, // 2 * 3500 = 7000 > 5000
              image: "https://example.com/suit.jpg",
            },
          ],
          paymentMethod: "cod",
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "COD_LIMIT_EXCEEDED");
    });

    test("POST /api/v1/orders/checkout - applies flat ₹50 fee on eligible COD orders", async () => {
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          customerDetails: {
            fullName: "Priya Sharma",
            email: "customer_p5@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "402 Royal Palms, MI Road",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302001",
          },
          items: [
            {
              product: affordableProduct._id.toString(),
              name: affordableProduct.name,
              price: affordableProduct.sellingPrice,
              size: "Free Size",
              color: "Indigo",
              quantity: 1, // 800 <= 5000
              image: "https://example.com/dupatta.jpg",
            },
          ],
          paymentMethod: "cod",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.order.paymentMethod, "cod");
      assert.equal(res.body.data.order.pricing.codFee, 50);
      // Under ₹999 shipping is ₹99, plus ₹50 COD fee, subtotal 800 -> 800 + 99 + 50 = 949
      assert.equal(res.body.data.order.pricing.grandTotal, 949);
    });
  });

  // 3. GST CALCULATION & INVENTORY RESERVATION
  describe("GST Calculation, Inventory Reservation & Online Checkout", () => {
    let createdOrderNumber = "";
    let razorpayOrderId = "";

    test("POST /api/v1/orders/checkout - accurate dual GST tier calculation (5% & 12%)", async () => {
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          customerDetails: {
            fullName: "Priya Sharma",
            email: "customer_p5@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "402 Royal Palms, MI Road",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302001",
          },
          items: [
            {
              product: affordableProduct._id.toString(),
              name: affordableProduct.name,
              price: 800, // < 1000: 5% GST -> 800 - (800 / 1.05) = 38.09 -> 38
              size: "Free Size",
              color: "Indigo",
              quantity: 1,
              image: "https://example.com/dupatta.jpg",
            },
            {
              product: premiumProduct._id.toString(),
              name: premiumProduct.name,
              price: 3500, // >= 1000: 12% GST -> 3500 - (3500 / 1.12) = 375
              size: "M",
              color: "Maroon",
              quantity: 1,
              image: "https://example.com/suit.jpg",
            },
          ],
          paymentMethod: "online",
          gstin: "08AABCV1234F1Z5",
          deliveryInstructions: "Leave with building security guard",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      const { order, razorpayOrder } = res.body.data;
      createdOrderNumber = order.orderNumber;
      razorpayOrderId = razorpayOrder.id;

      // Verify GST breakdown
      assert.equal(order.pricing.gstBreakdown.gst5, 38);
      assert.equal(order.pricing.gstBreakdown.gst12, 375);
      assert.equal(order.pricing.gstBreakdown.totalGst, 38 + 375);
      assert.equal(order.gstin, "08AABCV1234F1Z5");
      assert.equal(order.deliveryInstructions, "Leave with building security guard");

      // Verify 15-minute Inventory Reservation record
      const reservation = await InventoryReservation.findOne({
        checkoutSessionId: order.orderNumber,
      });
      assert.ok(reservation, "Inventory reservation must exist");
      assert.equal(reservation.status, "active");
      assert.ok(reservation.expiresAt > new Date());
    });

    test("POST /api/v1/orders/verify-payment - marks order as confirmed and captured", async () => {
      const paymentId = "pay_test_phase5_12345";
      const validSignature = crypto
        .createHmac("sha256", env.razorpayKeySecret)
        .update(`${razorpayOrderId}|${paymentId}`)
        .digest("hex");

      const res = await request(app)
        .post("/api/v1/orders/verify-payment")
        .send({
          orderId: createdOrderNumber,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.paymentStatus, "paid");
      assert.equal(res.body.data.orderStatus, "confirmed");

      // Verify Payment record
      const paymentRecord = await Payment.findOne({
        orderNumber: createdOrderNumber,
      });
      assert.ok(paymentRecord, "Payment record must be created");
      assert.equal(paymentRecord.status, "captured");

      // Verify Inventory Reservation marked as completed
      const reservation = await InventoryReservation.findOne({
        checkoutSessionId: createdOrderNumber,
      });
      assert.equal(reservation.status, "completed");
    });
  });

  // 4. RAZORPAY WEBHOOK IDEMPOTENCY
  describe("Razorpay Webhook Handling & Idempotency", () => {
    let webhookOrderId = "";
    let webhookOrderNumber = "";

    before(async () => {
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .send({
          customerDetails: {
            fullName: "Priya Sharma",
            email: "customer_p5@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "402 Royal Palms, MI Road",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302001",
          },
          items: [
            {
              product: affordableProduct._id.toString(),
              name: affordableProduct.name,
              price: affordableProduct.sellingPrice,
              size: "Free Size",
              color: "Indigo",
              quantity: 2,
              image: "https://example.com/dupatta.jpg",
            },
          ],
          paymentMethod: "online",
        });

      webhookOrderNumber = res.body.data.order.orderNumber;
      webhookOrderId = res.body.data.razorpayOrder.id;
    });

    test("POST /api/v1/orders/webhook/razorpay - processes payment.captured event", async () => {
      const eventId = `evt_test_captured_${Date.now()}`;
      const res = await request(app)
        .post("/api/v1/orders/webhook/razorpay")
        .set("x-razorpay-event-id", eventId)
        .send({
          id: eventId,
          event: "payment.captured",
          payload: {
            payment: {
              entity: {
                id: `pay_webhook_${Date.now()}`,
                order_id: webhookOrderId,
                receipt: webhookOrderNumber,
                amount: 152000,
              },
            },
          },
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.status, "ok");
      assert.equal(res.body.result.status, "processed");

      // Verify order is now marked paid
      const order = await Order.findOne({ orderNumber: webhookOrderNumber });
      assert.equal(order.paymentStatus, "paid");
      assert.equal(order.orderStatus, "confirmed");
    });

    test("POST /api/v1/orders/webhook/razorpay - returns already_processed for duplicate event delivery", async () => {
      const eventId = `evt_test_idempotency_${Date.now()}`;

      // First delivery
      const res1 = await request(app)
        .post("/api/v1/orders/webhook/razorpay")
        .set("x-razorpay-event-id", eventId)
        .send({
          id: eventId,
          event: "order.paid",
          payload: {
            order: {
              entity: {
                id: webhookOrderId,
                receipt: webhookOrderNumber,
              },
            },
          },
        });

      assert.equal(res1.status, 200);
      assert.equal(res1.body.result.status, "processed");

      // Second duplicate delivery
      const res2 = await request(app)
        .post("/api/v1/orders/webhook/razorpay")
        .set("x-razorpay-event-id", eventId)
        .send({
          id: eventId,
          event: "order.paid",
          payload: {
            order: {
              entity: {
                id: webhookOrderId,
                receipt: webhookOrderNumber,
              },
            },
          },
        });

      assert.equal(res2.status, 200);
      assert.equal(res2.body.result.status, "already_processed");
      assert.equal(res2.body.result.eventId, eventId);
    });
  });

  // 5. AUTOMATIC SHIPMENT CREATION
  describe("Automatic Shipment Manifestation on Status Transition", () => {
    let orderToShip = null;

    before(async () => {
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .send({
          customerDetails: {
            fullName: "Priya Sharma",
            email: "customer_p5@vastraloom.com",
            phone: "9876543210",
          },
          shippingAddress: {
            streetAddress: "402 Royal Palms, MI Road",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302001",
          },
          items: [
            {
              product: affordableProduct._id.toString(),
              name: affordableProduct.name,
              price: affordableProduct.sellingPrice,
              size: "Free Size",
              color: "Indigo",
              quantity: 1,
              image: "https://example.com/dupatta.jpg",
            },
          ],
          paymentMethod: "cod",
        });

      orderToShip = res.body.data.order;
    });

    test("PATCH /api/v1/orders/:id/status - auto-generates shipment when order is marked 'packed'", async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/${orderToShip._id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          orderStatus: "packed",
          note: "Artisans packed handloom garment in eco-friendly cotton bag",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.orderStatus, "packed");
      assert.ok(res.body.data.tracking.trackingNumber, "Tracking number must be populated");
      assert.equal(res.body.data.tracking.courierName, "Delhivery Express");

      // Verify Shipment model record
      const shipment = await Shipment.findOne({ order: orderToShip._id });
      assert.ok(shipment, "Shipment record must be generated in database");
      assert.equal(shipment.courierName, "Delhivery Express");
      assert.ok(shipment.awbNumber);
      assert.equal(shipment.status, "pickup_scheduled");
    });
  });
});
