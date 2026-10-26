import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    metaTitle: {
      type: String,
      default: "",
    },
    metaDescription: {
      type: String,
      default: "",
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    needsLegalReview: {
      type: Boolean,
      default: true, // Marked for legal review until owner confirms
    },
  },
  { timestamps: true }
);

export const Page = mongoose.model("Page", pageSchema);
