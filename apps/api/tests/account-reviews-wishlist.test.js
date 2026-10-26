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
  Review,
  Wishlist,
} from "../src/models/index.js";

const app = createApp();

describe("Phase 6: Customer Account, Reviews, Wishlist & WhatsApp Engagement", () => {
  let customerUser = null;
  let nonBuyerCustomer = null;
  let staffUser = null;
  let customerToken = "";
  let nonBuyerToken = "";
  let staffToken = "";
  let testCategory = null;
  let testProduct = null;
  let createdReviewId = "";
  let createdAddressId = "";

  before(async () => {
    await connectDB();

    // 1. Setup users
    customerUser = await User.findOneAndUpdate(
      { email: "patron_p6@vastraloom.com" },
      {
        name: "Meera Rathore",
        email: "patron_p6@vastraloom.com",
        password: "PatronSecure123!",
        phone: "+91 98290 12345",
        role: "customer",
        isActive: true,
        addresses: [],
      },
      { upsert: true, new: true }
    );

    nonBuyerCustomer = await User.findOneAndUpdate(
      { email: "browser_p6@vastraloom.com" },
      {
        name: "Aarav Sharma",
        email: "browser_p6@vastraloom.com",
        password: "BrowserSecure123!",
        phone: "+91 98111 22233",
        role: "customer",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    staffUser = await User.findOneAndUpdate(
      { email: "staff_p6@vastraloom.com" },
      {
        name: "Atelier Concierge",
        email: "staff_p6@vastraloom.com",
        password: "StaffSecure123!",
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

    nonBuyerToken = jwt.sign(
      { id: nonBuyerCustomer._id, role: nonBuyerCustomer.role, email: nonBuyerCustomer.email },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    staffToken = jwt.sign(
      { id: staffUser._id, role: staffUser.role, email: staffUser.email },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    // 2. Setup category and product
    testCategory = await Category.findOneAndUpdate(
      { slug: "reviews-category" },
      { name: "Reviews Test Category", slug: "reviews-category", isActive: true },
      { upsert: true, new: true }
    );

    testProduct = await Product.findOneAndUpdate(
      { slug: "hand-block-anarkali-suit" },
      {
        name: "Hand-Block Printed Anarkali Suit Set",
        slug: "hand-block-anarkali-suit",
        sku: "VL-ARK-001",
        category: testCategory._id,
        categorySlug: "reviews-category",
        fabric: "Mulmul Cotton",
        description: "Fine Mulmul cotton anarkali crafted by master artisans.",
        sellingPrice: 2499,
        mrp: 3499,
        stock: 35,
        isActive: true,
        primaryImage: "https://example.com/anarkali.jpg",
        images: ["https://example.com/anarkali.jpg"],
        averageRating: 0,
        reviewCount: 0,
      },
      { upsert: true, new: true }
    );

    // 3. Create a verified order for customerUser
    await Order.create({
      orderNumber: "VL-REV-90123",
      user: customerUser._id,
      customerDetails: {
        fullName: customerUser.name,
        email: customerUser.email,
        phone: customerUser.phone,
      },
      shippingAddress: {
        streetAddress: "12 Heritage Enclave, C-Scheme",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          price: testProduct.sellingPrice,
          size: "M",
          color: "Indigo",
          quantity: 1,
          image: testProduct.primaryImage,
        },
      ],
      pricing: {
        subtotal: 2499,
        discountAmount: 0,
        shippingFee: 0,
        codFee: 0,
        grandTotal: 2499,
      },
      paymentMethod: "online",
      paymentStatus: "paid",
      orderStatus: "delivered",
    });
  });

  after(async () => {
    await Review.deleteMany({ product: testProduct?._id });
    await Wishlist.deleteMany({ user: customerUser?._id });
    await Order.deleteMany({ orderNumber: "VL-REV-90123" });
    await disconnectDB();
  });

  // 1. CUSTOMER PROFILE & ADDRESS MANAGEMENT
  describe("Customer Profile & Address Management", () => {
    test("PUT /api/v1/auth/profile - updates customer profile information", async () => {
      const res = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          name: "Meera Rathore-Sharma",
          phone: "+91 98290 99999",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, "Meera Rathore-Sharma");
      assert.equal(res.body.data.phone, "+91 98290 99999");
    });

    test("POST /api/v1/auth/addresses - saves first address and marks as default", async () => {
      const res = await request(app)
        .post("/api/v1/auth/addresses")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          fullName: "Meera Rathore",
          phone: "+91 98290 99999",
          streetAddress: "402 Royal Heritage Palms",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].isDefault, true);
      createdAddressId = res.body.data[0]._id;
    });

    test("POST /api/v1/auth/addresses - saves second address without overriding default", async () => {
      const res = await request(app)
        .post("/api/v1/auth/addresses")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          fullName: "Meera Rathore (Office)",
          phone: "+91 98290 99999",
          streetAddress: "Tech Park, Malviya Nagar",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302017",
          isDefault: false,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.length, 2);
      assert.equal(res.body.data[0].isDefault, true);
      assert.equal(res.body.data[1].isDefault, false);
    });

    test("PATCH /api/v1/auth/addresses/:id/default - switches default address cleanly", async () => {
      const user = await User.findById(customerUser._id);
      const secondAddressId = user.addresses[1]._id;

      const res = await request(app)
        .patch(`/api/v1/auth/addresses/${secondAddressId}/default`)
        .set("Authorization", `Bearer ${customerToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      const updatedFirst = res.body.data.find((a) => a._id.toString() === createdAddressId.toString());
      const updatedSecond = res.body.data.find((a) => a._id.toString() === secondAddressId.toString());
      assert.equal(updatedFirst.isDefault, false);
      assert.equal(updatedSecond.isDefault, true);
    });
  });

  // 2. VERIFIED BUYER REVIEWS & RATING RECALCULATION
  describe("Verified Buyer Reviews & Product Rating Recalculation", () => {
    test("POST /api/v1/reviews - creates review with verified buyer badge for customer who bought product", async () => {
      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          product: testProduct._id.toString(),
          rating: 5,
          title: "Exquisite hand-block print & pure cotton comfort",
          comment: "Wore this for Diwali puja. Received endless compliments on the breathable mulmul fabric!",
          city: "Jaipur",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.isVerifiedPurchase, true);
      assert.equal(res.body.data.rating, 5);
      createdReviewId = res.body.data._id;

      // Verify product rating recalculation
      const prod = await Product.findById(testProduct._id);
      assert.equal(prod.averageRating, 5);
      assert.equal(prod.reviewCount, 1);
    });

    test("POST /api/v1/reviews - blocks duplicate review from same customer for same product", async () => {
      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          product: testProduct._id.toString(),
          rating: 4,
          comment: "Attempting to post another review for the same piece.",
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "REVIEW_ALREADY_EXISTS");
    });

    test("GET /api/v1/reviews/eligible/:productId - returns alreadyReviewed: true for customer who posted", async () => {
      const res = await request(app)
        .get(`/api/v1/reviews/eligible/${testProduct._id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.eligible, false);
      assert.equal(res.body.data.alreadyReviewed, true);
    });

    test("POST /api/v1/reviews - creates unverified review for patron without completed order", async () => {
      const res = await request(app)
        .post("/api/v1/reviews")
        .set("Authorization", `Bearer ${nonBuyerToken}`)
        .send({
          product: testProduct._id.toString(),
          rating: 4,
          title: "Beautiful color in photos",
          comment: "Fabric looks wonderfully tailored, gifting it to my sister.",
          city: "Delhi",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.isVerifiedPurchase, false);

      // Verify recalculated product average: (5 + 4) / 2 = 4.5
      const prod = await Product.findById(testProduct._id);
      assert.equal(prod.averageRating, 4.5);
      assert.equal(prod.reviewCount, 2);
    });

    test("GET /api/v1/reviews/product/:productId - returns review list and rating breakdown summary", async () => {
      const res = await request(app).get(`/api/v1/reviews/product/${testProduct.slug}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 2);
      assert.equal(res.body.summary.averageRating, 4.5);
      assert.equal(res.body.summary.totalReviews, 2);
      assert.equal(res.body.summary.breakdown[5], 1);
      assert.equal(res.body.summary.breakdown[4], 1);
    });

    test("POST /api/v1/reviews/admin/:id/reply - allows staff to post official atelier reply", async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/admin/${createdReviewId}/reply`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          adminReply: "Thank you Meera Ji! We are delighted the hand-block Mulmul brought grace to your Diwali celebrations.",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.adminReply.includes("Thank you Meera Ji"));
    });

    // RBAC: Edit Review Authorization
    test("PUT /api/v1/reviews/:id - allows author customer to edit their review", async () => {
      const res = await request(app)
        .put(`/api/v1/reviews/${createdReviewId}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 4,
          title: "Updated: Beautiful fabric and excellent fit",
          comment: "Updated review: Still in love with the hand-block prints after washing!",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.rating, 4);
      assert.equal(res.body.data.title, "Updated: Beautiful fabric and excellent fit");
    });

    test("PUT /api/v1/reviews/:id - blocks other customers from editing someone else's review (403 Forbidden)", async () => {
      const res = await request(app)
        .put(`/api/v1/reviews/${createdReviewId}`)
        .set("Authorization", `Bearer ${nonBuyerToken}`)
        .send({
          rating: 1,
          comment: "Maliciously attempting to alter another customer's review.",
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.error.code, "FORBIDDEN");
    });

    test("PUT /api/v1/reviews/:id - allows staff/admin to edit any review", async () => {
      const res = await request(app)
        .put(`/api/v1/reviews/${createdReviewId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          title: "Moderated: Beautiful hand-block ethnic wear",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.title, "Moderated: Beautiful hand-block ethnic wear");
    });

    // RBAC: Delete Review Authorization
    test("DELETE /api/v1/reviews/:id - blocks other customers from deleting someone else's review (403 Forbidden)", async () => {
      const res = await request(app)
        .delete(`/api/v1/reviews/${createdReviewId}`)
        .set("Authorization", `Bearer ${nonBuyerToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.error.code, "FORBIDDEN");
    });

    test("DELETE /api/v1/reviews/:id - allows author customer to delete their own review and recalculates rating", async () => {
      const res = await request(app)
        .delete(`/api/v1/reviews/${createdReviewId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify product rating recalculation
      const prod = await Product.findById(testProduct._id);
      assert.equal(prod.reviewCount, 1); // 1 remaining review from nonBuyer
    });

    test("GET /api/v1/reviews/product/:productId - public visitors can view remaining reviews without authentication", async () => {
      const res = await request(app).get(`/api/v1/reviews/product/${testProduct.slug}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 1);
    });
  });

  // 3. WISHLIST MANAGEMENT & SYNC
  describe("Wishlist Toggle & Guest Sync", () => {
    test("POST /api/v1/wishlist/toggle - adds product to user wishlist", async () => {
      const res = await request(app)
        .post("/api/v1/wishlist/toggle")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          productId: testProduct._id.toString(),
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.isWishlisted, true);
      assert.equal(res.body.data.totalItems, 1);
    });

    test("GET /api/v1/wishlist - returns populated wishlist products", async () => {
      const res = await request(app)
        .get("/api/v1/wishlist")
        .set("Authorization", `Bearer ${customerToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].name, testProduct.name);
    });

    test("POST /api/v1/wishlist/toggle - removes product when toggled again", async () => {
      const res = await request(app)
        .post("/api/v1/wishlist/toggle")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          productId: testProduct._id.toString(),
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.isWishlisted, false);
      assert.equal(res.body.data.totalItems, 0);
    });

    test("POST /api/v1/wishlist/sync - batch syncs guest items from localStorage to user account", async () => {
      const res = await request(app)
        .post("/api/v1/wishlist/sync")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          productIds: [testProduct._id.toString()],
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0]._id.toString(), testProduct._id.toString());
    });
  });
});
