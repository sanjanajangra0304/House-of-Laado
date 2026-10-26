import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

describe("API Integration & Contract Tests", () => {
  const app = createApp();

  before(async () => {
    try {
      await connectDB();
    } catch {
      // Allow fallback if offline
    }
  });

  after(async () => {
    try {
      await disconnectDB();
    } catch {}
  });

  describe("GET /api/v1/health", () => {
    it("should respond with health contract structure and database status", async () => {
      const res = await request(app).get("/api/v1/health");

      // Returns 200 (connected) or 503 (degraded when offline in test environment)
      assert.ok([200, 503].includes(res.status), `Unexpected status code: ${res.status}`);
      assert.ok(typeof res.body.success === "boolean");
      assert.ok(res.body.status === "OK" || res.body.status === "DEGRADED");
      assert.ok(typeof res.body.uptime === "number");
      assert.ok(typeof res.body.timestamp === "string");
      assert.ok(typeof res.body.services.database === "string");
    });
  });

  describe("Validation Middleware on Catalog Endpoints", () => {
    it("should return 400 with VALIDATION_ERROR when negative minPrice is supplied", async () => {
      const res = await request(app).get("/api/v1/products?minPrice=-100");

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "VALIDATION_ERROR");
      assert.ok(Array.isArray(res.body.error.details));
      assert.ok(res.body.error.details.length > 0);
    });

    it("should return 400 when invalid sort option is supplied", async () => {
      const res = await request(app).get("/api/v1/products?sort=invalid_sort_param");

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "VALIDATION_ERROR");
    });

    it("should return 400 when limit exceeds allowed maximum (100)", async () => {
      const res = await request(app).get("/api/v1/products?limit=500");

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "VALIDATION_ERROR");
    });
  });

  describe("404 & Centralized Error Handling", () => {
    it("should return standard 404 JSON response for unknown routes", async () => {
      const res = await request(app).get("/api/v1/unknown-endpoint");

      assert.equal(res.status, 404);
      assert.deepEqual(res.body, {
        success: false,
        error: {
          code: "ROUTE_NOT_FOUND",
          message: "The requested endpoint GET /api/v1/unknown-endpoint does not exist.",
        },
      });
    });
  });

  describe("Security Headers (Helmet)", () => {
    it("should include security headers in responses", async () => {
      const res = await request(app).get("/api/v1/health");

      assert.equal(res.headers["x-content-type-options"], "nosniff");
      assert.equal(res.headers["x-frame-options"], "SAMEORIGIN");
    });
  });

  describe("Authentication & Admin RBAC Protection", () => {
    it("should reject login with invalid email format", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "invalid-email-string", password: "short" });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "VALIDATION_ERROR");
    });

    it("should reject unauthenticated access to admin stats", async () => {
      const res = await request(app).get("/api/v1/admin/stats");

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "UNAUTHORIZED");
    });

    it("should reject unauthenticated product creation", async () => {
      const res = await request(app)
        .post("/api/v1/products")
        .send({ name: "Unauthorized Product" });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "UNAUTHORIZED");
    });

    it("should reject unauthenticated order management", async () => {
      const res = await request(app).get("/api/v1/orders");

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "UNAUTHORIZED");
    });
  });

  describe("Checkout & Payment Gateway Validation", () => {
    it("should reject checkout when Indian pincode is invalid (e.g. 5 digits)", async () => {
      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .send({
          customerDetails: {
            fullName: "Simran Kaur",
            email: "simran@example.com",
            phone: "+91 9876543210",
          },
          shippingAddress: {
            streetAddress: "123 MG Road",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "30200", // Invalid: 5 digits instead of 6
          },
          items: [
            {
              product: "6704b2a8f89e4c1234567890",
              name: "Pure Cotton Kurta",
              price: 899,
              size: "M",
              quantity: 1,
              image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
            },
          ],
          paymentMethod: "online",
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "VALIDATION_ERROR");
      assert.ok(
        res.body.error.details.some((d) => d.field.includes("pincode"))
      );
    });

    it("should reject payment verification when razorpaySignature is missing", async () => {
      const res = await request(app)
        .post("/api/v1/orders/verify-payment")
        .send({
          orderId: "VL-123456",
          razorpayOrderId: "order_test123",
          razorpayPaymentId: "pay_test123",
          // missing razorpaySignature
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "VALIDATION_ERROR");
    });

    it("should return 400 when validating a coupon without a code", async () => {
      const res = await request(app)
        .post("/api/v1/orders/validate-coupon")
        .send({ subtotal: 1500 });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes("Coupon code is required"));
    });

    it("should return 404 when tracking a non-existent order", async () => {
      const res = await request(app).get("/api/v1/orders/track/VL-NONEXISTENT");

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "ORDER_NOT_FOUND");
    });

    it("should reject access to my orders when unauthenticated", async () => {
      const res = await request(app).get("/api/v1/orders/my/orders");

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, "UNAUTHORIZED");
    });
  });
});
