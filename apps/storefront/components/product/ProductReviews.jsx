"use client";

import { useState, useEffect } from "react";
import {
  Star,
  ShieldCheck,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Sparkles,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  fetchProductReviewsApi,
  submitReviewApi,
  checkReviewEligibilityApi,
  updateReviewApi,
  deleteReviewApi,
} from "@/lib/api";

export function ProductReviews({ productId, productName }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");

  // Current viewer authentication
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal / new review form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Jaipur");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Inline edit state
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Eligibility check
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    loadReviews();
    checkEligibility();
    checkViewerAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, sortBy]);

  const checkViewerAuth = () => {
    try {
      const savedUser = localStorage.getItem("customer_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      const adminToken = localStorage.getItem("admin_token");
      const adminUser = localStorage.getItem("admin_user");
      if (adminToken || (adminUser && JSON.parse(adminUser)?.role === "admin")) {
        setIsAdmin(true);
      }
    } catch {}
  };

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetchProductReviewsApi(productId, { sort: sortBy });
      if (res.success) {
        setReviews(res.data || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      // Fallback demo state if network disconnected
    } finally {
      setIsLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const savedUser = localStorage.getItem("customer_user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setName(u.name || "");
        const res = await checkReviewEligibilityApi(productId);
        if (res.success) {
          setEligibility(res.data);
        }
      }
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (!comment.trim() || comment.trim().length < 5) {
      setSubmitError("Please write at least 5 characters for your review.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitReviewApi({
        product: productId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        name: name.trim() || undefined,
        city: city.trim() || undefined,
      });

      if (res.success) {
        setSubmitSuccess(true);
        setTitle("");
        setComment("");
        setTimeout(() => {
          setShowForm(false);
          setSubmitSuccess(false);
          loadReviews();
          checkEligibility();
        }, 1500);
      } else {
        setSubmitError(res.error?.message || "Failed to submit review.");
      }
    } catch (err) {
      setSubmitError(err.message || "An error occurred while submitting your review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (rev) => {
    setEditingReviewId(rev._id || rev.id);
    setEditRating(rev.rating || 5);
    setEditHoverRating(0);
    setEditTitle(rev.title || "");
    setEditComment(rev.comment || "");
    setUpdateError("");
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setUpdateError("");
  };

  const handleSaveEdit = async (reviewId) => {
    if (!editComment.trim() || editComment.trim().length < 5) {
      setUpdateError("Review must be at least 5 characters long.");
      return;
    }

    setIsUpdating(true);
    setUpdateError("");
    try {
      const res = await updateReviewApi(reviewId, {
        rating: editRating,
        title: editTitle.trim(),
        comment: editComment.trim(),
      });

      if (res.success) {
        setEditingReviewId(null);
        loadReviews();
      } else {
        setUpdateError(res.error?.message || "Failed to update review.");
      }
    } catch (err) {
      setUpdateError(err.message || "Failed to update review.");
    } finally {
      setIsUpdating(false);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const handleConfirmDelete = async (reviewId) => {
    setDeletingId(reviewId);
    setDeleteError("");
    try {
      const res = await deleteReviewApi(reviewId);
      if (res.success) {
        setConfirmDeleteId(null);
        loadReviews();
        checkEligibility();
      } else {
        setDeleteError(res.error?.message || "Failed to delete review.");
      }
    } catch (err) {
      setDeleteError(err.message || "Failed to delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalCount = summary.totalReviews || 1;

  return (
    <div className="border-t border-border pt-12 mt-12" id="customer-reviews">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-2xl font-bold text-dark flex items-center gap-2">
            <span>Verified Customer Reviews</span>
            <span className="text-sm font-sans font-normal text-muted">
              ({summary.totalReviews})
            </span>
          </h2>
          <p className="text-xs text-muted-light mt-1">
            Real feedback from patrons across India who experienced our hand-block tailoring.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-xs py-2.5 px-5 flex items-center justify-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Review Form Drawer / Modal */}
      {showForm && (
        <div className="mb-10 bg-blush-light border border-blush rounded-2xl p-6 sm:p-8 relative">
          <button
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 text-burgundy/70 hover:text-burgundy cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="font-serif font-bold text-lg text-burgundy mb-1">
            Share Your Experience with {productName}
          </h3>
          <p className="text-xs text-burgundy/80 mb-6">
            Help other patrons choose the perfect fit and styling.
          </p>

          {submitSuccess ? (
            <div className="p-4 rounded-xl bg-olive/10 border border-olive/30 text-olive text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-olive flex-shrink-0" />
              <span>Thank you! Your verified review has been published.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-rose text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Star Rating Picker */}
              <div>
                <label className="text-xs font-semibold text-burgundy block mb-1.5">
                  Your Overall Rating *
                </label>
                <div className="flex items-center space-x-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          (hoverRating || rating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-blush"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-burgundy ml-2">
                    {rating} out of 5 stars
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-burgundy block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditi Singhania"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-pill w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-burgundy block mb-1">
                    City / State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input-pill w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-burgundy block mb-1">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stunning hand-block prints and breathable cotton fabric!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-pill w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-burgundy block mb-1">
                  Detailed Review *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the fabric quality, color richness, fit, and stitching..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-2xl border border-blush p-3 text-xs focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose bg-ivory-light text-burgundy"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-outline text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs py-2 px-6 flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Verified Review</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Ratings Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-blush-light border border-blush rounded-2xl p-6 sm:p-8 mb-8">
        {/* Overall score (4 cols) */}
        <div className="md:col-span-4 text-center md:border-r md:border-blush/60 md:pr-6">
          <div className="font-serif text-5xl font-bold text-burgundy">
            {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "5.0"}
          </div>
          <div className="flex items-center justify-center space-x-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4 fill-amber-400 text-amber-400"
              />
            ))}
          </div>
          <p className="text-xs text-burgundy/80">
            Based on {summary.totalReviews} verified patron reviews
          </p>
          <div className="inline-flex items-center gap-1 mt-3 px-2.5 py-0.5 rounded-full bg-olive/10 text-olive text-[10px] font-semibold border border-olive/30">
            <ShieldCheck className="w-3 h-3 text-olive" />
            <span>100% Authentic Handloom Feedback</span>
          </div>
        </div>

        {/* Breakdown progress bars (8 cols) */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((ratingVal) => {
            const count = summary.breakdown?.[ratingVal] || 0;
            const percentage = Math.round((count / (summary.totalReviews || 1)) * 100);
            return (
              <div key={ratingVal} className="flex items-center space-x-3 text-xs">
                <span className="w-12 font-medium text-burgundy flex items-center gap-1">
                  <span>{ratingVal}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-blush/40 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-burgundy/70 font-mono text-[11px]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Filter & Sort */}
      <div className="flex items-center justify-between pb-4 border-b border-blush/80 mb-6 text-xs">
        <span className="font-semibold text-burgundy">
          Showing {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </span>
        <div className="flex items-center space-x-2">
          <label className="text-burgundy/80 text-[11px]">Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-pill py-1 text-xs bg-ivory-light border border-blush text-burgundy"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-burgundy/80">
          Loading customer reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-10 text-center bg-blush-light border border-blush rounded-2xl my-4">
          <MessageSquare className="w-10 h-10 text-blush mx-auto mb-2 stroke-[1.2]" />
          <h4 className="font-serif font-bold text-burgundy text-sm mb-1">
            Be the First to Review This Style!
          </h4>
          <p className="text-xs text-burgundy/80 max-w-sm mx-auto mb-4">
            Share your thoughts on the silhouette, hand-block printing, and fit.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-xs py-2 px-5 cursor-pointer"
          >
            Write a Review
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((rev) => {
            const reviewId = rev._id || rev.id;
            const reviewUserId = rev.user?._id || rev.user;
            const currentUserId = currentUser?._id || currentUser?.id;
            const isAuthor = Boolean(
              currentUserId &&
              reviewUserId &&
              String(reviewUserId) === String(currentUserId)
            );
            const canModify = Boolean(isAuthor || isAdmin);
            const isEditing = editingReviewId === reviewId;

            return (
              <div
                key={reviewId}
                className="bg-ivory-light border border-blush rounded-2xl p-6 shadow-xs space-y-3 relative"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blush-light border border-blush flex items-center justify-center font-bold text-rose text-xs">
                      {(rev.name || "P")[0].toUpperCase()}
                    </div>
                    <div>
                      <h5 className="font-serif font-bold text-xs text-burgundy">
                        {rev.name}
                        {isAuthor && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-rose/10 text-rose font-sans font-normal">
                            You
                          </span>
                        )}
                      </h5>
                      <p className="text-[10px] text-burgundy/70">{rev.city || "Jaipur, India"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    {rev.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-olive bg-olive/10 px-2.5 py-0.5 rounded-full border border-olive/30">
                        <ShieldCheck className="w-3.5 h-3.5 text-olive" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                    <span className="text-[11px] text-burgundy/60">
                      {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    {/* Author or Admin Exclusive Edit & Delete Actions */}
                    {canModify && !isEditing && (
                      <div className="flex items-center space-x-1 ml-2 border-l border-blush pl-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(rev)}
                          className="p-1 rounded-md text-burgundy/70 hover:text-burgundy hover:bg-blush/40 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                          title="Edit review"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        {confirmDeleteId === reviewId ? (
                          <div className="flex items-center gap-1.5 text-[11px] bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-lg animate-in fade-in">
                            <span>Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(reviewId)}
                              disabled={deletingId === reviewId}
                              className="font-bold underline text-red-700 hover:text-red-900 cursor-pointer"
                            >
                              {deletingId === reviewId ? "Deleting..." : "Yes"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deletingId === reviewId}
                              className="text-stone-500 hover:text-stone-800 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(reviewId)}
                            className="p-1 rounded-md text-rose/70 hover:text-rose hover:bg-rose/10 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                            title="Delete review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Editing Mode */}
                {isEditing ? (
                  <div className="mt-3 p-4 rounded-xl bg-blush-light border border-blush space-y-3">
                    <h5 className="font-serif font-bold text-xs text-burgundy">
                      Edit Your Review
                    </h5>

                    {updateError && (
                      <div className="p-2.5 rounded-lg bg-rose/10 border border-rose/30 text-rose text-xs flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose flex-shrink-0" />
                        <span>{updateError}</span>
                      </div>
                    )}

                    {/* Rating picker */}
                    <div>
                      <label className="text-[11px] font-semibold text-burgundy block mb-1">
                        Rating *
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setEditHoverRating(star)}
                            onMouseLeave={() => setEditHoverRating(0)}
                            onClick={() => setEditRating(star)}
                            className="p-0.5 focus:outline-none cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                (editHoverRating || editRating) >= star
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-blush"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-burgundy ml-2">
                          {editRating} / 5
                        </span>
                      </div>
                    </div>

                    {/* Title input */}
                    <div>
                      <label className="text-[11px] font-semibold text-burgundy block mb-1">
                        Headline
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Review title"
                        className="input-pill w-full text-xs bg-ivory-light"
                      />
                    </div>

                    {/* Comment textarea */}
                    <div>
                      <label className="text-[11px] font-semibold text-burgundy block mb-1">
                        Review *
                      </label>
                      <textarea
                        rows={3}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        className="w-full rounded-xl border border-blush p-2.5 text-xs bg-ivory-light text-burgundy focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose"
                      />
                    </div>

                    <div className="flex justify-end items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        className="btn-outline text-xs py-1.5 px-3 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(reviewId)}
                        disabled={isUpdating}
                        className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Star Rating & Title */}
                    <div>
                      <div className="flex items-center space-x-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              rev.rating >= star
                                ? "fill-amber-400 text-amber-400"
                                : "text-stone-300"
                            }`}
                          />
                        ))}
                      </div>
                      {rev.title && (
                        <h4 className="font-serif font-bold text-dark text-xs sm:text-sm">
                          {rev.title}
                        </h4>
                      )}
                    </div>

                    {/* Review Comment */}
                    <p className="text-xs text-neutral-700 leading-relaxed">
                      {rev.comment}
                    </p>

                    {/* Atelier Official Reply */}
                    {rev.adminReply && (
                      <div className="p-3.5 rounded-xl bg-sand/30 border border-border text-xs space-y-1 mt-2">
                        <div className="flex items-center gap-1.5 font-bold text-primary text-[11px]">
                          <Sparkles className="w-3 h-3" />
                          <span>Response from House of Laado Atelier</span>
                        </div>
                        <p className="text-neutral-700 text-[11px]">
                          {rev.adminReply}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
