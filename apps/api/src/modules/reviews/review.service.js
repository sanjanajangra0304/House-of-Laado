import mongoose from "mongoose";
import { Review } from "../../models/Review.js";
import { Product } from "../../models/Product.js";
import { Order } from "../../models/Order.js";

/**
 * Recalculate average rating and review count for a product
 */
export async function recalculateProductRating(productId) {
  const prodId = typeof productId === "string" ? new mongoose.Types.ObjectId(productId) : productId;

  const stats = await Review.aggregate([
    { $match: { product: prodId, status: "approved" } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const count = stats.length ? stats[0].count : 0;

  await Product.findByIdAndUpdate(prodId, {
    averageRating: avg,
    rating: avg,
    reviewCount: count,
    reviewsCount: count,
  });

  return { averageRating: avg, reviewCount: count };
}

/**
 * Submit a customer review
 */
export async function createReview(user, payload) {
  const { product, rating, title = "", comment, name, city = "India" } = payload;

  // 1. Resolve product
  let productDoc = null;
  if (mongoose.Types.ObjectId.isValid(product)) {
    productDoc = await Product.findById(product);
  }
  if (!productDoc) {
    productDoc = await Product.findOne({ slug: product });
  }

  if (!productDoc) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    err.code = "PRODUCT_NOT_FOUND";
    throw err;
  }

  // 2. Check for duplicate review from the same user
  if (user) {
    const existing = await Review.findOne({
      product: productDoc._id,
      user: user._id,
    });
    if (existing) {
      const err = new Error("You have already reviewed this product.");
      err.statusCode = 400;
      err.code = "REVIEW_ALREADY_EXISTS";
      throw err;
    }
  }

  // 3. Verify Purchase Status
  let isVerifiedPurchase = false;
  let matchingOrder = null;

  if (user) {
    matchingOrder = await Order.findOne({
      $or: [{ user: user._id }, { "customerDetails.email": user.email.toLowerCase() }],
      "items.product": productDoc._id,
    });
    if (matchingOrder) {
      isVerifiedPurchase = true;
    }
  }

  // 4. Create Review
  const reviewerName = (user ? user.name : name) || "Verified Patron";
  const review = await Review.create({
    product: productDoc._id,
    user: user ? user._id : null,
    order: matchingOrder ? matchingOrder._id : null,
    name: reviewerName,
    city: city || "Jaipur",
    rating,
    title,
    comment,
    isVerifiedPurchase,
    status: "approved",
  });

  // 5. Recalculate product rating metrics
  await recalculateProductRating(productDoc._id);

  return review;
}

/**
 * Get public approved reviews for a product with rating summary
 */
export async function getProductReviews(productId, query = {}) {
  const { page = 1, limit = 10, sort = "newest" } = query;

  let productDoc = null;
  if (mongoose.Types.ObjectId.isValid(productId)) {
    productDoc = await Product.findById(productId);
  }
  if (!productDoc) {
    productDoc = await Product.findOne({ slug: productId });
  }

  if (!productDoc) {
    return {
      reviews: [],
      summary: {
        averageRating: 0,
        totalReviews: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
      pagination: { total: 0, page: 1, limit: 10, pages: 1 },
    };
  }

  const filter = { product: productDoc._id, status: "approved" };

  let sortOption = { createdAt: -1 };
  if (sort === "highest") sortOption = { rating: -1, createdAt: -1 };
  if (sort === "lowest") sortOption = { rating: 1, createdAt: -1 };

  const skip = (page - 1) * limit;

  const [reviews, total, allApproved] = await Promise.all([
    Review.find(filter).sort(sortOption).skip(skip).limit(Number(limit)).lean(),
    Review.countDocuments(filter),
    Review.find(filter).select("rating").lean(),
  ]);

  // Compute 5-star distribution breakdown
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumRating = 0;
  for (const r of allApproved) {
    if (breakdown[r.rating] !== undefined) {
      breakdown[r.rating]++;
    }
    sumRating += r.rating;
  }

  const averageRating = allApproved.length
    ? Math.round((sumRating / allApproved.length) * 10) / 10
    : 0;

  return {
    reviews,
    summary: {
      averageRating,
      totalReviews: total,
      breakdown,
    },
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Check if logged-in user is eligible to write a review
 */
export async function checkReviewEligibility(user, productId) {
  if (!user) {
    return {
      eligible: false,
      reason: "Authentication required to review.",
      isVerifiedPurchase: false,
    };
  }

  let productDoc = null;
  if (mongoose.Types.ObjectId.isValid(productId)) {
    productDoc = await Product.findById(productId);
  }
  if (!productDoc) {
    productDoc = await Product.findOne({ slug: productId });
  }

  if (!productDoc) {
    return { eligible: false, reason: "Product not found" };
  }

  // Check if already reviewed
  const existing = await Review.findOne({
    product: productDoc._id,
    user: user._id,
  });

  if (existing) {
    return {
      eligible: false,
      alreadyReviewed: true,
      existingReview: existing,
    };
  }

  // Check if purchased
  const order = await Order.findOne({
    $or: [{ user: user._id }, { "customerDetails.email": user.email.toLowerCase() }],
    "items.product": productDoc._id,
  });

  return {
    eligible: true,
    alreadyReviewed: false,
    isVerifiedPurchase: !!order,
  };
}

/**
 * Admin: List all reviews across the catalog
 */
export async function listAllReviews(query = {}) {
  const { page = 1, limit = 20, status } = query;
  const filter = {};

  if (status && status !== "all") {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("product", "name slug primaryImage sellingPrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Admin: Update review moderation status
 */
export async function updateReviewStatus(reviewId, status) {
  const review = await Review.findById(reviewId);
  if (!review) {
    const err = new Error("Review not found");
    err.statusCode = 404;
    throw err;
  }

  review.status = status;
  await review.save();

  // Recalculate product rating
  await recalculateProductRating(review.product);

  return review;
}

/**
 * Admin: Post official response to customer review
 */
export async function addAdminReply(reviewId, adminReply) {
  const review = await Review.findById(reviewId);
  if (!review) {
    const err = new Error("Review not found");
    err.statusCode = 404;
    throw err;
  }

  review.adminReply = adminReply;
  await review.save();

  return review;
}

/**
 * Edit review: Allowed ONLY by the author customer or an admin/staff
 */
export async function updateReview(user, reviewId, payload) {
  if (!user) {
    const err = new Error("Authentication required to edit a review.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    const err = new Error("Review not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  const isAdmin = ["admin", "owner", "staff"].includes(user.role);
  const isOwner = review.user && review.user.toString() === user._id.toString();

  if (!isAdmin && !isOwner) {
    const err = new Error("You do not have permission to edit this review. Only the author or an admin can edit it.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  let ratingChanged = false;
  if (payload.rating !== undefined && Number(payload.rating) !== review.rating) {
    review.rating = Number(payload.rating);
    ratingChanged = true;
  }
  if (payload.title !== undefined) {
    review.title = payload.title.trim();
  }
  if (payload.comment !== undefined) {
    review.comment = payload.comment.trim();
  }
  if (payload.city !== undefined) {
    review.city = payload.city.trim();
  }

  await review.save();

  if (ratingChanged) {
    await recalculateProductRating(review.product);
  }

  return review;
}

/**
 * Delete review: Allowed ONLY by the author customer or an admin/staff
 */
export async function deleteReview(user, reviewId) {
  if (!user) {
    const err = new Error("Authentication required to delete a review.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    const err = new Error("Review not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  const isAdmin = ["admin", "owner", "staff"].includes(user.role);
  const isOwner = review.user && review.user.toString() === user._id.toString();

  if (!isAdmin && !isOwner) {
    const err = new Error("You do not have permission to delete this review. Only the author or an admin can delete it.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  const productId = review.product;
  await Review.findByIdAndDelete(reviewId);

  // Recalculate product rating & count after deletion
  await recalculateProductRating(productId);

  return { success: true };
}
