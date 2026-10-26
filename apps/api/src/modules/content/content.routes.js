import { Router } from "express";
import * as contentController from "./content.controller.js";

const router = Router();

// Blog & Editorial Journal
router.get("/blog", contentController.listBlogPosts);
router.get("/blog/:slug", contentController.getBlogPostBySlug);

// Policy & Information Pages
router.get("/pages/:slug", contentController.getPageBySlug);

// Customer Contact & Inquiries
router.post("/contact", contentController.submitContact);

// Newsletter Subscription
router.post("/newsletter", contentController.subscribeNewsletter);

export default router;
