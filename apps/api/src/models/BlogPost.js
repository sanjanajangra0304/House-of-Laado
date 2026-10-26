import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: "Jaipur Atelier Stylist",
    },
    tags: {
      type: [String],
      default: ["Ethnic Wear", "Jaipur Cotton", "Style Guide"],
    },
    readTimeMinutes: {
      type: Number,
      default: 4,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    metaTitle: {
      type: String,
      default: "",
    },
    metaDescription: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

blogPostSchema.index({ isPublished: 1, publishedAt: -1 });

export const BlogPost = mongoose.model("BlogPost", blogPostSchema);
