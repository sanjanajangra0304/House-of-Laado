import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      default: "India",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      default: "",
    },
    comment: {
      type: String,
      required: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "hidden"],
      default: "approved",
      index: true,
    },
    adminReply: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);
