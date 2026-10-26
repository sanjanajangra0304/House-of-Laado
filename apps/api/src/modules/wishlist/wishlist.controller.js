import * as wishlistService from "./wishlist.service.js";

export async function getWishlist(req, res, next) {
  try {
    const products = await wishlistService.getUserWishlist(req.user._id);
    res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleProduct(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: { code: "PRODUCT_ID_REQUIRED", message: "productId is required" },
      });
    }

    const result = await wishlistService.toggleProduct(req.user._id, productId);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function syncWishlist(req, res, next) {
  try {
    const { productIds = [] } = req.body;
    const products = await wishlistService.syncGuestWishlist(req.user._id, productIds);
    res.json({
      success: true,
      message: "Wishlist synced successfully",
      data: products,
    });
  } catch (err) {
    next(err);
  }
}
