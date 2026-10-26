import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    desktopImage: {
      type: String,
      required: [true, "Desktop banner image is required"],
    },
    mobileImage: {
      type: String,
      required: [true, "Mobile banner image is required"],
    },
    link: {
      type: String,
      default: "/collections/suit-sets",
    },
    ctaText: {
      type: String,
      default: "Shop Collection",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, displayOrder: 1 });

export const Banner = mongoose.model("Banner", bannerSchema);
