import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db.js";
import {
  User,
  Product,
  Category,
  Order,
  Payment,
  Shipment,
  ReturnRequest,
  Review,
  Coupon,
  Banner,
  HomepageSection,
  Page,
  BlogPost,
  NewsletterSubscriber,
  ContactMessage,
  Setting,
  InventoryReservation,
  Cart,
  Wishlist,
  AuditLog,
  RefreshToken,
  Counter,
  OtpRequest,
  WebhookEvent,
} from "../src/models/index.js";

describe("Phase 3: Database & Mongoose Models Architecture Tests", () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await disconnectDB();
  });

  test("1. All 24 models are properly exported from models barrel", () => {
    const models = [
      User,
      Product,
      Category,
      Order,
      Payment,
      Shipment,
      ReturnRequest,
      Review,
      Coupon,
      Banner,
      HomepageSection,
      Page,
      BlogPost,
      NewsletterSubscriber,
      ContactMessage,
      Setting,
      InventoryReservation,
      Cart,
      Wishlist,
      AuditLog,
      RefreshToken,
      Counter,
      OtpRequest,
      WebhookEvent,
    ];

    assert.equal(models.length, 24, "Should have exactly 24 registered models");
    for (const m of models) {
      assert.ok(m, "Model should be defined");
      assert.ok(m.prototype instanceof mongoose.Model, `${m.modelName} should be a valid Mongoose model`);
    }
  });

  test("2. User model supports role hierarchy: owner, admin, staff, customer", async () => {
    const validRoles = ["owner", "admin", "staff", "customer"];
    for (const role of validRoles) {
      const u = new User({
        name: `Test ${role}`,
        email: `test_${role}_${Date.now()}@vastraloom.com`,
        password: "ValidPassword123!",
        role,
      });
      const err = u.validateSync();
      assert.equal(err, undefined, `Role '${role}' should be valid`);
    }

    const invalidUser = new User({
      name: "Invalid Role User",
      email: "invalid_role@vastraloom.com",
      password: "ValidPassword123!",
      role: "super_superuser", // invalid role
    });
    const err = invalidUser.validateSync();
    assert.ok(err?.errors?.role, "Invalid role should fail validation");
  });

  test("3. Product model validates embedded variants schema", () => {
    const product = new Product({
      name: "Chanderi Zari Suit Set",
      slug: "chanderi-zari-suit-set-" + Date.now(),
      category: new mongoose.Types.ObjectId(),
      categorySlug: "suit-sets",
      fabric: "Chanderi Silk",
      description: "Fine handcrafted set",
      sellingPrice: 2499,
      compareAtPrice: 3999,
      primaryImage: "https://example.com/chanderi.jpg",
      variants: [
        {
          sku: "VSTR-CHAND-S",
          size: "S",
          color: "Burgundy Wine",
          stock: 15,
          reservedStock: 0,
          barcode: "8901234567890",
          price: 2499,
        },
        {
          sku: "VSTR-CHAND-M",
          size: "M",
          color: "Burgundy Wine",
          stock: 20,
          reservedStock: 0,
          barcode: "8901234567891",
          price: 2499,
        },
      ],
    });

    const err = product.validateSync();
    assert.equal(err, undefined, "Product with variants should validate cleanly");
    assert.equal(product.variants.length, 2);
    assert.equal(product.variants[0].sku, "VSTR-CHAND-S");
    assert.equal(product.variants[0].stock, 15);
  });

  test("4. OtpRequest model validates phone and TTL fields", () => {
    const otp = new OtpRequest({
      phone: "+919876543210",
      otpHash: "$2a$12$somehashedotpstringgoeshere",
      purpose: "checkout",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const err = otp.validateSync();
    assert.equal(err, undefined, "OtpRequest should validate successfully");
    assert.equal(otp.purpose, "checkout");
    assert.equal(otp.isVerified, false);
    assert.equal(otp.attempts, 0);
  });

  test("5. WebhookEvent model validates idempotency tracking fields", () => {
    const webhook = new WebhookEvent({
      eventId: "evt_razorpay_test_" + Date.now(),
      provider: "razorpay",
      eventType: "payment.captured",
      payload: { payment: { id: "pay_test_123", amount: 249900 } },
      status: "pending",
    });

    const err = webhook.validateSync();
    assert.equal(err, undefined, "WebhookEvent should validate successfully");
    assert.equal(webhook.provider, "razorpay");
    assert.equal(webhook.status, "pending");
  });

  test("6. Counter model generates sequential order numbers atomically", async () => {
    const counterId = "order_test_seq_" + Date.now();
    const seq1 = await Counter.getNextSequence(counterId);
    const seq2 = await Counter.getNextSequence(counterId);
    const seq3 = await Counter.getNextSequence(counterId);

    assert.equal(seq2, seq1 + 1, "Counter should increment by 1");
    assert.equal(seq3, seq2 + 1, "Counter should increment by 1 sequentially");

    // Clean up test counter
    await Counter.findByIdAndDelete(counterId);
  });

  test("7. InventoryReservation model tracks cart reservation with TTL", () => {
    const res = new InventoryReservation({
      product: new mongoose.Types.ObjectId(),
      variantSize: "M",
      quantity: 2,
      checkoutSessionId: "sess_" + Date.now(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const err = res.validateSync();
    assert.equal(err, undefined, "InventoryReservation should validate cleanly");
    assert.equal(res.status, "active");
  });
});
