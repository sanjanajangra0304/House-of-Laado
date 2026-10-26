import mongoose from "mongoose";

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, default: "" },
    size: { type: String, required: true },
    color: { type: String, default: "Default" },
    stock: { type: Number, default: 10, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    barcode: { type: String, default: "" },
    price: { type: Number, default: null },
    image: { type: String, default: "" },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    categorySlug: {
      type: String,
      required: true,
      index: true,
    },
    fabric: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: 0,
      index: true,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    sizes: {
      type: [String],
      default: ["XS", "S", "M", "L", "XL", "XXL"],
    },
    colors: [colorSchema],
    variants: [variantSchema],
    primaryImage: {
      type: String,
      required: [true, "Primary image is required"],
    },
    secondaryImage: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: true,
      default: 20,
      min: 0,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.8,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.8,
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to provide price alias for sellingPrice
productSchema.virtual("price").get(function () {
  return this.sellingPrice;
}).set(function (val) {
  this.sellingPrice = val;
});

// Compound indexes for optimal catalog queries
productSchema.index({ categorySlug: 1, status: 1, sellingPrice: 1 });
productSchema.index({ status: 1, createdAt: -1 });

// Full-text search index for keyword searching
productSchema.index({
  name: "text",
  description: "text",
  fabric: "text",
});

export const Product = mongoose.model("Product", productSchema);
