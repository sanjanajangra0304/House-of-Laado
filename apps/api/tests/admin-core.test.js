import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import {
  User,
  Product,
  Category,
  Order,
  Coupon,
  Setting,
  AuditLog,
} from "../src/models/index.js";

const app = createApp();

describe("Phase 4: Admin Core & Operations Verification Tests", () => {
  let ownerToken = "";
  let adminToken = "";
  let staffToken = "";
  let customerToken = "";
  let ownerUser = null;
  let adminUser = null;
  let staffUser = null;
  let customerUser = null;
  let testCategory = null;
  let testProduct = null;

  before(async () => {
    await connectDB();

    // 1. Ensure test users with distinct roles exist
    ownerUser = await User.findOneAndUpdate(
      { email: "owner_phase4@vastraloom.com" },
      {
        name: "Test Store Owner",
        email: "owner_phase4@vastraloom.com",
        password: "OwnerSecurePassword123!",
        role: "owner",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    adminUser = await User.findOneAndUpdate(
      { email: "admin_phase4@vastraloom.com" },
      {
        name: "Test Administrator",
        email: "admin_phase4@vastraloom.com",
        password: "AdminSecurePassword123!",
        role: "admin",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    staffUser = await User.findOneAndUpdate(
      { email: "staff_phase4@vastraloom.com" },
      {
        name: "Test Staff Member",
        email: "staff_phase4@vastraloom.com",
        password: "StaffSecurePassword123!",
        role: "staff",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    customerUser = await User.findOneAndUpdate(
      { email: "customer_phase4@vastraloom.com" },
      {
        name: "Test Customer",
        email: "customer_phase4@vastraloom.com",
        password: "CustomerPassword123!",
        role: "customer",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // Generate JWT access tokens
    ownerToken = jwt.sign({ id: ownerUser._id, role: "owner" }, env.jwtSecret, { expiresIn: "1d" });
    adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, env.jwtSecret, { expiresIn: "1d" });
    staffToken = jwt.sign({ id: staffUser._id, role: "staff" }, env.jwtSecret, { expiresIn: "1d" });
    customerToken = jwt.sign({ id: customerUser._id, role: "customer" }, env.jwtSecret, { expiresIn: "1d" });

    // 2. Ensure test category exists
    testCategory = await Category.findOneAndUpdate(
      { slug: "test-admin-category" },
      {
        name: "Admin Test Category",
        slug: "test-admin-category",
        description: "Category for Phase 4 automated tests",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // 3. Ensure test product with variants exists
    testProduct = await Product.findOneAndUpdate(
      { slug: "test-admin-product" },
      {
        name: "Test Chanderi Anarkali Set",
        slug: "test-admin-product",
        category: testCategory._id,
        categorySlug: testCategory.slug,
        fabric: "Pure Chanderi Silk",
        description: "Artisanal set for stock lifecycle testing",
        sellingPrice: 2000,
        compareAtPrice: 3000,
        discountPercent: 33,
        primaryImage: "https://example.com/test-primary.jpg",
        stock: 30,
        sizes: ["S", "M", "L"],
        variants: [
          { sku: "VSTR-TEST-S", size: "S", color: "Burgundy Wine", stock: 10, price: 2000 },
          { sku: "VSTR-TEST-M", size: "M", color: "Burgundy Wine", stock: 10, price: 2000 },
          { sku: "VSTR-TEST-L", size: "L", color: "Burgundy Wine", stock: 10, price: 2000 },
        ],
        status: "active",
      },
      { upsert: true, new: true }
    );
  });

  after(async () => {
    // Clean up test records
    await Product.deleteOne({ slug: "test-admin-product" });
    await Category.deleteOne({ slug: "test-admin-category" });
    await User.deleteMany({
      email: { $in: ["owner_phase4@vastraloom.com", "admin_phase4@vastraloom.com", "staff_phase4@vastraloom.com", "customer_phase4@vastraloom.com"] },
    });
    await disconnectDB();
  });

  // ---------------------------------------------------------------------------
  // 1. RBAC & Security Boundary Enforcement Tests
  // ---------------------------------------------------------------------------
  test("1.1 Staff can view settings, but CANNOT edit sensitive settings (returns 403)", async () => {
    // Staff can GET settings
    const getRes = await request(app)
      .get("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${staffToken}`);
    assert.equal(getRes.statusCode, 200, "Staff should be able to view settings");

    // Staff CANNOT PUT/update settings
    const putRes = await request(app)
      .put("/api/v1/admin/settings/tax_rules")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ value: { pricesIncludeGst: false } });
    assert.equal(putRes.statusCode, 403, "Staff must be denied with 403 from editing settings");
    assert.equal(putRes.body.error?.code, "FORBIDDEN");
  });

  test("1.2 Administrator CANNOT delete a store Owner (Owner Protection Rule returns 403)", async () => {
    const deleteRes = await request(app)
      .delete(`/api/v1/admin/users/${ownerUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(deleteRes.statusCode, 403, "Admin must be blocked with 403 when trying to delete Owner");
    assert.equal(deleteRes.body.error?.code, "OWNER_PROTECTION_VIOLATION");

    // Verify owner was NOT deleted
    const checkOwner = await User.findById(ownerUser._id);
    assert.ok(checkOwner, "Owner account must remain intact in MongoDB");
  });

  test("1.3 Customer token is completely denied from administrative endpoints", async () => {
    const res = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${customerToken}`);

    assert.equal(res.statusCode, 403, "Customer must be rejected with 403");
  });

  // ---------------------------------------------------------------------------
  // 2. Order Status Lifecycle & Inventory Stock Adjustment Tests
  // ---------------------------------------------------------------------------
  test("2.1 Order cancellation restores product stock and variant stock accurately", async () => {
    // Place a fresh test order
    const initialProduct = await Product.findById(testProduct._id);
    const initialTotalStock = initialProduct.stock;
    const initialVariantMStock = initialProduct.variants.find((v) => v.size === "M").stock;

    const checkoutRes = await request(app)
      .post("/api/v1/orders/checkout")
      .send({
        customerDetails: {
          fullName: "Ankita Jain",
          email: "ankita@example.com",
          phone: "9876543210",
        },
        shippingAddress: {
          streetAddress: "14, Heritage Lane",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        items: [
          {
            product: testProduct._id.toString(),
            name: testProduct.name,
            price: 2000,
            size: "M",
            quantity: 2,
            image: testProduct.primaryImage,
          },
        ],
        paymentMethod: "cod",
      });

    assert.equal(checkoutRes.statusCode, 201, "Order placement should succeed");
    const createdOrderId = checkoutRes.body.data.order._id;

    // Verify stock decremented by 2
    const decrementedProduct = await Product.findById(testProduct._id);
    assert.equal(decrementedProduct.stock, initialTotalStock - 2, "Total stock should decrement by 2");
    const decrementedVariantM = decrementedProduct.variants.find((v) => v.size === "M");
    assert.equal(decrementedVariantM.stock, initialVariantMStock - 2, "Size M variant stock should decrement by 2");

    // Now update order status to 'cancelled' (as Staff or Admin)
    const cancelRes = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        orderStatus: "cancelled",
        note: "Customer requested cancellation before dispatch",
      });

    assert.equal(cancelRes.statusCode, 200, "Status update should succeed");
    assert.equal(cancelRes.body.data.orderStatus, "cancelled");

    // Verify stock was restored to original values!
    const restoredProduct = await Product.findById(testProduct._id);
    assert.equal(restoredProduct.stock, initialTotalStock, "Total stock should be restored");
    const restoredVariantM = restoredProduct.variants.find((v) => v.size === "M");
    assert.equal(restoredVariantM.stock, initialVariantMStock, "Variant stock should be restored");

    // Verify statusHistory recorded the event
    assert.ok(cancelRes.body.data.statusHistory.length > 0, "statusHistory should have audit entries");
    const lastHistory = cancelRes.body.data.statusHistory[cancelRes.body.data.statusHistory.length - 1];
    assert.equal(lastHistory.status, "cancelled");

    // Clean up test order
    await Order.findByIdAndDelete(createdOrderId);
  });

  // ---------------------------------------------------------------------------
  // 3. Bulk Price, Bulk Stock, and CSV Export Operations
  // ---------------------------------------------------------------------------
  test("3.1 Bulk price update applies percentage discount across products and variants", async () => {
    const res = await request(app)
      .patch("/api/v1/products/bulk-price")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        productIds: [testProduct._id.toString()],
        type: "percentage",
        value: 10,
        direction: "decrease", // 10% off: 2000 -> 1800
      });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);

    const updatedProd = await Product.findById(testProduct._id);
    assert.equal(updatedProd.sellingPrice, 1800, "Selling price should become 1800");
    assert.equal(updatedProd.variants[0].price, 1800, "Variant price should also be updated to 1800");

    // Restore original price
    updatedProd.sellingPrice = 2000;
    await updatedProd.save();
  });

  test("3.2 Bulk stock update adjusts specific variant stock", async () => {
    const res = await request(app)
      .patch("/api/v1/products/bulk-stock")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        updates: [
          {
            productId: testProduct._id.toString(),
            variantSku: "VSTR-TEST-L",
            stock: 15, // Change size L from 10 to 15
          },
        ],
      });

    assert.equal(res.statusCode, 200);
    const updatedProd = await Product.findById(testProduct._id);
    const varL = updatedProd.variants.find((v) => v.sku === "VSTR-TEST-L");
    assert.equal(varL.stock, 15, "Variant L stock should be updated to 15");
  });

  test("3.3 Catalogue CSV export returns RFC 4180 CSV with correct headers", async () => {
    const res = await request(app)
      .get("/api/v1/products/export-csv")
      .set("Authorization", `Bearer ${staffToken}`);

    assert.equal(res.statusCode, 200);
    assert.match(res.headers["content-type"], /text\/csv/);
    assert.match(res.text, /"Product ID","Name","Slug","Category"/);
    assert.match(res.text, /"Test Chanderi Anarkali Set"/);
  });

  // ---------------------------------------------------------------------------
  // 4. Cloudinary Image Upload Endpoint Tests
  // ---------------------------------------------------------------------------
  test("4.1 Upload endpoint accepts valid JPEG buffer and returns image response", async () => {
    // Generate a small dummy 1x1 JPEG buffer
    const dummyJpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0xff, 0xd9,
    ]);

    const res = await request(app)
      .post("/api/v1/uploads/image")
      .set("Authorization", `Bearer ${staffToken}`)
      .attach("image", dummyJpegBuffer, "garment-test.jpg");

    assert.equal(res.statusCode, 201, "Image upload should return 201");
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.url, "Response must include image URL");
    assert.ok(res.body.data.publicId, "Response must include publicId");
  });

  test("4.2 Upload endpoint rejects invalid file types (e.g. text/plain or executable)", async () => {
    const textBuffer = Buffer.from("Not an image file");

    const res = await request(app)
      .post("/api/v1/uploads/image")
      .set("Authorization", `Bearer ${staffToken}`)
      .attach("image", textBuffer, "bad-file.txt");

    assert.equal(res.statusCode, 400, "Invalid MIME type must return 400");
    assert.equal(res.body.error?.code, "INVALID_FILE_TYPE");
  });

  // ---------------------------------------------------------------------------
  // 5. Coupon CRUD & Discount Type Tests
  // ---------------------------------------------------------------------------
  test("5.1 Coupon validation works for both percentage and flat discounts", async () => {
    // Test percentage coupon
    const percRes = await request(app)
      .post("/api/v1/orders/validate-coupon")
      .send({ code: "WELCOME10", subtotal: 2000 });

    assert.equal(percRes.statusCode, 200);
    assert.equal(percRes.body.success, true);
    assert.equal(percRes.body.data.code, "WELCOME10");
    assert.equal(percRes.body.data.discountAmount, 200, "10% of 2000 should be 200");

    // Test flat coupon
    const flatRes = await request(app)
      .post("/api/v1/orders/validate-coupon")
      .send({ code: "FREESHIP", subtotal: 1000 });

    assert.equal(flatRes.statusCode, 200);
    assert.equal(flatRes.body.success, true);
    assert.equal(flatRes.body.data.code, "FREESHIP");
    assert.equal(flatRes.body.data.discountAmount, 99, "FREESHIP flat discount should be 99");

    // Test minimum order value enforcement
    const lowRes = await request(app)
      .post("/api/v1/orders/validate-coupon")
      .send({ code: "WELCOME10", subtotal: 500 }); // min order is 999

    assert.equal(lowRes.statusCode, 400);
    assert.equal(lowRes.body.success, false);
    assert.match(lowRes.body.message, /minimum order value/i);
  });

  // ---------------------------------------------------------------------------
  // 6. Audit Log Recording Verification
  // ---------------------------------------------------------------------------
  test("6.1 Mutating actions create entries in AuditLog collection", async () => {
    const logs = await AuditLog.find({ action: "BULK_PRICE_UPDATE" });
    assert.ok(logs.length > 0, "AuditLog should contain BULK_PRICE_UPDATE entry");
    assert.equal(logs[0].userEmail, adminUser.email);
  });
});
