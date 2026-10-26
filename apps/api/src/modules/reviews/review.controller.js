import * as reviewService from "./review.service.js";

export async function createReview(req, res, next) {
  try {
    const review = await reviewService.createReview(req.user || null, req.body);
    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductReviews(req, res, next) {
  try {
    const { productId } = req.params;
    const result = await reviewService.getProductReviews(productId, req.query);
    res.json({
      success: true,
      data: result.reviews,
      summary: result.summary,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function checkEligibility(req, res, next) {
  try {
    const { productId } = req.params;
    const result = await reviewService.checkReviewEligibility(req.user, productId);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAllReviews(req, res, next) {
  try {
    const result = await reviewService.listAllReviews(req.query);
    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateReviewStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await reviewService.updateReviewStatus(id, status);
    res.json({
      success: true,
      message: `Review status updated to ${status}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function addAdminReply(req, res, next) {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;
    const updated = await reviewService.addAdminReply(id, adminReply);
    res.json({
      success: true,
      message: "Admin reply posted successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateReview(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await reviewService.updateReview(req.user, id, req.body);
    res.json({
      success: true,
      message: "Review updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    await reviewService.deleteReview(req.user, id);
    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}
