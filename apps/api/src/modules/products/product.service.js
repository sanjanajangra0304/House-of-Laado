import mongoose from "mongoose";
import slugify from "slugify";
import { Product } from "../../models/Product.js";
import { Category } from "../../models/Category.js";
import { getColorHex } from "../../utils/colorHelper.js";

/**
 * Get products with server-side filtering, sorting, and pagination
 */
export async function getProducts(query = {}) {
  const {
    page = 1,
    limit = 12,
    category,
    size,
    fabric,
    minPrice,
    maxPrice,
    search,
    sort = "featured",
    status = "active",
  } = query;

  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }

  if (category && category !== "all") {
    const catLower = category.toLowerCase();
    if (mongoose.Types.ObjectId.isValid(category)) {
      filter.$or = [{ category }, { categorySlug: catLower }, { tags: catLower }];
    } else {
      filter.$or = [{ categorySlug: catLower }, { tags: catLower }];
    }
  }

  if (size && size !== "all") {
    filter.sizes = size;
  }

  if (fabric && fabric !== "all") {
    filter.fabric = new RegExp(`^${fabric}$`, "i");
  }

  if (query.isBestSeller === "true" || query.isBestSeller === true) {
    filter.isBestSeller = true;
  }
  if (query.isFeatured === "true" || query.isFeatured === true) {
    filter.isFeatured = true;
  }
  if (query.isNewArrival === "true" || query.isNewArrival === true) {
    filter.isNewArrival = true;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.sellingPrice = {};
    if (minPrice !== undefined) filter.sellingPrice.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.sellingPrice.$lte = Number(maxPrice);
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { name: { $regex: s, $options: "i" } },
      { categorySlug: { $regex: s, $options: "i" } },
      { fabric: { $regex: s, $options: "i" } },
      { description: { $regex: s, $options: "i" } },
    ];
  }

  // Determine sorting order
  let sortOption = { isFeatured: -1, createdAt: -1 };
  if (sort === "price-asc" || sort === "price_asc") {
    sortOption = { sellingPrice: 1 };
  } else if (sort === "price-desc" || sort === "price_desc") {
    sortOption = { sellingPrice: -1 };
  } else if (sort === "bestselling") {
    sortOption = { isBestSeller: -1, rating: -1 };
  } else if (sort === "rating") {
    sortOption = { rating: -1, reviewsCount: -1 };
  } else if (sort === "newest") {
    sortOption = { createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items: products.map(harmonizeProductOutput),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Harmonize product output for backward compatibility:
 * - Derives product.colors from variants if missing
 * - Synchronizes variant colors with product colors if legacy
 */
export function harmonizeProductOutput(product) {
  if (!product) return product;
  const p = product.toObject ? product.toObject({ virtuals: true }) : { ...product };

  if (Array.isArray(p.variants) && p.variants.length > 0) {
    const existingColorMap = new Map((p.colors || []).map((c) => [c.name?.toLowerCase(), c.hex]));
    const variantColors = Array.from(
      new Set(p.variants.map((v) => (v.color || "").trim()).filter((c) => c && c !== "Default"))
    );

    if (variantColors.length > 0 && (!p.colors || p.colors.length === 0)) {
      p.colors = variantColors.map((name) => ({
        name,
        hex: existingColorMap.get(name.toLowerCase()) || getColorHex(name),
      }));
    } else if (p.colors && p.colors.length > 0 && variantColors.length === 0) {
      const defaultName = p.colors[0].name;
      p.variants = p.variants.map((v) => ({
        ...v,
        color: !v.color || v.color === "Default" ? defaultName : v.color,
      }));
    }
  } else if (p.colors && p.colors.length > 0 && (!p.variants || p.variants.length === 0)) {
    const sizes = p.sizes?.length ? p.sizes : ["Free Size"];
    p.variants = [];
    for (const color of p.colors) {
      for (const size of sizes) {
        p.variants.push({
          sku: `HOL-${(p.slug || "PROD").toUpperCase()}-${size}-${color.name.replace(/\s+/g, "").toUpperCase()}`,
          size,
          color: color.name,
          stock: Math.max(1, Math.floor((p.stock || 10) / (sizes.length * p.colors.length))),
          price: p.sellingPrice,
          barcode: "",
        });
      }
    }
  }

  return p;
}

/**
 * Get a single product by its slug
 */
export async function getProductBySlug(slug) {
  const doc = await Product.findOne({ slug: slug.toLowerCase() })
    .populate("category", "name slug")
    .lean();
  return harmonizeProductOutput(doc);
}

/**
 * Get product by ID
 */
export async function getProductById(id) {
  const doc = await Product.findById(id).populate("category", "name slug");
  return harmonizeProductOutput(doc);
}

/**
 * Get curated featured and bestselling products
 */
export async function getFeaturedProducts(limit = 8) {
  return Product.find({
    status: "active",
    $or: [{ isFeatured: true }, { isBestSeller: true }],
  })
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * Create a new product (Admin)
 */
export async function createProduct(payload) {
  // 1. Resolve Category
  let categoryDoc;
  if (payload.category.match(/^[0-9a-fA-F]{24}$/)) {
    categoryDoc = await Category.findById(payload.category);
  } else {
    categoryDoc = await Category.findOne({ slug: payload.category.toLowerCase() });
  }

  if (!categoryDoc) {
    const err = new Error("Selected category does not exist.");
    err.statusCode = 400;
    err.code = "CATEGORY_NOT_FOUND";
    throw err;
  }

  // 2. Compute slug
  const baseSlug = payload.slug || slugify(payload.name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await Product.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  // 3. Compute discount percentage
  let discountPercent = 0;
  if (payload.compareAtPrice && payload.compareAtPrice > payload.sellingPrice) {
    discountPercent = Math.round(
      ((payload.compareAtPrice - payload.sellingPrice) / payload.compareAtPrice) * 100
    );
  }

  // 4. Normalize variants and synchronize colors/sizes/stock
  if (payload.variants && Array.isArray(payload.variants) && payload.variants.length > 0) {
    payload.variants = payload.variants.map((v) => {
      const color = (v.color || "").trim() || (payload.colors?.[0]?.name || "Default");
      const size = (v.size || "").trim();
      const stock = Math.max(0, parseInt(v.stock, 10) || 0);
      const price = v.price !== undefined && v.price !== null && v.price !== "" ? Number(v.price) : Number(payload.sellingPrice);
      const sku = (v.sku || "").trim() || `HOL-${baseSlug.toUpperCase()}-${size}${color !== "Default" ? `-${color.replace(/\s+/g, "").toUpperCase()}` : ""}`;
      const barcode = (v.barcode || "").trim() || `890${Math.floor(100000000 + Math.random() * 900000000)}`;
      return {
        ...v,
        size,
        color,
        stock,
        price,
        sku,
        barcode,
      };
    });

    const uniqueColorNames = Array.from(
      new Set(payload.variants.map((v) => v.color).filter((c) => c && c !== "Default"))
    );
    const existingColorMap = new Map((payload.colors || []).map((c) => [c.name?.toLowerCase(), c.hex]));
    if (uniqueColorNames.length > 0) {
      payload.colors = uniqueColorNames.map((name) => ({
        name,
        hex: existingColorMap.get(name.toLowerCase()) || getColorHex(name),
      }));
    }

    const uniqueSizes = Array.from(new Set(payload.variants.map((v) => v.size).filter(Boolean)));
    if (uniqueSizes.length > 0) {
      payload.sizes = uniqueSizes;
    }

    payload.stock = payload.variants.reduce((acc, curr) => acc + curr.stock, 0);
  }

  const product = new Product({
    ...payload,
    slug,
    category: categoryDoc._id,
    categorySlug: categoryDoc.slug,
    discountPercent,
  });

  await product.save();
  return harmonizeProductOutput(await product.populate("category", "name slug"));
}

/**
 * Update an existing product (Admin)
 */
export async function updateProduct(id, updates) {
  const product = await Product.findById(id);
  if (!product) {
    const err = new Error("Product not found.");
    err.statusCode = 404;
    err.code = "PRODUCT_NOT_FOUND";
    throw err;
  }

  if (updates.category) {
    let categoryDoc;
    if (updates.category.match(/^[0-9a-fA-F]{24}$/)) {
      categoryDoc = await Category.findById(updates.category);
    } else {
      categoryDoc = await Category.findOne({ slug: updates.category.toLowerCase() });
    }
    if (categoryDoc) {
      updates.category = categoryDoc._id;
      updates.categorySlug = categoryDoc.slug;
    }
  }

  if (updates.sellingPrice !== undefined || updates.compareAtPrice !== undefined) {
    const selling = updates.sellingPrice ?? product.sellingPrice;
    const compare = updates.compareAtPrice ?? product.compareAtPrice;
    if (compare && compare > selling) {
      updates.discountPercent = Math.round(((compare - selling) / compare) * 100);
    } else {
      updates.discountPercent = 0;
    }
  }

  // Normalize variants & synchronize colors/sizes/stock
  if (updates.variants && Array.isArray(updates.variants)) {
    const selling = updates.sellingPrice ?? product.sellingPrice;
    updates.variants = updates.variants.map((v) => {
      const color = (v.color || "").trim() || (updates.colors?.[0]?.name || product.colors?.[0]?.name || "Default");
      const size = (v.size || "").trim();
      const stock = Math.max(0, parseInt(v.stock, 10) || 0);
      const price = v.price !== undefined && v.price !== null && v.price !== "" ? Number(v.price) : Number(selling);
      const sku = (v.sku || "").trim() || `HOL-${(product.slug || "PROD").toUpperCase()}-${size}${color !== "Default" ? `-${color.replace(/\s+/g, "").toUpperCase()}` : ""}`;
      const barcode = (v.barcode || "").trim() || v.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`;
      return {
        ...v,
        size,
        color,
        stock,
        price,
        sku,
        barcode,
      };
    });

    const uniqueColorNames = Array.from(
      new Set(updates.variants.map((v) => v.color).filter((c) => c && c !== "Default"))
    );
    const existingColorMap = new Map(
      [...(product.colors || []), ...(updates.colors || [])].map((c) => [c.name?.toLowerCase(), c.hex])
    );
    if (uniqueColorNames.length > 0) {
      updates.colors = uniqueColorNames.map((name) => ({
        name,
        hex: existingColorMap.get(name.toLowerCase()) || getColorHex(name),
      }));
    }

    const uniqueSizes = Array.from(new Set(updates.variants.map((v) => v.size).filter(Boolean)));
    if (uniqueSizes.length > 0) {
      updates.sizes = uniqueSizes;
    }

    updates.stock = updates.variants.reduce((acc, curr) => acc + curr.stock, 0);
  }

  Object.assign(product, updates);
  await product.save();
  return harmonizeProductOutput(await product.populate("category", "name slug"));
}

/**
 * Delete / Archive product (Admin)
 */
export async function deleteProduct(id) {
  const product = await Product.findById(id);
  if (!product) {
    const err = new Error("Product not found.");
    err.statusCode = 404;
    err.code = "PRODUCT_NOT_FOUND";
    throw err;
  }

  // Soft delete by archiving to keep order histories intact
  product.status = "archived";
  await product.save();
  return { id, archived: true };
}

/**
 * Bulk update product prices
 */
export async function bulkUpdatePrices({ productIds = [], type = "percentage", value = 0, direction = "decrease" }) {
  if (!productIds.length || value <= 0) {
    const err = new Error("Invalid parameters for bulk price update");
    err.statusCode = 400;
    throw err;
  }

  const products = await Product.find({ _id: { $in: productIds } });
  const updated = [];

  for (const prod of products) {
    let newPrice = prod.sellingPrice;
    if (type === "percentage") {
      const delta = Math.round((prod.sellingPrice * value) / 100);
      newPrice = direction === "decrease" ? Math.max(1, prod.sellingPrice - delta) : prod.sellingPrice + delta;
    } else {
      newPrice = direction === "decrease" ? Math.max(1, prod.sellingPrice - value) : prod.sellingPrice + value;
    }

    prod.sellingPrice = newPrice;
    if (prod.compareAtPrice && prod.compareAtPrice > newPrice) {
      prod.discountPercent = Math.round(((prod.compareAtPrice - newPrice) / prod.compareAtPrice) * 100);
    } else {
      prod.discountPercent = 0;
    }

    if (prod.variants && prod.variants.length) {
      for (const v of prod.variants) {
        v.price = newPrice;
      }
    }

    await prod.save();
    updated.push({ id: prod._id, name: prod.name, newPrice: prod.sellingPrice });
  }

  return { updatedCount: updated.length, items: updated };
}

/**
 * Bulk update inventory stock
 */
export async function bulkUpdateStock(updates = []) {
  if (!Array.isArray(updates) || !updates.length) {
    const err = new Error("Updates array is required for bulk stock update");
    err.statusCode = 400;
    throw err;
  }

  const results = [];
  for (const item of updates) {
    const { productId, variantSku, stock } = item;
    if (!productId || typeof stock !== "number" || stock < 0) continue;

    const prod = await Product.findById(productId);
    if (!prod) continue;

    if (variantSku && prod.variants && prod.variants.length) {
      const v = prod.variants.find((varItem) => varItem.sku === variantSku);
      if (v) {
        v.stock = stock;
        prod.stock = prod.variants.reduce((acc, curr) => acc + (curr.stock || 0), 0);
      }
    } else {
      prod.stock = stock;
    }

    await prod.save();
    results.push({ id: prod._id, stock: prod.stock });
  }

  return { updatedCount: results.length, items: results };
}

/**
 * Export products to RFC 4180 compliant CSV format
 */
export async function exportProductsCSV() {
  const products = await Product.find().populate("category", "name slug").lean();

  const headers = [
    "Product ID",
    "Name",
    "Slug",
    "Category",
    "Fabric",
    "Selling Price (INR)",
    "Compare Price (INR)",
    "Discount %",
    "Total Stock",
    "Variants Count",
    "Status",
    "Created At",
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = [headers.map(escapeCSV).join(",")];

  for (const p of products) {
    const row = [
      p._id,
      p.name,
      p.slug,
      p.category?.name || p.categorySlug,
      p.fabric,
      p.sellingPrice,
      p.compareAtPrice,
      p.discountPercent,
      p.stock,
      p.variants?.length || 0,
      p.status,
      p.createdAt ? new Date(p.createdAt).toISOString() : "",
    ];
    rows.push(row.map(escapeCSV).join(","));
  }

  return rows.join("\r\n");
}
