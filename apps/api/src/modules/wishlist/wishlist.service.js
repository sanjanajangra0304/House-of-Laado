import mongoose from "mongoose";
import { Wishlist } from "../../models/Wishlist.js";
import { Product } from "../../models/Product.js";

/**
 * Get current user's wishlist populated with product cards
 */
export async function getUserWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: "products",
    match: { $or: [{ status: "active" }, { isActive: true }] },
    select: "name slug primaryImage secondaryImage sellingPrice compareAtPrice discountPercent isNew stock sizes",
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }

  return wishlist.products || [];
}

/**
 * Toggle product in user's wishlist (adds if absent, removes if present)
 */
export async function toggleProduct(userId, productId) {
  let prodId = null;
  if (mongoose.Types.ObjectId.isValid(productId)) {
    prodId = new mongoose.Types.ObjectId(productId);
  } else {
    const prod = await Product.findOne({ slug: productId });
    if (prod) prodId = prod._id;
  }

  if (!prodId) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, products: [] });
  }

  const strId = prodId.toString();
  const existsIndex = wishlist.products.findIndex((p) => p.toString() === strId);

  let isWishlisted = false;
  if (existsIndex > -1) {
    wishlist.products.splice(existsIndex, 1);
    isWishlisted = false;
  } else {
    wishlist.products.push(prodId);
    isWishlisted = true;
  }

  await wishlist.save();

  return {
    isWishlisted,
    totalItems: wishlist.products.length,
    productId: strId,
  };
}

/**
 * Sync guest wishlist from client localStorage to server database
 */
export async function syncGuestWishlist(userId, productIds = []) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, products: [] });
  }

  const currentSet = new Set(wishlist.products.map((p) => p.toString()));

  for (const id of productIds) {
    if (mongoose.Types.ObjectId.isValid(id) && !currentSet.has(id.toString())) {
      wishlist.products.push(new mongoose.Types.ObjectId(id));
      currentSet.add(id.toString());
    }
  }

  await wishlist.save();
  return getUserWishlist(userId);
}
