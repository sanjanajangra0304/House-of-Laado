import * as contentService from "./content.service.js";

export async function listBlogPosts(req, res, next) {
  try {
    const result = await contentService.listBlogPosts(req.query);
    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBlogPostBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const result = await contentService.getBlogPostBySlug(slug);
    res.json({
      success: true,
      data: result.post,
      related: result.related,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPageBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const page = await contentService.getPageBySlug(slug);
    res.json({
      success: true,
      data: page,
    });
  } catch (err) {
    next(err);
  }
}

export async function submitContact(req, res, next) {
  try {
    const ip = req.ip || req.headers["x-forwarded-for"] || "";
    const contact = await contentService.createContactMessage(req.body, ip);
    res.status(201).json({
      success: true,
      message: "Thank you for writing to us. Our Jaipur atelier concierge will reach out within 24 hours.",
      data: contact,
    });
  } catch (err) {
    next(err);
  }
}

export async function subscribeNewsletter(req, res, next) {
  try {
    const { email, source } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_EMAIL", message: "Please provide a valid email address." },
      });
    }

    const result = await contentService.subscribeNewsletter(email, source);
    res.status(201).json({
      success: true,
      message: "✨ Thank you for subscribing! Your 10% welcome coupon code has been sent to your inbox.",
      data: {
        ...(result.subscriber.toObject ? result.subscriber.toObject() : result.subscriber),
        couponCode: result.couponCode,
        discountPercent: result.discountPercent,
        emailSent: Boolean(result.emailResult?.delivered),
      },
    });
  } catch (err) {
    next(err);
  }
}
