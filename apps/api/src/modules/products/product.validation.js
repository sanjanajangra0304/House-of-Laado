import Joi from "joi";

export const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(12),
  category: Joi.string().trim().lowercase().allow("all"),
  size: Joi.string().valid("XS", "S", "M", "L", "XL", "XXL", "Free Size", "all"),
  fabric: Joi.string().trim().allow("all"),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  search: Joi.string().trim().max(100).allow(""),
  sort: Joi.string().valid("featured", "price-asc", "price-desc", "price_asc", "price_desc", "bestselling", "rating", "newest").default("featured"),
  status: Joi.string().valid("active", "draft", "archived", "all").default("active"),
  isBestSeller: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  isNewArrival: Joi.boolean().optional(),
});

const colorSchema = Joi.object({
  name: Joi.string().required(),
  hex: Joi.string().pattern(/^#([0-9a-fA-F]{3}){1,2}$/).required(),
});

const variantSchema = Joi.object({
  size: Joi.string().valid("XS", "S", "M", "L", "XL", "XXL", "Free Size").required(),
  color: Joi.string().trim().allow("").default("Default"),
  stock: Joi.number().integer().min(0).default(0),
  sku: Joi.string().allow("").optional(),
  price: Joi.number().min(0).allow(null).optional(),
  reservedStock: Joi.number().integer().min(0).optional(),
  barcode: Joi.string().allow("").optional(),
  image: Joi.string().allow("").optional(),
  _id: Joi.any().optional(),
  id: Joi.any().optional(),
});

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  slug: Joi.string().trim().lowercase().optional(),
  category: Joi.string().required(),
  categorySlug: Joi.string().trim().lowercase().optional(),
  fabric: Joi.string().trim().required(),
  description: Joi.string().trim().min(5).required(),
  sellingPrice: Joi.number().min(0).required(),
  compareAtPrice: Joi.number().min(0).default(0),
  sku: Joi.string().allow("").optional(),
  sizes: Joi.array().items(Joi.string().valid("XS", "S", "M", "L", "XL", "XXL", "Free Size")).default(["S", "M", "L", "XL"]),
  colors: Joi.array().items(colorSchema).default([]),
  variants: Joi.array().items(variantSchema).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  primaryImage: Joi.string().trim().min(1).required(),
  secondaryImage: Joi.string().trim().allow("").default(""),
  images: Joi.array().items(Joi.string().trim()).default([]),
  stock: Joi.number().integer().min(0).default(20),
  isNewArrival: Joi.boolean().default(false),
  isBestSeller: Joi.boolean().default(false),
  isFeatured: Joi.boolean().default(false),
  status: Joi.string().valid("active", "draft", "archived").default("active"),
});

export const updateProductSchema = createProductSchema.fork(
  ["name", "category", "fabric", "description", "sellingPrice", "primaryImage"],
  (schema) => schema.optional()
);
