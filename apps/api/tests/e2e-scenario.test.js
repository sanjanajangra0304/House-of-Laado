import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { Product } from "../src/models/Product.js";
import { Order } from "../src/models/Order.js";
import { Review } from "../src/models/Review.js";
import { Category } from "../src/models/Category.js";
import { User } from "../src/models/User.js";

describe("Phase 14: End-to-End Complete Scenario Verification (17 Steps)", { concurrency: 1 }, () => {
  let adminToken;
  let customerToken;
  let testCategory;
  let createdProduct;
  let createdOrder;
  let customerUser = {
    name: "Customer Patron",
    email: "customer@houseoflaado.com",
  };

  before(async () => {
    await connectDB();

    // Reset login lockout state in case previous brute-force tests left accounts locked
    await User.updateMany(
      { email: { $in: ["admin@houseoflaado.com", "customer@houseoflaado.com"] } },
      { $set: { lockUntil: null, loginAttempts: 0, isActive: true } }
    );

    // Ensure a test category exists
    testCategory =
      (await Category.findOne({ slug: "festive-lehengas" })) ||
      (await Category.findOne());
    if (!testCategory) {
      testCategory = await Category.create({
        name: "Festive Lehengas",
        slug: `festive-lehengas-${Date.now()}`,
        isActive: true,
      });
    }
  });

  after(async () => {
    // Clean up created test resources
    if (createdProduct?._id) {
      await Product.findByIdAndDelete(createdProduct._id);
    }
    if (createdOrder?._id) {
      await Order.findByIdAndDelete(createdOrder._id);
    }
    if (createdProduct?._id) {
      await Review.deleteMany({ product: createdProduct._id });
    }
    await disconnectDB();
  });

  // Step 1: Admin logs in
  test("Step 1: Admin logs in and receives verified JWT token with admin role", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@houseoflaado.com",
        password: "AdminSecurePassword123!",
      });

    assert.equal(res.status, 200, "Admin login must succeed");
    assert.ok(res.body.data?.token, "Token must be returned");
    assert.equal(res.body.data.user.role, "admin");
    adminToken = res.body.data.token;
  });

  // Step 2: Admin adds a new House of Laado product
  test("Step 2: Admin creates a new House of Laado ethnic product via validated endpoint", async () => {
    const testSku = `HOL-E2E-${Date.now().toString().slice(-4)}`;
    const productPayload = {
      name: "Jaipuri Zari Silk Festive Lehenga Set",
      category: testCategory._id.toString(),
      fabric: "Pure Silk",
      compareAtPrice: 6999,
      sellingPrice: 4999,
      description: "Authentic hand-embroidered Zari silk festive lehenga set from House of Laado.",
      sku: testSku,
      stock: 15,
      sizes: ["S", "M", "L", "XL"],
      colors: [{ name: "Burgundy", hex: "#5f0d24" }],
      variants: [
        { size: "S", color: "Burgundy", stock: 3, sku: `${testSku}-S-BUR` },
        { size: "M", color: "Burgundy", stock: 5, sku: `${testSku}-M-BUR` },
        { size: "L", color: "Burgundy", stock: 4, sku: `${testSku}-L-BUR` },
        { size: "XL", color: "Burgundy", stock: 3, sku: `${testSku}-XL-BUR` },
      ],
      primaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
      status: "active",
      tags: ["handcrafted", "festive", "zari"],
    };

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(productPayload);

    assert.equal(res.status, 201, "Product must be created with 201");
    assert.ok(res.body.data._id, "Product ID must exist");
    assert.equal(res.body.data.name, productPayload.name);
    assert.equal(res.body.data.stock, 15);
    createdProduct = res.body.data;
  });

  // Step 3: Verify that it exists in MongoDB
  test("Step 3: Verify created product directly exists in MongoDB Atlas", async () => {
    const dbProduct = await Product.findById(createdProduct._id);
    assert.ok(dbProduct, "Product must exist in MongoDB database");
    assert.equal(dbProduct.sellingPrice, 4999);
    assert.equal(dbProduct.stock, 15);
    assert.equal(dbProduct.variants.length, 4);
  });

  // Step 4: Open customer storefront and verify product appears in catalogue
  test("Step 4: Customer storefront listing returns the newly created product", async () => {
    const res = await request(app)
      .get("/api/v1/products")
      .query({ search: "Jaipuri Zari Silk" });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.length > 0, "Product must appear in storefront search");
    const found = res.body.data.find((p) => p._id === createdProduct._id);
    assert.ok(found, "Created product must be in results");
    assert.equal(found.sellingPrice, 4999);
  });

  // Step 5: Open product detail page
  test("Step 5: Product detail endpoint resolves product by slug", async () => {
    const res = await request(app).get(`/api/v1/products/${createdProduct.slug}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data._id, createdProduct._id);
    assert.equal(res.body.data.name, createdProduct.name);
  });

  // Step 6 & 7: Customer logs in and adds to cart
  test("Step 6 & 7: Customer logs in and prepares order with valid Size L and Color Burgundy", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "customer@houseoflaado.com",
        password: "CustomerSecurePassword123!",
      });

    assert.equal(res.status, 200, "Customer login must succeed");
    assert.ok(res.body.data?.token, "Customer token must be returned");
    customerToken = res.body.data.token;
    customerUser = res.body.data.user;
  });

  // Step 8: Complete test checkout
  test("Step 8: Complete customer checkout with server-side price validation", async () => {
    const checkoutPayload = {
      customerDetails: {
        fullName: customerUser.name || "Customer Patron",
        email: customerUser.email,
        phone: "9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Heritage Lane, C-Scheme",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: createdProduct._id,
          name: createdProduct.name,
          price: 999999, // Tampered price: backend must override with 4999
          size: "L",
          color: "Burgundy",
          quantity: 1,
          image: createdProduct.primaryImage,
        },
      ],
      paymentMethod: "cod",
    };

    const res = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(checkoutPayload);

    assert.equal(res.status, 201, "Order must be created successfully");
    assert.ok(res.body.data.order, "Order data must be returned");
    assert.ok(res.body.data.order.orderNumber.startsWith("HOL-"), "Order number must use HOL- prefix");
    // Verify server-side recalculation: price must be 4999, not 999999
    assert.equal(res.body.data.order.items[0].price, 4999, "Price must be server-validated from DB");
    createdOrder = res.body.data.order;
  });

  // Step 9: Verify order and inventory persistence
  test("Step 9: Order persists in MongoDB and product inventory stock is decremented accurately", async () => {
    const dbOrder = await Order.findById(createdOrder._id);
    assert.ok(dbOrder, "Order must persist in MongoDB");
    assert.equal(dbOrder.orderStatus, "placed");

    const updatedProduct = await Product.findById(createdProduct._id);
    assert.equal(updatedProduct.stock, 14, "Total stock must decrement from 15 to 14");
    const variantL = updatedProduct.variants.find((v) => v.size === "L");
    assert.equal(variantL.stock, 3, "Variant L stock must decrement from 4 to 3");
  });

  // Step 10: Verify order appears in admin dashboard orders list
  test("Step 10: Created order appears in admin order management list", async () => {
    const res = await request(app)
      .get("/api/v1/orders")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    const foundOrder = res.body.data.find(
      (o) => o.orderNumber === createdOrder.orderNumber || o._id === createdOrder._id
    );
    assert.ok(foundOrder, "Order must appear in admin orders listing");
  });

  // Step 11: Admin updates order status
  test("Step 11: Admin updates order status through lifecycle: confirmed -> dispatched", async () => {
    // Confirmed
    let res = await request(app)
      .patch(`/api/v1/orders/${createdOrder._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ orderStatus: "confirmed", note: "Order confirmed by atelier" });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.orderStatus, "confirmed");

    // Dispatched with tracking
    res = await request(app)
      .patch(`/api/v1/orders/${createdOrder._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        orderStatus: "dispatched",
        trackingNumber: "DLH-HOL-9928172",
        courierName: "Delhivery Express",
        note: "Dispatched from Jaipur Atelier",
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.orderStatus, "dispatched");
    assert.equal(res.body.data.tracking.trackingNumber, "DLH-HOL-9928172");
  });

  // Step 12: Verify customer sees updated status & tracking history
  test("Step 12: Public tracking endpoint returns updated 'dispatched' status and status history", async () => {
    const res = await request(app).get(`/api/v1/orders/track/${createdOrder.orderNumber}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.orderStatus, "dispatched");
    assert.equal(res.body.data.tracking.trackingNumber, "DLH-HOL-9928172");
    assert.ok(res.body.data.statusHistory.length >= 2, "Status history must record transitions");
  });

  // Step 13: Submit review from eligible customer account
  test("Step 13: Customer submits a rating and review for the purchased product", async () => {
    const res = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        product: createdProduct._id,
        rating: 5,
        title: "Breathtaking Jaipuri Silk Quality!",
        comment: "The Zari embroidery is gorgeous and the fit is perfect for festive occasions.",
        city: "Jaipur",
      });

    assert.equal(res.status, 201, "Review must be created");
    assert.equal(res.body.data.rating, 5);
    assert.equal(res.body.data.isVerifiedPurchase, true, "Must be verified purchase because customer bought it");
  });

  // Step 14: Verify review appears and rating aggregates are updated
  test("Step 14: Product reviews endpoint returns review and updates aggregate rating", async () => {
    const res = await request(app).get(`/api/v1/reviews/product/${createdProduct._id}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.summary.totalReviews, 1);
    assert.equal(res.body.summary.averageRating, 5);

    const updatedProd = await Product.findById(createdProduct._id);
    assert.equal(updatedProd.averageRating, 5);
    assert.equal(updatedProd.reviewCount, 1);
  });

  // Step 15: Admin updates product details from admin portal
  test("Step 15: Admin updates product price to ₹5,499 and storefront reflects change", async () => {
    const res = await request(app)
      .put(`/api/v1/products/${createdProduct._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sellingPrice: 5499,
        description: "Updated description: Special festive edition hand-block lehenga.",
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.sellingPrice, 5499);

    const storefrontRes = await request(app).get(`/api/v1/products/${createdProduct.slug}`);
    assert.equal(storefrontRes.body.data.sellingPrice, 5499, "Storefront must reflect updated price");
  });

  // Step 16: Admin archives product and verifies it cannot be purchased
  test("Step 16: Admin archives product and checkout is rejected for inactive product", async () => {
    // Archive product
    const archiveRes = await request(app)
      .put(`/api/v1/products/${createdProduct._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "archived", stock: 0 });

    assert.equal(archiveRes.status, 200);
    assert.equal(archiveRes.body.data.status, "archived");

    // Attempt purchase
    const checkoutRes = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        customerDetails: {
          fullName: "Attempt Buyer",
          email: "buyer@example.com",
          phone: "9988776655",
        },
        shippingAddress: {
          streetAddress: "456 Market St",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
        },
        items: [
          {
            product: createdProduct._id,
            name: createdProduct.name,
            price: 5499,
            size: "M",
            quantity: 1,
            image: createdProduct.primaryImage,
          },
        ],
        paymentMethod: "cod",
      });

    assert.equal(checkoutRes.status, 400, "Purchase of archived/out-of-stock product must be rejected");
    assert.equal(checkoutRes.body.error.code, "OUT_OF_STOCK");
  });

  // Step 17: Verify historical order preserves purchased item snapshot
  test("Step 17: Historical order preserves original purchased item snapshot (name, price ₹4999, size L)", async () => {
    const historicalOrder = await Order.findById(createdOrder._id);
    assert.ok(historicalOrder, "Historical order must remain intact in MongoDB");
    assert.equal(historicalOrder.items[0].name, "Jaipuri Zari Silk Festive Lehenga Set");
    assert.equal(historicalOrder.items[0].price, 4999, "Original purchase price ₹4,999 preserved despite product price update");
    assert.equal(historicalOrder.items[0].size, "L");
    assert.equal(historicalOrder.items[0].color, "Burgundy");
    assert.equal(historicalOrder.orderStatus, "dispatched");
  });
});
