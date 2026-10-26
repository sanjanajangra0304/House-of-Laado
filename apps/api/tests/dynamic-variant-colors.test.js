import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { Product } from "../src/models/Product.js";
import { Category } from "../src/models/Category.js";
import { Order } from "../src/models/Order.js";
import { User } from "../src/models/User.js";

const app = createApp();

describe("House of Laado — Dynamic Product Variant Colors End-to-End Tests", () => {
  let adminToken = "";
  let customerToken = "";
  let testCategory = null;
  let createdProductId = null;
  let testOrderNumber = null;

  before(async () => {
    await connectDB();

    // 1. Create or ensure test admin user
    const adminUser = await User.findOneAndUpdate(
      { email: "admin_colors_test@houseoflaado.com" },
      {
        name: "Color Test Admin",
        email: "admin_colors_test@houseoflaado.com",
        password: "AdminPassword123!",
        role: "admin",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role, email: adminUser.email },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    // 2. Create or ensure customer user
    const customerUser = await User.findOneAndUpdate(
      { email: "customer_colors_test@houseoflaado.com" },
      {
        name: "Color Test Customer",
        email: "customer_colors_test@houseoflaado.com",
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

    // 3. Ensure test category
    testCategory = await Category.findOneAndUpdate(
      { slug: "suit-sets" },
      {
        name: "Suit Sets",
        slug: "suit-sets",
        isActive: true,
      },
      { upsert: true, new: true }
    );
  });

  after(async () => {
    // Clean up created records
    if (createdProductId) {
      await Product.findByIdAndDelete(createdProductId);
    }
    await Product.deleteMany({ slug: { $in: ["royal-anarkali-colors-test", "legacy-product-colors-test"] } });
    if (testOrderNumber) {
      await Order.deleteOne({ orderNumber: testOrderNumber });
    }
    await User.deleteMany({
      email: { $in: ["admin_colors_test@houseoflaado.com", "customer_colors_test@houseoflaado.com"] },
    });
    await disconnectDB();
  });

  it("1. Admin creates product with Burgundy Wine and Black variants", async () => {
    const payload = {
      name: "Royal Jaipuri Anarkali Suit Set",
      slug: "royal-anarkali-colors-test",
      category: testCategory._id.toString(),
      fabric: "Pure Cotton Mulmul",
      description: "Handcrafted pure cotton mulmul anarkali set with hand block motifs.",
      sellingPrice: 2499,
      compareAtPrice: 3999,
      primaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
      images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b"],
      variants: [
        {
          size: "M",
          color: "Burgundy Wine",
          stock: 12,
          sku: "HOL-ROYAL-M-BURGUNDY",
          price: 2499,
          barcode: "8901234567891",
        },
        {
          size: "L",
          color: "Burgundy Wine",
          stock: 8,
          sku: "HOL-ROYAL-L-BURGUNDY",
          price: 2499,
          barcode: "8901234567892",
        },
        {
          size: "S",
          color: "Black",
          stock: 15,
          sku: "HOL-ROYAL-S-BLACK",
          price: 2499,
          barcode: "8901234567893",
        },
        {
          size: "M",
          color: "Black",
          stock: 0, // Out of stock variant
          sku: "HOL-ROYAL-M-BLACK",
          price: 2499,
          barcode: "8901234567894",
        },
      ],
      status: "active",
    };

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    assert.equal(res.status, 201, `Expected 201 Created, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data?._id || res.body.data?.id);
    createdProductId = res.body.data._id || res.body.data.id;

    // Check returned variants and colors
    const created = res.body.data;
    assert.equal(created.variants.length, 4, "Should have 4 variants");
    assert.equal(created.stock, 35, "Total stock should sum to 12 + 8 + 15 + 0 = 35");

    const colorNames = created.colors.map((c) => c.name);
    assert.ok(colorNames.includes("Burgundy Wine"), "Colors should include Burgundy Wine");
    assert.ok(colorNames.includes("Black"), "Colors should include Black");
  });

  it("2. Refresh admin page: Verify variants and colors persist in MongoDB", async () => {
    assert.ok(createdProductId, "Created product ID must exist");

    const res = await request(app)
      .get(`/api/v1/products/${createdProductId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    const p = res.body.data;
    assert.equal(p.variants.length, 4);

    const burgundyM = p.variants.find((v) => v.color === "Burgundy Wine" && v.size === "M");
    assert.ok(burgundyM, "Burgundy Wine M variant must exist");
    assert.equal(burgundyM.stock, 12);
    assert.equal(burgundyM.sku, "HOL-ROYAL-M-BURGUNDY");

    const blackM = p.variants.find((v) => v.color === "Black" && v.size === "M");
    assert.ok(blackM, "Black M variant must exist");
    assert.equal(blackM.stock, 0);

    // Verify colors array is harmonized
    const colors = p.colors.map((c) => c.name);
    assert.ok(colors.includes("Burgundy Wine"));
    assert.ok(colors.includes("Black"));
  });

  it("3. Storefront API returns dynamic colors and variants for customer", async () => {
    const res = await request(app).get(`/api/v1/products/royal-anarkali-colors-test`);
    assert.equal(res.status, 200);
    const p = res.body.data;

    assert.ok(Array.isArray(p.variants), "Storefront response must include variants");
    assert.equal(p.variants.length, 4);

    const availableColors = p.colors.map((c) => c.name);
    assert.ok(availableColors.includes("Burgundy Wine"));
    assert.ok(availableColors.includes("Black"));
    assert.equal(availableColors.length, 2);
  });

  it("4. Checkout: Attempting to order out-of-stock variant (Black M) is rejected", async () => {
    const orderPayload = {
      customerDetails: {
        fullName: "Test Customer",
        email: "customer_colors_test@houseoflaado.com",
        phone: "9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Fashion Street, Civil Lines",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: createdProductId,
          name: "Royal Jaipuri Anarkali Suit Set",
          size: "M",
          color: "Black",
          sku: "HOL-ROYAL-M-BLACK",
          price: 2499,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
        },
      ],
      paymentMethod: "cod",
    };

    const res = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(orderPayload);

    assert.equal(
      res.status,
      400,
      `Ordering 0-stock variant Black M must be rejected with 400 Bad Request, got ${res.status}: ${JSON.stringify(res.body)}`
    );
  });

  it("5. Checkout: Ordering in-stock variant (Burgundy Wine M) succeeds and decrements variant stock", async () => {
    const orderPayload = {
      customerDetails: {
        fullName: "Test Customer",
        email: "customer_colors_test@houseoflaado.com",
        phone: "9876543210",
      },
      shippingAddress: {
        streetAddress: "123 Fashion Street, Civil Lines",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: createdProductId,
          name: "Royal Jaipuri Anarkali Suit Set",
          size: "M",
          color: "Burgundy Wine",
          sku: "HOL-ROYAL-M-BURGUNDY",
          price: 2499,
          quantity: 2,
          image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
        },
      ],
      paymentMethod: "cod",
    };

    const res = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(orderPayload);

    assert.equal(res.status, 201, `Order should succeed: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
    const createdOrder = res.body.data.order;
    assert.ok(createdOrder, "Order object must be returned in data.order");
    testOrderNumber = createdOrder.orderNumber;

    // Verify order item persisted correct variant color and size
    const orderItem = createdOrder.items[0];
    assert.equal(orderItem.color, "Burgundy Wine");
    assert.equal(orderItem.size, "M");
    assert.equal(orderItem.quantity, 2);

    // Verify MongoDB product inventory after order
    const updatedProduct = await Product.findById(createdProductId);
    const updatedBurgundyM = updatedProduct.variants.find(
      (v) => v.color === "Burgundy Wine" && v.size === "M"
    );
    assert.equal(
      updatedBurgundyM.stock,
      10,
      "Burgundy Wine M stock should be decremented from 12 to 10"
    );

    // Total stock should now be 35 - 2 = 33
    assert.equal(updatedProduct.stock, 33, "Total product stock should be 33");

    // Other variants should remain unaffected
    const updatedBurgundyL = updatedProduct.variants.find(
      (v) => v.color === "Burgundy Wine" && v.size === "L"
    );
    assert.equal(updatedBurgundyL.stock, 8);
    const updatedBlackS = updatedProduct.variants.find(
      (v) => v.color === "Black" && v.size === "S"
    );
    assert.equal(updatedBlackS.stock, 15);
  });

  it("6. Admin edits product: Renames color Black -> Navy Blue, adds Ivory XL", async () => {
    const updatePayload = {
      variants: [
        {
          size: "M",
          color: "Burgundy Wine",
          stock: 10,
          sku: "HOL-ROYAL-M-BURGUNDY",
          price: 2499,
        },
        {
          size: "L",
          color: "Burgundy Wine",
          stock: 8,
          sku: "HOL-ROYAL-L-BURGUNDY",
          price: 2499,
        },
        {
          size: "S",
          color: "Navy Blue", // Renamed from Black
          stock: 15,
          sku: "HOL-ROYAL-S-NAVY",
          price: 2499,
        },
        {
          size: "XL",
          color: "Ivory", // New custom color & size
          stock: 5,
          sku: "HOL-ROYAL-XL-IVORY",
          price: 2699,
        },
      ],
      sellingPrice: 2499,
      compareAtPrice: 3999,
      stock: 38,
    };

    const res = await request(app)
      .put(`/api/v1/products/${createdProductId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updatePayload);

    assert.equal(res.status, 200, `Product update should succeed: ${JSON.stringify(res.body)}`);

    // Verify storefront reflects updated colors immediately
    const storefrontRes = await request(app).get(`/api/v1/products/royal-anarkali-colors-test`);
    assert.equal(storefrontRes.status, 200);
    const p = storefrontRes.body.data;

    const colors = p.colors.map((c) => c.name);
    assert.ok(colors.includes("Burgundy Wine"), "Burgundy Wine should be present");
    assert.ok(colors.includes("Navy Blue"), "Navy Blue should be present");
    assert.ok(colors.includes("Ivory"), "Ivory should be present");
    assert.ok(!colors.includes("Black"), "Black should no longer be present");

    assert.equal(p.variants.length, 4);
    assert.equal(p.stock, 38, "Total stock should be 10 + 8 + 15 + 5 = 38");
  });

  it("7. Backward compatibility: Legacy product without variants returns harmonized colors & synthesized variants", async () => {
    // Insert a legacy product document directly into MongoDB
    const legacyProduct = await Product.create({
      name: "Legacy Heritage Kurta Set",
      slug: "legacy-product-colors-test",
      category: testCategory._id,
      categorySlug: "suit-sets",
      fabric: "Pure Chanderi Silk",
      description: "Vintage heritage kurta.",
      sellingPrice: 2199,
      compareAtPrice: 3499,
      stock: 25,
      sizes: ["S", "M", "L"],
      colors: [
        { name: "Powder Pink", hex: "#E8A598" },
        { name: "Pista Green", hex: "#93C572" },
      ],
      primaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
      variants: [], // Empty legacy variants
      status: "active",
    });

    const res = await request(app).get(`/api/v1/products/${legacyProduct.slug}`);
    assert.equal(res.status, 200);
    const data = res.body.data;

    // Verify harmonized output synthesizes variants from sizes x colors
    assert.ok(Array.isArray(data.variants));
    assert.ok(data.variants.length > 0, "Synthesized variants should be generated for legacy products");
    assert.equal(data.colors.length, 2);
    assert.equal(data.colors[0].name, "Powder Pink");

    // Clean up legacy product
    await Product.findByIdAndDelete(legacyProduct._id);
  });
});
