import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import {
  BlogPost,
  Page,
  ContactMessage,
  NewsletterSubscriber,
} from "../src/models/index.js";

const app = createApp();

describe("Phase 7: Content, SEO, Policies & Brand Discovery", () => {
  let seededPost1 = null;
  let seededPost2 = null;
  let seededPage = null;

  before(async () => {
    await connectDB();

    // 1. Seed test blog posts
    seededPost1 = await BlogPost.findOneAndUpdate(
      { slug: "art-of-bagru-block-printing" },
      {
        title: "The 400-Year Legacy of Bagru Hand-Block Printing",
        slug: "art-of-bagru-block-printing",
        excerpt: "Discover the natural mud-resist Dabu technique perfected by Chippa artisans.",
        content: "Bagru printing utilizes traditional vegetable dyes extracted from indigo, harda, and madder roots.",
        coverImage: "https://example.com/bagru.jpg",
        author: "Atelier Historian",
        tags: ["Artisan Craft", "Handloom Heritage", "Jaipur Cotton"],
        readTimeMinutes: 5,
        isPublished: true,
      },
      { upsert: true, new: true }
    );

    seededPost2 = await BlogPost.findOneAndUpdate(
      { slug: "caring-for-mulmul-cotton" },
      {
        title: "How to Care for Handcrafted Mulmul & Chanderi Silks",
        slug: "caring-for-mulmul-cotton",
        excerpt: "Gentle laundering guidelines to preserve vibrant block dyes and gold zari.",
        content: "Always hand-wash in cold water with mild organic detergent and dry inside-out in shade.",
        coverImage: "https://example.com/care.jpg",
        author: "Master Dyer",
        tags: ["Fabric Care", "Jaipur Cotton"],
        readTimeMinutes: 3,
        isPublished: true,
      },
      { upsert: true, new: true }
    );

    // 2. Seed test policy page
    seededPage = await Page.findOneAndUpdate(
      { slug: "shipping-policy" },
      {
        slug: "shipping-policy",
        title: "Shipping & Nationwide Delivery Policy",
        content: "Orders are dispatched within 24-48 business hours from our Jaipur fulfillment hub.",
        metaTitle: "Shipping & Delivery Information | Vastra Loom",
        metaDescription: "Free express shipping across India on orders above ₹999.",
        isPublished: true,
      },
      { upsert: true, new: true }
    );
  });

  after(async () => {
    await ContactMessage.deleteMany({ email: "test_inquiry@vastraloom.com" });
    await NewsletterSubscriber.deleteMany({ email: "patron_newsletter@vastraloom.com" });
    await disconnectDB();
  });

  // 1. BLOG & JOURNAL ENGINE
  describe("Blog & Editorial Journal Engine", () => {
    test("GET /api/v1/content/blog - lists published journal posts", async () => {
      const res = await request(app).get("/api/v1/content/blog");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length >= 2);
      assert.ok(res.body.pagination.total >= 2);
    });

    test("GET /api/v1/content/blog?tag=Artisan Craft - filters articles by craft tag", async () => {
      const res = await request(app).get("/api/v1/content/blog?tag=Artisan Craft");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      const allHaveTag = res.body.data.every((p) => p.tags.includes("Artisan Craft"));
      assert.equal(allHaveTag, true);
    });

    test("GET /api/v1/content/blog/:slug - returns post details with related recommendations", async () => {
      const res = await request(app).get(`/api/v1/content/blog/${seededPost1.slug}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.title, seededPost1.title);
      assert.ok(res.body.data.content);
      assert.ok(Array.isArray(res.body.related));
    });

    test("GET /api/v1/content/blog/:slug - returns 404 for unknown article slug", async () => {
      const res = await request(app).get("/api/v1/content/blog/non-existent-article-xyz");
      assert.equal(res.status, 404);
    });
  });

  // 2. POLICY & LEGAL INFORMATION PAGES
  describe("Policy & Legal Information Pages", () => {
    test("GET /api/v1/content/pages/:slug - returns published policy page content", async () => {
      const res = await request(app).get("/api/v1/content/pages/shipping-policy");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.title, seededPage.title);
      assert.ok(res.body.data.content.includes("Jaipur fulfillment hub"));
    });

    test("GET /api/v1/content/pages/:slug - returns 404 for unknown page slug", async () => {
      const res = await request(app).get("/api/v1/content/pages/unknown-legal-page");
      assert.equal(res.status, 404);
    });
  });

  // 3. CONTACT INQUIRIES & NEWSLETTER
  describe("Customer Contact Inquiries & Newsletter Subscriptions", () => {
    test("POST /api/v1/content/contact - submits customer inquiry and stores in ContactMessage", async () => {
      const res = await request(app)
        .post("/api/v1/content/contact")
        .send({
          name: "Devendra Rathore",
          email: "test_inquiry@vastraloom.com",
          phone: "+91 98290 88888",
          subject: "Custom Bridal Anarkali Sizing",
          message: "Requesting custom bust and length measurements for an upcoming royal wedding.",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, "Devendra Rathore");
      assert.equal(res.body.data.status, "unread");

      // Verify database record
      const msg = await ContactMessage.findOne({ email: "test_inquiry@vastraloom.com" });
      assert.ok(msg);
      assert.equal(msg.subject, "Custom Bridal Anarkali Sizing");
    });

    test("POST /api/v1/content/newsletter - saves customer subscription idempotently", async () => {
      const res = await request(app)
        .post("/api/v1/content/newsletter")
        .send({
          email: "patron_newsletter@vastraloom.com",
          source: "artisan_journal_footer",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.email, "patron_newsletter@vastraloom.com");
      assert.equal(res.body.data.status, "subscribed");

      // Verify database record
      const sub = await NewsletterSubscriber.findOne({ email: "patron_newsletter@vastraloom.com" });
      assert.ok(sub);
      assert.equal(sub.status, "subscribed");
    });

    test("POST /api/v1/content/newsletter - rejects invalid email address", async () => {
      const res = await request(app)
        .post("/api/v1/content/newsletter")
        .send({
          email: "invalid-email-format",
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "INVALID_EMAIL");
    });
  });
});
