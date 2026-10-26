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
  Payment,
  ReturnRequest,
  AuditLog,
} from "../src/models/index.js";

const app = createApp();

describe("Order Cancellation, Returns & Verified Refunds Automated Tests", () => {
  let customerA = null;
  let customerB = null;
  let adminUser = null;
  let tokenCustomerA = "";
  let tokenCustomerB = "";
  let tokenAdmin = "";

  let testCategory = null;
  let testProduct = null;

  before(async () => {
    await connectDB();

    // 1. Setup Customer A
    customerA = await User.findOneAndUpdate(
      { email: "priya_returns_a@houseoflaado.com" },
      {
        name: "Priya Sharma",
        email: "priya_returns_a@houseoflaado.com",
        password: "CustomerPassword123!",
        role: "customer",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // 2. Setup Customer B (for IDOR attack tests)
    customerB = await User.findOneAndUpdate(
      { email: "ananya_returns_b@houseoflaado.com" },
      {
        name: "Ananya Roy",
        email: "ananya_returns_b@houseoflaado.com",
        password: "CustomerPassword123!",
        role: "customer",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // 3. Setup Admin User
    adminUser = await User.findOneAndUpdate(
      { email: "concierge_admin@houseoflaado.com" },
      {
        name: "Atelier Concierge Lead",
        email: "concierge_admin@houseoflaado.com",
        password: "AdminPassword123!",
        role: "admin",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    tokenCustomerA = jwt.sign(
      { id: customerA._id, role: customerA.role, email: customerA.email },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    tokenCustomerB = jwt.sign(
      { id: customerB._id, role: customerB.role, email: customerB.email },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    tokenAdmin = jwt.sign(
      { id: adminUser._id, role: adminUser.role, email: adminUser.email },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    // 4. Setup Test Category
    testCategory = await Category.findOneAndUpdate(
      { slug: "returns-test-category" },
      {
        name: "Returns Test Category",
        slug: "returns-test-category",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // 5. Setup Test Product with inventory
    testProduct = await Product.findOneAndUpdate(
      { slug: "jaipur-blockprint-anarkali-test" },
      {
        name: "Jaipur Blockprint Anarkali Suit",
        slug: "jaipur-blockprint-anarkali-test",
        sku: "HOL-ANAR-001",
        category: testCategory._id,
        categorySlug: "returns-test-category",
        sellingPrice: 2499,
        mrp: 3499,
        stock: 50,
        isActive: true,
        status: "active",
        isArchived: false,
        primaryImage: "https://example.com/anarkali.jpg",
        images: ["https://example.com/anarkali.jpg"],
        variants: [
          { sku: "HOL-ANAR-001-M", size: "M", color: "Ruby Red", stock: 25 },
          { sku: "HOL-ANAR-001-L", size: "L", color: "Ruby Red", stock: 25 },
        ],
      },
      { upsert: true, new: true }
    );
  });

  after(async () => {
    // Clean up test records
    await Order.deleteMany({
      "customerDetails.email": {
        $in: ["priya_returns_a@houseoflaado.com", "ananya_returns_b@houseoflaado.com"],
      },
    });
    await ReturnRequest.deleteMany({
      "customerDetails.email": {
        $in: ["priya_returns_a@houseoflaado.com", "ananya_returns_b@houseoflaado.com"],
      },
    });
    await disconnectDB();
  });

  // ---------------------------------------------------------------------------
  // 1. ORDER CANCELLATION TESTS
  // ---------------------------------------------------------------------------

  test("1. Customer can cancel an eligible order ('placed' status) and stock is restored exactly once", async () => {
    // Record initial inventory
    const prodBefore = await Product.findById(testProduct._id);
    const initialMainStock = prodBefore.stock;
    const initialVarStock = prodBefore.variants.find((v) => v.size === "M").stock;

    // Create an eligible order for Customer A
    const order = await Order.create({
      orderNumber: `ORD-TEST-CAN-01-${Date.now()}`,
      user: customerA._id,
      customerDetails: {
        fullName: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Johari Bazaar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          sku: "HOL-ANAR-001-M",
          name: testProduct.name,
          size: "M",
          color: "Ruby Red",
          price: 2499,
          quantity: 2,
          image: "https://example.com/anarkali.jpg",
        },
      ],
      pricing: {
        subtotal: 4998,
        discountAmount: 0,
        shippingFee: 0,
        taxAmount: 250,
        grandTotal: 4998,
      },
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "placed",
    });

    // Deduct stock to simulate checkout reservation
    await Product.updateOne(
      { _id: testProduct._id, "variants.size": "M" },
      {
        $inc: {
          stock: -2,
          "variants.$.stock": -2,
        },
      }
    );

    // Cancel order as Customer A
    const res = await request(app)
      .post(`/api/v1/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({ reason: "Changed my mind about the event outfit" })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.orderStatus, "cancelled");
    assert.equal(res.body.data.cancellation.reason, "Changed my mind about the event outfit");
    assert.ok(
      res.body.data.cancellation.cancelledBy.includes("priya_returns_a") ||
      res.body.data.cancellation.cancelledBy === "customer"
    );

    // Verify inventory restored exactly once
    const prodAfter = await Product.findById(testProduct._id);
    assert.equal(prodAfter.stock, initialMainStock);
    const varAfter = prodAfter.variants.find((v) => v.size === "M").stock;
    assert.equal(varAfter, initialVarStock);
  });

  test("2. Customer cannot cancel another user's order (IDOR Protection: 403 Forbidden)", async () => {
    // Create order owned by Customer A
    const orderA = await Order.create({
      orderNumber: `ORD-TEST-IDOR-${Date.now()}`,
      user: customerA._id,
      customerDetails: {
        fullName: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Johari Bazaar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          sku: "HOL-ANAR-001-M",
          name: testProduct.name,
          size: "M",
          color: "Ruby Red",
          price: 2499,
          quantity: 1,
          image: "https://example.com/anarkali.jpg",
        },
      ],
      pricing: { grandTotal: 2499, subtotal: 2499 },
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "placed",
    });

    // Customer B tries to cancel Customer A's order
    const res = await request(app)
      .post(`/api/v1/orders/${orderA._id}/cancel`)
      .set("Authorization", `Bearer ${tokenCustomerB}`)
      .send({ reason: "Malicious attempt to cancel other user's order" })
      .expect(403);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "FORBIDDEN");

    // Verify order remains placed
    const checkOrder = await Order.findById(orderA._id);
    assert.equal(checkOrder.orderStatus, "placed");
  });

  test("3. Cancellation is strictly blocked for ineligible states ('dispatched', 'delivered')", async () => {
    // Create dispatched order
    const dispatchedOrder = await Order.create({
      orderNumber: `ORD-TEST-DISP-${Date.now()}`,
      user: customerA._id,
      customerDetails: {
        fullName: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Johari Bazaar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          sku: "HOL-ANAR-001-M",
          name: testProduct.name,
          size: "M",
          color: "Ruby Red",
          price: 2499,
          quantity: 1,
          image: "https://example.com/anarkali.jpg",
        },
      ],
      pricing: { grandTotal: 2499, subtotal: 2499 },
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "dispatched",
    });

    // Attempt cancellation
    const res = await request(app)
      .post(`/api/v1/orders/${dispatchedOrder._id}/cancel`)
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({ reason: "Too late cancellation" })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.ok(
      ["ORDER_NOT_CANCELLABLE", "INVALID_STATE"].includes(res.body.error.code)
    );
  });

  test("4. Duplicate cancellation does not restore stock twice or trigger repeated refunds", async () => {
    const order = await Order.create({
      orderNumber: `ORD-TEST-DUP-CAN-${Date.now()}`,
      user: customerA._id,
      customerDetails: {
        fullName: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Johari Bazaar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          sku: "HOL-ANAR-001-M",
          name: testProduct.name,
          size: "M",
          color: "Ruby Red",
          price: 2499,
          quantity: 1,
          image: "https://example.com/anarkali.jpg",
        },
      ],
      pricing: { grandTotal: 2499, subtotal: 2499 },
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "placed",
    });

    // First cancellation succeeds
    await request(app)
      .post(`/api/v1/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({ reason: "First cancellation request" })
      .expect(200);

    const stockAfterFirst = (await Product.findById(testProduct._id)).stock;

    // Second cancellation attempt must be rejected with 400
    const res2 = await request(app)
      .post(`/api/v1/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({ reason: "Duplicate second cancellation request" })
      .expect(400);

    assert.equal(res2.body.success, false);
    assert.ok(
      ["ORDER_ALREADY_CANCELLED", "INVALID_STATE"].includes(res2.body.error.code)
    );

    // Stock must remain unchanged
    const stockAfterSecond = (await Product.findById(testProduct._id)).stock;
    assert.equal(stockAfterFirst, stockAfterSecond);
  });

  test("5. Prepaid order cancellation works without active Razorpay, queues refund for manual admin review, and does not falsely claim completed refund", async () => {
    const order = await Order.create({
      orderNumber: `ORD-TEST-PREPAID-CAN-${Date.now()}`,
      user: customerA._id,
      customerDetails: {
        fullName: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Johari Bazaar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          sku: "HOL-ANAR-001-M",
          name: testProduct.name,
          size: "M",
          color: "Ruby Red",
          price: 2499,
          quantity: 1,
          image: "https://example.com/anarkali.jpg",
        },
      ],
      pricing: { grandTotal: 2499, subtotal: 2499 },
      paymentMethod: "online",
      paymentStatus: "paid",
      razorpayDetails: { paymentId: `pay_test_${Date.now()}` },
      orderStatus: "placed",
    });

    // Record mock payment in DB
    await Payment.create({
      order: order._id,
      orderNumber: order.orderNumber,
      paymentMethod: "online",
      amount: 2499,
      currency: "INR",
      status: "captured",
      razorpayPaymentId: order.razorpayDetails.paymentId,
    });

    const res = await request(app)
      .post(`/api/v1/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({ reason: "Customer cancelled prepaid order" });

    if (res.status !== 200) {
      console.log("Subtest 5 Failure:", JSON.stringify(res.body));
    }
    assert.equal(res.status, 200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.orderStatus, "cancelled");
    assert.equal(res.body.data.cancellation.refundStatus, "pending");
    assert.equal(res.body.data.cancellation.refundAmount, 2499);
    assert.equal(res.body.data.cancellation.refundId, null);
  });

  // ---------------------------------------------------------------------------
  // 2. RETURNS & EXCHANGES TESTS
  // ---------------------------------------------------------------------------

  test("6. Return request succeeds only for eligible delivered items within 7-day window", async () => {
    // Delivered 2 days ago (within 7-day window)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const deliveredOrder = await Order.create({
      orderNumber: `ORD-TEST-RET-OK-${Date.now()}`,
      user: customerA._id,
      customerDetails: {
        fullName: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Johari Bazaar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          sku: "HOL-ANAR-001-M",
          name: testProduct.name,
          size: "M",
          color: "Ruby Red",
          price: 2499,
          quantity: 2,
          image: "https://example.com/anarkali.jpg",
        },
      ],
      pricing: { grandTotal: 4998, subtotal: 4998 },
      paymentMethod: "cod",
      paymentStatus: "paid",
      orderStatus: "delivered",
      statusHistory: [
        { status: "placed", changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { status: "delivered", changedAt: twoDaysAgo },
      ],
    });

    const res = await request(app)
      .post(`/api/v1/orders/${deliveredOrder._id}/return`)
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({
        type: "return_refund",
        reason: "Size is too tight / fit issue",
        description: "Tags intact, unworn, request reverse pickup",
        items: [
          {
            product: testProduct._id.toString(),
            name: testProduct.name,
            size: "M",
            color: "Ruby Red",
            price: 2499,
            quantity: 1, // Returning 1 out of 2
          },
        ],
        payoutDetails: {
          method: "upi",
          upiId: "priya@okhdfcbank",
        },
      })
      .expect(201);

    assert.equal(res.body.success, true);
    const retData = res.body.data.returnRequest || res.body.data;
    assert.equal(retData.status, "requested");
    assert.equal(retData.refundAmount, 2499);
    assert.ok(retData.requestId.startsWith("RET-"));

    // Verify order state was updated to return_requested
    const updatedOrder = await Order.findById(deliveredOrder._id);
    assert.equal(updatedOrder.orderStatus, "return_requested");
  });

  test("7. Return request fails if 7-day policy window has expired", async () => {
    // Delivered 10 days ago (outside 7-day window)
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    const expiredOrder = await Order.create({
      orderNumber: `ORD-TEST-RET-EXP-${Date.now()}`,
      user: customerA._id,
      customerDetails: {
        fullName: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Johari Bazaar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          sku: "HOL-ANAR-001-M",
          name: testProduct.name,
          size: "M",
          color: "Ruby Red",
          price: 2499,
          quantity: 1,
          image: "https://example.com/anarkali.jpg",
        },
      ],
      pricing: { grandTotal: 2499, subtotal: 2499 },
      paymentMethod: "cod",
      paymentStatus: "paid",
      orderStatus: "delivered",
      statusHistory: [{ status: "delivered", changedAt: tenDaysAgo }],
    });

    const res = await request(app)
      .post(`/api/v1/orders/${expiredOrder._id}/return`)
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({
        type: "return_refund",
        reason: "Late return attempt",
        items: [
          {
            product: testProduct._id.toString(),
            name: testProduct.name,
            size: "M",
            price: 2499,
            quantity: 1,
          },
        ],
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "RETURN_WINDOW_EXPIRED");
  });

  test("8. Return request fails if requested quantity exceeds purchased quantity", async () => {
    const order = await Order.create({
      orderNumber: `ORD-TEST-RET-QTY-${Date.now()}`,
      user: customerA._id,
      customerDetails: {
        fullName: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Johari Bazaar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          sku: "HOL-ANAR-001-M",
          name: testProduct.name,
          size: "M",
          price: 2499,
          quantity: 1, // Only 1 purchased
          image: "https://example.com/anarkali.jpg",
        },
      ],
      pricing: { grandTotal: 2499, subtotal: 2499 },
      paymentMethod: "cod",
      paymentStatus: "paid",
      orderStatus: "delivered",
      statusHistory: [{ status: "delivered", changedAt: new Date() }],
    });

    const res = await request(app)
      .post(`/api/v1/orders/${order._id}/return`)
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({
        type: "return_refund",
        reason: "Excess quantity test",
        items: [
          {
            product: testProduct._id.toString(),
            name: testProduct.name,
            size: "M",
            price: 2499,
            quantity: 5, // Trying to return 5
          },
        ],
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "INVALID_RETURN_QUANTITY");
  });

  test("9. Customer cannot perform admin status updates on return requests (403 Forbidden)", async () => {
    const returnReq = await ReturnRequest.create({
      requestId: `RET-TEST-SEC-${Date.now()}`,
      order: (await Order.findOne({ user: customerA._id }))._id,
      user: customerA._id,
      orderNumber: "ORD-TEST-SEC",
      customerDetails: {
        name: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          size: "M",
          price: 2499,
          quantity: 1,
        },
      ],
      refundAmount: 2499,
      type: "return_refund",
      reason: "Security test",
      status: "requested",
    });

    // Customer attempts to self-approve and mark completed
    const res = await request(app)
      .patch(`/api/v1/orders/returns/requests/${returnReq._id}`)
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({ status: "completed" })
      .expect(403);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "FORBIDDEN");
  });

  test("10. Admin can approve return, schedule reverse pickup, pass inspection, and process settlement", async () => {
    const order = await Order.create({
      orderNumber: `ORD-TEST-ADMIN-SETTLE-${Date.now()}`,
      user: customerA._id,
      customerDetails: {
        fullName: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Johari Bazaar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          sku: "HOL-ANAR-001-M",
          name: testProduct.name,
          size: "M",
          price: 2499,
          quantity: 1,
          image: "https://example.com/anarkali.jpg",
        },
      ],
      pricing: { grandTotal: 2499, subtotal: 2499 },
      paymentMethod: "cod",
      paymentStatus: "paid",
      orderStatus: "delivered",
      statusHistory: [{ status: "delivered", changedAt: new Date() }],
    });

    const returnReq = await ReturnRequest.create({
      requestId: `RET-ADMIN-LIFECYCLE-${Date.now()}`,
      order: order._id,
      user: customerA._id,
      orderNumber: order.orderNumber,
      customerDetails: {
        name: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          size: "M",
          price: 2499,
          quantity: 1,
          image: "https://example.com/anarkali.jpg",
        },
      ],
      refundAmount: 2499,
      type: "return_refund",
      reason: "Size fit",
      status: "requested",
      payoutDetails: {
        method: "bank_transfer",
        accountHolderName: "Priya Sharma",
        accountNumber: "987654321098",
        bankName: "HDFC Bank",
        ifscCode: "HDFC0001234",
      },
    });

    // Step A: Admin approves and schedules pickup
    const stepA = await request(app)
      .patch(`/api/v1/orders/returns/requests/${returnReq._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        status: "pickup_scheduled",
        pickupTracking: {
          courierName: "Delhivery Reverse",
          trackingNumber: "REV-DLH-992341",
        },
        decisionReason: "Approved for doorstep quality inspection",
      })
      .expect(200);

    assert.equal(stepA.body.data.status, "pickup_scheduled");
    assert.equal(stepA.body.data.pickupTracking.trackingNumber, "REV-DLH-992341");

    // Step B: Admin marks inspection passed
    const stepB = await request(app)
      .patch(`/api/v1/orders/returns/requests/${returnReq._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        status: "inspection_passed",
        inspectionNotes: "Garment tags intact, verified brand new unworn state",
      })
      .expect(200);

    assert.equal(stepB.body.data.status, "inspection_passed");

    // Step C: Admin processes COD settlement with verified bank UTR
    const stepC = await request(app)
      .post(`/api/v1/orders/returns/requests/${returnReq._id}/refund`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        refundMethod: "manual_bank_transfer",
        payoutReference: "UTR-HDFC-9928341029",
        notes: "Refund transferred via NEFT to customer HDFC account",
      })
      .expect(200);

    assert.equal(stepC.body.data.status, "completed");
    assert.equal(stepC.body.data.refundDetails.refundId, "UTR-HDFC-9928341029");
    assert.equal(stepC.body.data.refundDetails.status, "processed");

    // Step D: Verify order status updated to returned
    const finalOrder = await Order.findById(order._id);
    assert.equal(finalOrder.orderStatus, "returned");
  });

  test("11. Refund processing rejects attempt without verified payout reference for COD orders", async () => {
    const returnReq = await ReturnRequest.create({
      requestId: `RET-COD-FAIL-${Date.now()}`,
      order: (await Order.findOne({ user: customerA._id }))._id,
      user: customerA._id,
      orderNumber: "ORD-COD-FAIL",
      customerDetails: {
        name: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          size: "M",
          price: 2499,
          quantity: 1,
        },
      ],
      refundAmount: 2499,
      type: "return_refund",
      reason: "Fit test",
      status: "inspection_passed",
      payoutDetails: {
        method: "bank_transfer",
        accountNumber: "1234567890",
      },
    });

    // Attempt refund without payoutReference
    const res = await request(app)
      .post(`/api/v1/orders/returns/requests/${returnReq._id}/refund`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        refundMethod: "manual_bank_transfer",
        // Missing payoutReference
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "MISSING_PAYOUT_REFERENCE");
  });

  test("12. Razorpay webhook 'refund.processed' idempotently updates payment and order records", async () => {
    const rzpPaymentId = `pay_hook_${Date.now()}`;
    const rzpRefundId = `rfnd_hook_${Date.now()}`;

    const order = await Order.create({
      orderNumber: `ORD-HOOK-REFUND-${Date.now()}`,
      user: customerA._id,
      customerDetails: {
        fullName: customerA.name,
        email: customerA.email,
        phone: "+91 9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Johari Bazaar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          sku: "HOL-ANAR-001-M",
          name: testProduct.name,
          size: "M",
          price: 2499,
          quantity: 1,
          image: "https://example.com/anarkali.jpg",
        },
      ],
      pricing: { grandTotal: 2499, subtotal: 2499 },
      paymentMethod: "online",
      paymentStatus: "paid",
      razorpayDetails: { paymentId: rzpPaymentId },
      orderStatus: "return_requested",
    });

    const payment = await Payment.create({
      order: order._id,
      orderNumber: order.orderNumber,
      paymentMethod: "online",
      amount: 2499,
      currency: "INR",
      status: "captured",
      razorpayPaymentId: rzpPaymentId,
    });

    // Construct valid HMAC-SHA256 signature for webhook
    const webhookPayload = JSON.stringify({
      event: "refund.processed",
      payload: {
        refund: {
          entity: {
            id: rzpRefundId,
            payment_id: rzpPaymentId,
            amount: 249900, // paise
            status: "processed",
          },
        },
      },
    });

    const signature = crypto
      .createHmac("sha256", env.razorpayWebhookSecret || "rzp_webhook_secret_dev_32char_key")
      .update(webhookPayload)
      .digest("hex");

    const res = await request(app)
      .post("/api/v1/orders/webhook/razorpay")
      .set("x-razorpay-signature", signature)
      .set("Content-Type", "application/json")
      .send(webhookPayload)
      .expect(200);

    assert.equal(res.body.status, "ok");

    // Verify payment updated to refunded
    const updatedPayment = await Payment.findById(payment._id);
    assert.equal(updatedPayment.status, "refunded");

    // Verify duplicate webhook does not fail and remains idempotent
    const resDup = await request(app)
      .post("/api/v1/orders/webhook/razorpay")
      .set("x-razorpay-signature", signature)
      .set("Content-Type", "application/json")
      .send(webhookPayload)
      .expect(200);

    assert.equal(resDup.body.status, "ok");
  });

  test("15. Multi-Customer Order Lifecycle: Active placement, cancellation separation, and COD no fake refund", async () => {
    // A. Setup test products and stock
    const itemStock = 10;
    const multiProd = await Product.create({
      name: `Multi Customer Silk Ensemble ${Date.now()}`,
      slug: `multi-customer-silk-${Date.now()}`,
      sku: `MCS-${Date.now()}`,
      category: testCategory._id,
      categorySlug: "returns-test-category",
      price: 3999,
      sellingPrice: 3499,
      mrp: 4999,
      stock: itemStock,
      variants: [
        { size: "S", sku: `MCS-${Date.now()}-S`, stock: 5, color: "Burgundy" },
        { size: "M", sku: `MCS-${Date.now()}-M`, stock: 5, color: "Burgundy" },
      ],
      primaryImage: "https://example.com/multi.jpg",
      images: ["https://example.com/multi.jpg"],
      description: "Handcrafted pure silk ensemble",
      fabric: "Pure Silk",
      status: "active",
      isActive: true,
    });

    // B. Customer A places a COD order
    const orderResA = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({
        customerDetails: {
          fullName: "Priya Sharma",
          email: "priya_returns_a@houseoflaado.com",
          phone: "+91 9876543210",
        },
        shippingAddress: {
          streetAddress: "10 Rajpath",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        items: [
          {
            product: multiProd._id.toString(),
            name: multiProd.name,
            price: 3499,
            size: "S",
            color: "Burgundy",
            quantity: 1,
            image: "https://example.com/multi.jpg",
          },
        ],
        paymentMethod: "cod",
      })
      .expect(201);

    const orderA = orderResA.body.data.order;
    assert.equal(orderA.orderStatus, "placed");
    assert.equal(orderA.cancellation, null, "Newly placed Order A must have cancellation: null");

    // C. Customer B places an order with uppercase email
    const orderResB = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${tokenCustomerB}`)
      .send({
        customerDetails: {
          fullName: "Ananya Roy",
          email: "ANANYA_RETURNS_B@HOUSEOFLAADO.COM",
          phone: "+91 9876543211",
        },
        shippingAddress: {
          streetAddress: "25 Park Street",
          city: "Kolkata",
          state: "West Bengal",
          pincode: "700016",
        },
        items: [
          {
            product: multiProd._id.toString(),
            name: multiProd.name,
            price: 3499,
            size: "M",
            color: "Burgundy",
            quantity: 1,
            image: "https://example.com/multi.jpg",
          },
        ],
        paymentMethod: "cod",
      })
      .expect(201);

    const orderB = orderResB.body.data.order;
    assert.equal(orderB.orderStatus, "placed");
    assert.equal(orderB.cancellation, null, "Newly placed Order B must have cancellation: null");

    // D. Verify Admin Dashboard Filtering: Neither newly placed order appears in Cancellations
    const adminOrdersRes = await request(app)
      .get("/api/v1/orders")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .expect(200);

    const allOrders = adminOrdersRes.body.data;
    const filterCancellations = (ords) =>
      ords.filter(
        (o) =>
          o.orderStatus === "cancelled" ||
          Boolean(o.cancellation?.cancelledAt || (o.cancellation?.reason && o.cancellation.reason.trim()))
      );

    const cancelledListBefore = filterCancellations(allOrders);
    const orderAInCancelled = cancelledListBefore.some((o) => o._id.toString() === orderA._id.toString());
    const orderBInCancelled = cancelledListBefore.some((o) => o._id.toString() === orderB._id.toString());
    assert.equal(orderAInCancelled, false, "Order A must not appear in cancellations table when newly placed");
    assert.equal(orderBInCancelled, false, "Order B must not appear in cancellations table when newly placed");

    // E. Customer A sees their active order in /my/orders
    const custAOrdersRes = await request(app)
      .get("/api/v1/orders/my/orders")
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .expect(200);
    const custAOrders = custAOrdersRes.body.data;
    assert.ok(custAOrders.some((o) => o.orderNumber === orderA.orderNumber));

    // F. Customer B sees their active order in /my/orders (case-insensitive email matching)
    const custBOrdersRes = await request(app)
      .get("/api/v1/orders/my/orders")
      .set("Authorization", `Bearer ${tokenCustomerB}`)
      .expect(200);
    const custBOrders = custBOrdersRes.body.data;
    assert.ok(custBOrders.some((o) => o.orderNumber === orderB.orderNumber));

    // G. Customer A cancels their order
    const cancelResA = await request(app)
      .post(`/api/v1/orders/${orderA._id}/cancel`)
      .set("Authorization", `Bearer ${tokenCustomerA}`)
      .send({ reason: "Ordered duplicate by mistake" })
      .expect(200);

    assert.equal(cancelResA.body.data.orderStatus, "cancelled");
    assert.equal(cancelResA.body.data.cancellation.reason, "Ordered duplicate by mistake");
    assert.equal(cancelResA.body.data.cancellation.refundStatus, "not_applicable");
    assert.equal(cancelResA.body.data.cancellation.refundAmount, 0);

    // H. Verify Customer B's order remains strictly active ('placed') and cancellable
    const checkB = await Order.findById(orderB._id);
    assert.equal(checkB.orderStatus, "placed");
    assert.equal(checkB.cancellation, null);

    // I. Verify Admin Dashboard Filtering after Customer A cancels
    const adminOrdersResAfter = await request(app)
      .get("/api/v1/orders")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .expect(200);
    const cancelledListAfter = filterCancellations(adminOrdersResAfter.body.data);

    const orderAInCancelledAfter = cancelledListAfter.some((o) => o._id.toString() === orderA._id.toString());
    const orderBInCancelledAfter = cancelledListAfter.some((o) => o._id.toString() === orderB._id.toString());
    assert.equal(orderAInCancelledAfter, true, "Genuinely cancelled Order A must now appear in cancellations");
    assert.equal(orderBInCancelledAfter, false, "Uncancelled Order B must still NOT appear in cancellations");

    // J. Customer B now cancels their own order
    const cancelResB = await request(app)
      .post(`/api/v1/orders/${orderB._id}/cancel`)
      .set("Authorization", `Bearer ${tokenCustomerB}`)
      .send({ reason: "Need to change shipping address" })
      .expect(200);

    assert.equal(cancelResB.body.data.orderStatus, "cancelled");
    assert.equal(cancelResB.body.data.cancellation.reason, "Need to change shipping address");
    assert.equal(cancelResB.body.data.cancellation.refundStatus, "not_applicable");
    assert.equal(cancelResB.body.data.cancellation.refundAmount, 0);
  });

  describe("Admin Fast Test Order Deletion & Bulk Deletion Security & Stock Integrity", () => {
    let testOrderSingle = null;
    let testOrderBulk1 = null;
    let testOrderBulk2 = null;
    let genuineOrder = null;
    let initialStock = 0;

    before(async () => {
      // Record initial stock of test product
      const p = await Product.findById(testProduct._id);
      initialStock = p.stock;

      // Create isolated test order 1 (placed status, decrements stock by 1)
      testOrderSingle = await Order.create({
        orderNumber: `ORD-TEST-DEL-1-${Date.now()}`,
        isTestOrder: true,
        user: customerA._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.name,
            sku: testProduct.variants[0].sku,
            size: testProduct.variants[0].size,
            color: testProduct.variants[0].color,
            price: 2500,
            quantity: 1,
            subtotal: 2500,
            image: "https://example.com/item.jpg",
          },
        ],
        pricing: { subtotal: 2500, itemsTotal: 2500, shippingFee: 0, discount: 0, tax: 0, grandTotal: 2500 },
        paymentMethod: "cod",
        paymentStatus: "pending",
        orderStatus: "placed",
        shippingAddress: {
          streetAddress: "123 Atelier Street",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          country: "India",
        },
        customerDetails: { fullName: "Automated Test User", email: "test_bot_del1@vastraloom.internal", phone: "9876543210" },
      });
      // Simulate inventory decrement for placed order
      await Product.findByIdAndUpdate(testProduct._id, { $inc: { stock: -1 } });

      // Create isolated test order 2 (confirmed status, decrements stock by 2)
      testOrderBulk1 = await Order.create({
        orderNumber: `ORD-TEST-DEL-2-${Date.now()}`,
        isTestOrder: true,
        user: customerA._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.name,
            sku: testProduct.variants[0].sku,
            size: testProduct.variants[0].size,
            color: testProduct.variants[0].color,
            price: 2500,
            quantity: 2,
            subtotal: 5000,
            image: "https://example.com/item.jpg",
          },
        ],
        pricing: { subtotal: 5000, itemsTotal: 5000, shippingFee: 0, discount: 0, tax: 0, grandTotal: 5000 },
        paymentMethod: "cod",
        paymentStatus: "pending",
        orderStatus: "confirmed",
        shippingAddress: {
          streetAddress: "123 Atelier Street",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          country: "India",
        },
        customerDetails: { fullName: "Automated Test User", email: "test_bot_del2@vastraloom.internal", phone: "9876543211" },
      });
      await Product.findByIdAndUpdate(testProduct._id, { $inc: { stock: -2 } });

      // Create isolated test order 3 (cancelled status - stock was already restored)
      testOrderBulk2 = await Order.create({
        orderNumber: `ORD-TEST-DEL-3-${Date.now()}`,
        isTestOrder: true,
        user: customerA._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.name,
            sku: testProduct.variants[0].sku,
            size: testProduct.variants[0].size,
            color: testProduct.variants[0].color,
            price: 2500,
            quantity: 1,
            subtotal: 2500,
            image: "https://example.com/item.jpg",
          },
        ],
        pricing: { subtotal: 2500, itemsTotal: 2500, shippingFee: 0, discount: 0, tax: 0, grandTotal: 2500 },
        paymentMethod: "cod",
        paymentStatus: "pending",
        orderStatus: "cancelled",
        cancellation: {
          cancelledAt: new Date(),
          reason: "Customer cancelled prior to dispatch",
          refundStatus: "not_applicable",
          refundAmount: 0,
        },
        shippingAddress: {
          streetAddress: "123 Atelier Street",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          country: "India",
        },
        customerDetails: { fullName: "Automated Test User", email: "test_bot_del3@vastraloom.internal", phone: "9876543212" },
      });

      // Create genuine live customer order that must NOT be touched
      genuineOrder = await Order.create({
        orderNumber: `HOL-REAL-${Date.now()}`,
        isTestOrder: false,
        user: customerB._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.name,
            sku: testProduct.variants[0].sku,
            size: testProduct.variants[0].size,
            color: testProduct.variants[0].color,
            price: 2500,
            quantity: 1,
            subtotal: 2500,
            image: "https://example.com/item.jpg",
          },
        ],
        pricing: { subtotal: 2500, itemsTotal: 2500, shippingFee: 0, discount: 0, tax: 0, grandTotal: 2500 },
        paymentMethod: "cod",
        paymentStatus: "pending",
        orderStatus: "confirmed",
        shippingAddress: {
          streetAddress: "456 Heritage Enclave",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          country: "India",
        },
        customerDetails: { fullName: "Real Customer Neha", email: "neha_genuine@gmail.com", phone: "9820012345" },
      });
    });

    test("1. Customer cannot access DELETE /api/v1/orders/:id (Forbidden)", async () => {
      const res = await request(app)
        .delete(`/api/v1/orders/${testOrderSingle._id}`)
        .set("Authorization", `Bearer ${tokenCustomerA}`)
        .expect(403);
      assert.ok(res.body.error);
    });

    test("2. Customer cannot access POST /api/v1/orders/bulk-delete (Forbidden)", async () => {
      const res = await request(app)
        .post("/api/v1/orders/bulk-delete")
        .set("Authorization", `Bearer ${tokenCustomerA}`)
        .send({ orderIds: [testOrderSingle._id] })
        .expect(403);
      assert.ok(res.body.error);
    });

    test("3. Unauthenticated requests to bulk-delete are rejected (401 Unauthorized)", async () => {
      const res = await request(app)
        .post("/api/v1/orders/bulk-delete")
        .send({ orderIds: [testOrderSingle._id] })
        .expect(401);
      assert.ok(res.body.error);
    });

    test("4. Admin can quickly delete a single test order and stock is safely restored once", async () => {
      const stockBefore = (await Product.findById(testProduct._id)).stock;

      const res = await request(app)
        .delete(`/api/v1/orders/${testOrderSingle._id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.deleted, true);

      // Verify order is removed from database
      const checkOrder = await Order.findById(testOrderSingle._id);
      assert.equal(checkOrder, null);

      // Verify stock was restored (+1 for the placed order)
      const stockAfter = (await Product.findById(testProduct._id)).stock;
      assert.equal(stockAfter, stockBefore + 1);

      // Verify audit log exists
      const auditLog = await AuditLog.findOne({
        action: "DELETE_ORDER",
        resourceId: testOrderSingle._id.toString(),
      });
      assert.ok(auditLog);
      assert.equal(auditLog.changes.orderNumber, testOrderSingle.orderNumber);
    });

    test("5. Admin can bulk delete multiple test orders and stock is restored only when required", async () => {
      const stockBefore = (await Product.findById(testProduct._id)).stock;

      const res = await request(app)
        .post("/api/v1/orders/bulk-delete")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ orderIds: [testOrderBulk1._id, testOrderBulk2._id] })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.deletedCount, 2);

      // Verify both orders removed
      const check1 = await Order.findById(testOrderBulk1._id);
      const check2 = await Order.findById(testOrderBulk2._id);
      assert.equal(check1, null);
      assert.equal(check2, null);

      // Verify stock: testOrderBulk1 was 'confirmed' (qty 2) -> restored +2.
      // testOrderBulk2 was 'cancelled' -> NOT restored to prevent duplicate restoration!
      const stockAfter = (await Product.findById(testProduct._id)).stock;
      assert.equal(stockAfter, stockBefore + 2);

      // Verify bulk audit log exists
      const bulkLog = await AuditLog.findOne({
        action: "BULK_DELETE_ORDERS",
      }).sort({ createdAt: -1 });
      assert.ok(bulkLog);
      const hasOrderNumbers = bulkLog.changes?.orderNumbers?.includes(testOrderBulk1.orderNumber);
      const hasOrderIds = bulkLog.changes?.body?.orderIds?.includes(testOrderBulk1._id.toString());
      assert.ok(hasOrderNumbers || hasOrderIds, "Audit log must contain deleted order reference");
    });

    test("6. Genuine customer order remains completely untouched", async () => {
      const checkGenuine = await Order.findById(genuineOrder._id);
      assert.ok(checkGenuine);
      assert.equal(checkGenuine.orderNumber, genuineOrder.orderNumber);
      assert.equal(checkGenuine.customerDetails.email, "neha_genuine@gmail.com");
      assert.equal(checkGenuine.orderStatus, "confirmed");

      // Clean up genuine test order
      await Order.findByIdAndDelete(genuineOrder._id);
    });
  });
});
