import mongoose from "mongoose";

const homepageSectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const HomepageSection = mongoose.model("HomepageSection", homepageSectionSchema);
