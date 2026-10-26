import { BlogPost } from "../../models/BlogPost.js";
import { Page } from "../../models/Page.js";
import { ContactMessage } from "../../models/ContactMessage.js";
import { NewsletterSubscriber } from "../../models/NewsletterSubscriber.js";
import { sendNewsletterWelcomeNotification } from "../../services/notification.service.js";

/**
 * List published blog posts with optional tag filtering
 */
export async function listBlogPosts(query = {}) {
  const { page = 1, limit = 9, tag } = query;
  const filter = { isPublished: true };

  if (tag) {
    filter.tags = tag;
  }

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-content")
      .lean(),
    BlogPost.countDocuments(filter),
  ]);

  return {
    posts,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Get published blog post by slug
 */
export async function getBlogPostBySlug(slug) {
  const post = await BlogPost.findOne({
    slug: slug.toLowerCase().trim(),
    isPublished: true,
  }).lean();

  if (!post) {
    const err = new Error("Article not found");
    err.statusCode = 404;
    throw err;
  }

  // Get 2 related articles
  const related = await BlogPost.find({
    _id: { $ne: post._id },
    isPublished: true,
  })
    .limit(2)
    .select("title slug coverImage excerpt publishedAt")
    .lean();

  return { post, related };
}

/**
 * Get published policy or legal page by slug
 */
export async function getPageBySlug(slug) {
  const page = await Page.findOne({
    slug: slug.toLowerCase().trim(),
    isPublished: true,
  }).lean();

  if (!page) {
    const err = new Error("Page not found");
    err.statusCode = 404;
    throw err;
  }

  return page;
}

/**
 * Save customer contact / inquiry message
 */
export async function createContactMessage(payload, ipAddress = "") {
  const { name, email, phone = "", subject = "Customer Inquiry", message } = payload;

  const contact = await ContactMessage.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    subject: subject.trim(),
    message: message.trim(),
    ipAddress,
  });

  return contact;
}

/**
 * Subscribe customer email to newsletter
 */
export async function subscribeNewsletter(email, source = "footer") {
  const cleanEmail = email.toLowerCase().trim();
  const couponCode = "WELCOME10";

  let subscriber = await NewsletterSubscriber.findOne({ email: cleanEmail });

  if (!subscriber) {
    subscriber = await NewsletterSubscriber.create({
      email: cleanEmail,
      status: "subscribed",
      source,
      welcomeDiscountCode: couponCode,
      welcomeEmailSent: false,
    });
  } else {
    subscriber.status = "subscribed";
    subscriber.source = source;
    if (!subscriber.welcomeDiscountCode) {
      subscriber.welcomeDiscountCode = couponCode;
    }
  }

  // Dispatch Welcome Email with 10% coupon code
  let emailResult = null;
  try {
    emailResult = await sendNewsletterWelcomeNotification(cleanEmail, couponCode);
    subscriber.welcomeEmailSent = Boolean(
      emailResult?.delivered || emailResult?.configured === false || emailResult?.success
    );
    subscriber.welcomeEmailSentAt = new Date();
    await subscriber.save();
  } catch (emailErr) {
    console.error(`[Newsletter Welcome Email Error]: ${emailErr.message}`);
  }

  return {
    subscriber,
    couponCode,
    discountPercent: 10,
    emailResult,
  };
}
