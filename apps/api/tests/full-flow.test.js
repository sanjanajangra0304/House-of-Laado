import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { Product } from "../src/models/Product.js";
import { Order } from "../src/models/Order.js";
import { User } from "../src/models/User.js";

describe("Full E-Commerce User Journey & Stock Lifecycle Tests", () => {
  const app = createApp();
  let sampleProduct;
  let testCustomer = {
    name: "Aarti Mehra",
    email: `aarti.${Date.now()}@example.com`,
    phone: "9876543210",
    password: "Password@123",
  };
  let customerToken;
  let createdOrderNumber;
  let initialStock = 0;

  before(async () => {
    await connectDB();
    sampleProduct = await Product.findOne();
    if (sampleProduct) {
      initialStock = sampleProduct.stock;
    }
  });

  after(async () => {
    // Cleanup created test user and order
    if (testCustomer.email) {
      await User.deleteOne({ email: testCustomer.email });
    }
    if (createdOrderNumber) {
      await Order.deleteOne({ orderNumber: createdOrderNumber });
    }
    // Restore product stock if modified
    if (sampleProduct) {
      await Product.findByIdAndUpdate(sampleProduct._id, { stock: initialStock });
    }
    await disconnectDB();
  });

  describe("1. Catalog Search & Filtering", () => {
    it("should return matching products for live substring search", async () => {
      const res = await request(app).get("/api/v1/products?search=Set");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length > 0);
    });

    it("should support sorting by price ascending and newest", async () => {
      const resAsc = await request(app).get("/api/v1/products?sort=price_asc");
      assert.equal(resAsc.status, 200);
      assert.ok(resAsc.body.data.length >= 2);
      assert.ok(resAsc.body.data[0].sellingPrice <= resAsc.body.data[1].sellingPrice);

      const resNewest = await request(app).get("/api/v1/products?sort=newest");
      assert.equal(resNewest.status, 200);
    });
  });

  describe("2. Coupon Validation", () => {
    it("should validate active coupon WELCOME10 and compute 10% discount", async () => {
      const res = await request(app)
        .post("/api/v1/orders/validate-coupon")
        .send({ code: "WELCOME10", subtotal: 2000 });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.code, "WELCOME10");
      assert.equal(res.body.data.discountAmount, 200); // 10% of 2000
    });

    it("should reject expired or non-existent coupon", async () => {
      const res = await request(app)
        .post("/api/v1/orders/validate-coupon")
        .send({ code: "INVALID999", subtotal: 2000 });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });
  });

  describe("3. Customer Registration & Authentication", () => {
    it("should register a new customer and return JWT token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(testCustomer);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      customerToken = res.body.data.token;
    });

    it("should allow customer login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testCustomer.email, password: testCustomer.password });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
    });
  });

  describe("4. Order Placement, Stock Decrement & Tracking", () => {
    it("should place a COD order and deduct product inventory stock", async () => {
      assert.ok(sampleProduct, "Sample product must exist in database");

      const stockBefore = sampleProduct.stock;

      const orderPayload = {
        customerDetails: {
          fullName: testCustomer.name,
          email: testCustomer.email,
          phone: "9876543210",
        },
        shippingAddress: {
          streetAddress: "123 C-Scheme Civil Lines",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        items: [
          {
            product: sampleProduct._id.toString(),
            name: sampleProduct.name,
            price: sampleProduct.sellingPrice,
            size: "M",
            color: "Burgundy",
            quantity: 2,
            image: sampleProduct.primaryImage,
          },
        ],
        paymentMethod: "cod",
        couponCode: "WELCOME10",
      };

      const res = await request(app)
        .post("/api/v1/orders/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(orderPayload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.order.orderNumber);
      createdOrderNumber = res.body.data.order.orderNumber;

      // Verify stock was decremented by 2
      const updatedProduct = await Product.findById(sampleProduct._id);
      assert.equal(updatedProduct.stock, stockBefore - 2);
    });

    it("should allow tracking order by orderNumber", async () => {
      assert.ok(createdOrderNumber);

      const res = await request(app).get(`/api/v1/orders/track/${createdOrderNumber}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.orderNumber, createdOrderNumber);
      assert.equal(res.body.data.orderStatus, "placed");
    });

    it("should show order in customer's order history", async () => {
      const res = await request(app)
        .get("/api/v1/orders/my/orders")
        .set("Authorization", `Bearer ${customerToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      const hasOrder = res.body.data.some((o) => o.orderNumber === createdOrderNumber);
      assert.ok(hasOrder, "Customer order list must contain the placed order");
    });

    it("should allow customer to cancel order via HTTP endpoint and restore inventory stock", async () => {
      const order = await Order.findOne({ orderNumber: createdOrderNumber });
      assert.ok(order);

      const stockBeforeCancel = (await Product.findById(sampleProduct._id)).stock;

      // Customer cancels order via self-service endpoint
      const res = await request(app)
        .post(`/api/v1/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ reason: "Ordered incorrect size by mistake" });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.orderStatus, "cancelled");

      const stockAfterCancel = (await Product.findById(sampleProduct._id)).stock;
      assert.equal(stockAfterCancel, stockBeforeCancel + 2);
    });

    it("should allow customer to request return/exchange on a delivered order and admin to process it", async () => {
      // Find the created customer user
      const dbCustomer = await User.findOne({ email: testCustomer.email });

      // Create a delivered order for testing return workflow
      const deliveredOrder = await Order.create({
        orderNumber: `HOL-RET-${Date.now().toString().slice(-4)}`,
        user: dbCustomer?._id,
        customerDetails: {
          fullName: testCustomer.name,
          email: testCustomer.email,
          phone: testCustomer.phone,
        },
        shippingAddress: {
          streetAddress: "45 Royal Palace Road",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        items: [
          {
            product: sampleProduct._id,
            name: sampleProduct.name,
            price: 999,
            size: "M",
            color: "Burgundy",
            quantity: 1,
            image: sampleProduct.primaryImage,
          },
        ],
        pricing: {
          subtotal: 999,
          grandTotal: 999,
        },
        paymentMethod: "cod",
        orderStatus: "delivered",
      });

      // 1. Customer submits return request
      const retRes = await request(app)
        .post(`/api/v1/orders/${deliveredOrder._id}/return`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          type: "exchange",
          reason: "Fabric was exquisite but size M fits slightly loose. Requesting size L exchange.",
          requestedSize: "L",
        });

      assert.equal(retRes.status, 201);
      assert.equal(retRes.body.success, true);
      assert.ok(retRes.body.data.returnRequest);

      const returnReqId = retRes.body.data.returnRequest._id;

      // Login as admin
      const adminLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "admin@houseoflaado.com", password: "AdminSecurePassword123!" });
      const adminToken = adminLogin.body.data.token;

      // 2. Admin retrieves return requests list
      const listRes = await request(app)
        .get("/api/v1/orders/returns/requests")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(listRes.status, 200);
      assert.ok(listRes.body.data.length > 0);

      // 3. Admin approves return request
      const updateRes = await request(app)
        .patch(`/api/v1/orders/returns/requests/${returnReqId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "approved",
          adminNotes: "Exchange pickup scheduled with Delhivery reverse logistics.",
        });

      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.body.data.status, "approved");

      // Clean up test order
      await Order.findByIdAndDelete(deliveredOrder._id);
    });
  });
});
