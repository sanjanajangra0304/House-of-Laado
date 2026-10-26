import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Order } from "../src/models/Order.js";
import { Product } from "../src/models/Product.js";
import { Category } from "../src/models/Category.js";
import { sanitizePII, cleanMongoOperators } from "../src/middleware/security.js";
import { signToken } from "../src/modules/auth/auth.service.js";

const app = createApp();

test("Phase 8: Security Self-Audit, IDOR, DPDP Act 2023 & Hardening", async (t) => {
  let customerAToken, customerBToken, staffToken;
  let customerAId, customerBId, staffId;
  let sampleOrder;
  let sampleProduct;

  t.before(async () => {
    await connectDB();

    // Clean up collections for isolated testing
    await User.deleteMany({ email: /@test-sec\.com$/ });
    await Order.deleteMany({ "customer.email": /@test-sec\.com$/ });

    // 1. Create Customer A
    const custA = await User.create({
      name: "Radhika Sharma",
      email: "radhika@test-sec.com",
      password: "RadhikaSecurePassword123!",
      role: "customer",
      phone: "9876543210",
      addresses: [
        {
          fullName: "Radhika Sharma",
          phone: "9876543210",
          streetAddress: "123 C-Scheme",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          isDefault: true,
        },
      ],
    });
    customerAId = custA._id;
    customerAToken = signToken(custA);

    // 2. Create Customer B
    const custB = await User.create({
      name: "Sneha Patel",
      email: "sneha@test-sec.com",
      password: "SnehaSecurePassword123!",
      role: "customer",
      phone: "9123456780",
    });
    customerBId = custB._id;
    customerBToken = signToken(custB);

    // 3. Create Staff User
    const staffUser = await User.create({
      name: "Atelier Staff",
      email: "staff@test-sec.com",
      password: "StaffSecurePassword123!",
      role: "staff",
    });
    staffId = staffUser._id;
    staffToken = signToken(staffUser);

    // 4. Ensure a product exists for ordering
    let cat = await Category.findOne({ slug: "suit-sets" });
    if (!cat) {
      cat = await Category.create({ name: "Suit Sets", slug: "suit-sets", description: "Ethnic suit sets" });
    }

    sampleProduct = await Product.create({
      title: "Chanderi Silk Anarkali Suit",
      name: "Chanderi Silk Anarkali Suit",
      slug: `chanderi-silk-${Date.now()}`,
      sku: `CHAN-${Date.now()}`,
      category: cat._id,
      categorySlug: "suit-sets",
      price: 3499,
      sellingPrice: 3499,
      mrp: 4299,
      compareAtPrice: 4299,
      fabric: "Pure Chanderi Silk",
      craft: "Hand Block Print",
      description: "Handcrafted royal suit set",
      primaryImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      images: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
      stock: 20,
      isActive: true,
      variants: [{ size: "M", stock: 10, sku: `CHAN-M-${Date.now()}` }],
    });

    // 5. Create Order belonging strictly to Customer A
    sampleOrder = await Order.create({
      orderNumber: `ORD-SEC-${Date.now()}`,
      user: customerAId,
      customerDetails: {
        fullName: custA.name,
        email: custA.email,
        phone: custA.phone,
      },
      shippingAddress: {
        streetAddress: custA.addresses[0].streetAddress,
        city: custA.addresses[0].city,
        state: custA.addresses[0].state,
        pincode: custA.addresses[0].pincode,
      },
      items: [
        {
          product: sampleProduct._id,
          name: sampleProduct.name,
          price: 3499,
          quantity: 1,
          size: "M",
          image: sampleProduct.primaryImage,
        },
      ],
      pricing: {
        subtotal: 3499,
        discountAmount: 0,
        shippingFee: 0,
        codFee: 0,
        grandTotal: 3499,
      },
      paymentMethod: "cod",
      status: "placed",
    });
  });

  t.after(async () => {
    await User.deleteMany({ email: /@test-sec\.com$/ });
    await Order.deleteMany({ "customer.email": /@test-sec\.com$/ });
    if (sampleProduct) await Product.findByIdAndDelete(sampleProduct._id);
    await disconnectDB();
  });

  // ==========================================
  // 1. ACCOUNT LOCKOUT & BRUTE FORCE DEFENSE
  // ==========================================
  await t.test("Account Lockout & Brute-Force Backoff", async (t) => {
    await t.test("should lock account after 5 consecutive failed login attempts", async () => {
      const targetEmail = "brute-victim@test-sec.com";
      const victim = await User.create({
        name: "Victim User",
        email: targetEmail,
        password: "VictimPassword123!",
        role: "customer",
      });

      // Execute 4 failed attempts
      for (let i = 1; i <= 4; i++) {
        const res = await request(app)
          .post("/api/v1/auth/login")
          .send({ email: targetEmail, password: "WrongPassword" });
        assert.equal(res.status, 401);
        assert.equal(res.body.error.code, "INVALID_CREDENTIALS");
      }

      // 5th failed attempt triggers account lock
      const fifthRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: targetEmail, password: "WrongPassword" });
      assert.equal(fifthRes.status, 401);

      // Verify the user record now has lockUntil set
      const lockedVictim = await User.findById(victim._id);
      assert.ok(lockedVictim.lockUntil);
      assert.ok(lockedVictim.lockUntil > new Date());

      // Next login attempt (even with CORRECT password) is blocked by account lock
      const lockedRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: targetEmail, password: "VictimPassword123!" });
      assert.equal(lockedRes.status, 423);
      assert.equal(lockedRes.body.error.code, "ACCOUNT_LOCKED");
      assert.ok(lockedRes.body.error.message.includes("Account temporarily locked"));

      await User.findByIdAndDelete(victim._id);
    });

    await t.test("should prevent account enumeration with identical generic credentials error", async () => {
      // Non-existent email
      const nonExistent = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "does-not-exist@test-sec.com", password: "Password123!" });
      assert.equal(nonExistent.status, 401);
      assert.equal(nonExistent.body.error.code, "INVALID_CREDENTIALS");
      assert.equal(nonExistent.body.error.message, "Invalid email or password");

      // Existing email with wrong password
      const wrongPass = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "radhika@test-sec.com", password: "IncorrectPassword123!" });
      assert.equal(wrongPass.status, 401);
      assert.equal(wrongPass.body.error.code, "INVALID_CREDENTIALS");
      assert.equal(wrongPass.body.error.message, "Invalid email or password");
    });
  });

  // ==========================================
  // 2. IDOR & RESOURCE OWNERSHIP ENFORCEMENT
  // ==========================================
  await t.test("IDOR & Cross-Account Ownership Checks", async (t) => {
    await t.test("should reject Customer B when attempting to view Customer A's order (403 Forbidden)", async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${sampleOrder._id}`)
        .set("Authorization", `Bearer ${customerBToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.error.code, "FORBIDDEN");
      assert.ok(res.body.error.message.includes("Access denied"));
    });

    await t.test("should allow Customer A to view their own order (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${sampleOrder._id}`)
        .set("Authorization", `Bearer ${customerAToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.orderNumber, sampleOrder.orderNumber);
    });

    await t.test("should allow Staff/Admin to view Customer A's order for operational fulfillment", async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${sampleOrder._id}`)
        .set("Authorization", `Bearer ${staffToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.orderNumber, sampleOrder.orderNumber);
    });
  });

  // ==========================================
  // 3. NOSQL OPERATOR INJECTION & HPP DEFENSE
  // ==========================================
  await t.test("Input Sanitization, NoSQL Defense & Parameter Pollution", async (t) => {
    await t.test("cleanMongoOperators should strip keys starting with '$' or containing '.'", () => {
      const maliciousPayload = {
        email: { $gt: "" },
        "admin.role": "owner",
        password: "ValidPassword123!",
        nested: {
          $where: "sleep(5000)",
          cleanKey: "cleanValue",
        },
      };

      const sanitized = cleanMongoOperators(maliciousPayload);
      assert.equal(sanitized.email, undefined);
      assert.equal(sanitized["admin.role"], undefined);
      assert.equal(sanitized.password, "ValidPassword123!");
      assert.equal(sanitized.nested.$where, undefined);
      assert.equal(sanitized.nested.cleanKey, "cleanValue");
    });

    await t.test("should neutralize NoSQL operator injection in HTTP login request body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: { $gt: "" },
          password: "RandomPassword",
        });

      // Since email was stripped of $gt, Joi validation fails with missing email
      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "VALIDATION_ERROR");
    });

    await t.test("should protect against HTTP Parameter Pollution on query strings", async () => {
      // Sending repeated sort parameters
      const res = await request(app)
        .get("/api/v1/products?sort=price_asc&sort=price_desc");

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  // ==========================================
  // 4. SECURITY HEADERS & LOGGING PII MASKING
  // ==========================================
  await t.test("Transport Security Headers & PII Masking", async (t) => {
    await t.test("should return all required OWASP security response headers", async () => {
      const res = await request(app).get("/api/v1/health");

      assert.equal(res.status, 200);
      assert.ok(res.headers["x-request-id"]);
      assert.equal(res.headers["x-content-type-options"], "nosniff");
      assert.ok(["DENY", "SAMEORIGIN"].includes(res.headers["x-frame-options"]));
      assert.equal(res.headers["referrer-policy"], "strict-origin-when-cross-origin");
      assert.ok(res.headers["strict-transport-security"]);
      assert.ok(res.headers["permissions-policy"]);
    });

    await t.test("sanitizePII should redact secrets, tokens, card details, and mask emails and phones", () => {
      const sensitiveData = {
        email: "priya.sharma@gmail.com",
        phone: "9876543210",
        password: "SecretPassword123!",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        razorpay_signature: "a1b2c3d4e5f6",
        cvv: "123",
        cardNumber: "4111111111111234",
        safeNote: "Please deliver before evening",
      };

      const masked = sanitizePII(sensitiveData);
      assert.equal(masked.password, "[REDACTED]");
      assert.equal(masked.token, "[REDACTED]");
      assert.equal(masked.razorpay_signature, "[REDACTED]");
      assert.equal(masked.cvv, "[REDACTED]");
      assert.equal(masked.cardNumber, "[REDACTED]");
      assert.equal(masked.safeNote, "Please deliver before evening");
      assert.equal(masked.email, "pr***@gmail.com");
      assert.equal(masked.phone, "******3210");
    });
  });

  // ==========================================
  // 5. DPDP ACT 2023 (INDIA DATA PROTECTION)
  // ==========================================
  await t.test("DPDP Act 2023: Data Portability & Right to Erasure", async (t) => {
    await t.test("GET /api/v1/auth/me/export - exports user profile, addresses, and orders", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me/export")
        .set("Authorization", `Bearer ${customerAToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.compliance.framework, "Digital Personal Data Protection Act, 2023 (DPDP Act, India)");
      assert.equal(res.body.data.profile.email, "radhika@test-sec.com");
      assert.equal(res.body.data.profile.addresses.length, 1);
      assert.ok(res.body.data.orders.length >= 1);
    });

    await t.test("DELETE /api/v1/auth/me - rejects erasure if password is omitted or wrong", async () => {
      // Omitted password
      const noPass = await request(app)
        .delete("/api/v1/auth/me")
        .set("Authorization", `Bearer ${customerAToken}`)
        .send({});
      assert.equal(noPass.status, 400);
      assert.equal(noPass.body.error.code, "PASSWORD_REQUIRED");

      // Incorrect password
      const badPass = await request(app)
        .delete("/api/v1/auth/me")
        .set("Authorization", `Bearer ${customerAToken}`)
        .send({ password: "WrongPassword123!" });
      assert.equal(badPass.status, 401);
      assert.equal(badPass.body.error.code, "INVALID_CREDENTIALS");
    });

    await t.test("DELETE /api/v1/auth/me - permanently anonymizes customer account under DPDP Act 2023", async () => {
      const eraseRes = await request(app)
        .delete("/api/v1/auth/me")
        .set("Authorization", `Bearer ${customerAToken}`)
        .send({ password: "RadhikaSecurePassword123!" });

      assert.equal(eraseRes.status, 200);
      assert.equal(eraseRes.body.success, true);
      assert.ok(eraseRes.body.data.erased);

      // Verify user document in MongoDB is anonymized
      const anonymizedUser = await User.findById(customerAId);
      assert.equal(anonymizedUser.isActive, false);
      assert.ok(anonymizedUser.name.startsWith("Anonymized Customer"));
      assert.ok(anonymizedUser.email.startsWith("deleted_"));
      assert.equal(anonymizedUser.addresses.length, 0);
      assert.ok(anonymizedUser.deletedAt);

      // Verify login is permanently denied for erased account
      const loginAttempt = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "radhika@test-sec.com", password: "RadhikaSecurePassword123!" });
      assert.equal(loginAttempt.status, 401);
    });
  });
});
