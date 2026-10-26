import { Product } from "../../models/Product.js";
import { Order } from "../../models/Order.js";
import { Coupon } from "../../models/Coupon.js";
import { Banner } from "../../models/Banner.js";
import { Setting } from "../../models/Setting.js";
import { User } from "../../models/User.js";
import { AuditLog } from "../../models/AuditLog.js";

/**
 * High-level Dashboard Metrics
 */
export async function getDashboardStats() {
  const [
    totalProducts,
    activeProducts,
    lowStockProducts,
    lowStockList,
    totalOrders,
    awaitingFulfillment,
    revenueResult,
    ordersByStatusResult,
    recentOrders,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: "active" }),
    Product.countDocuments({ stock: { $lte: 10 }, status: "active" }),
    Product.find({ stock: { $lte: 10 }, status: "active" })
      .select("name slug primaryImage sellingPrice stock category")
      .limit(5)
      .lean(),
    Order.countDocuments(),
    Order.countDocuments({
      orderStatus: { $in: ["placed", "confirmed", "packed"] },
      paymentStatus: { $nin: ["failed", "refunded"] },
    }),
    Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: "paid", orderStatus: { $ne: "cancelled" } },
            {
              paymentMethod: "cod",
              orderStatus: { $in: ["confirmed", "packed", "dispatched", "delivered"] },
            },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: "$pricing.grandTotal" } } },
    ]),
    Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;
  const ordersByStatus = {};
  for (const item of ordersByStatusResult) {
    ordersByStatus[item._id] = item.count;
  }

  return {
    metrics: {
      totalRevenue,
      totalOrders,
      totalProducts,
      activeProducts,
      lowStockProducts,
      awaitingFulfillment,
      ordersByStatus,
    },
    lowStockList,
    recentOrders,
  };
}

// -----------------------------------------------------------------------------
// Coupon Management
// -----------------------------------------------------------------------------
export async function getCoupons() {
  return Coupon.find().sort({ createdAt: -1 }).lean();
}

export async function createCoupon(data) {
  const cleanCode = data.code.trim().toUpperCase();
  const existing = await Coupon.findOne({ code: cleanCode });
  if (existing) {
    const err = new Error(`Coupon with code '${cleanCode}' already exists`);
    err.statusCode = 400;
    err.code = "COUPON_EXISTS";
    throw err;
  }

  const coupon = new Coupon({
    ...data,
    code: cleanCode,
  });
  await coupon.save();
  return coupon;
}

export async function updateCoupon(id, updates) {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    const err = new Error("Coupon not found");
    err.statusCode = 404;
    err.code = "COUPON_NOT_FOUND";
    throw err;
  }

  if (updates.code) {
    updates.code = updates.code.trim().toUpperCase();
  }

  Object.assign(coupon, updates);
  await coupon.save();
  return coupon;
}

export async function deleteCoupon(id) {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) {
    const err = new Error("Coupon not found");
    err.statusCode = 404;
    err.code = "COUPON_NOT_FOUND";
    throw err;
  }
  return { id, deleted: true };
}

// -----------------------------------------------------------------------------
// Banner Management
// -----------------------------------------------------------------------------
export async function getBanners() {
  return Banner.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
}

export async function createBanner(data) {
  const banner = new Banner(data);
  await banner.save();
  return banner;
}

export async function updateBanner(id, updates) {
  const banner = await Banner.findById(id);
  if (!banner) {
    const err = new Error("Banner not found");
    err.statusCode = 404;
    err.code = "BANNER_NOT_FOUND";
    throw err;
  }

  Object.assign(banner, updates);
  await banner.save();
  return banner;
}

export async function deleteBanner(id) {
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) {
    const err = new Error("Banner not found");
    err.statusCode = 404;
    err.code = "BANNER_NOT_FOUND";
    throw err;
  }
  return { id, deleted: true };
}

// -----------------------------------------------------------------------------
// Store Settings Management
// -----------------------------------------------------------------------------
export async function getSettings() {
  return Setting.find().lean();
}

export async function updateSetting(key, { value, description }) {
  const setting = await Setting.findOneAndUpdate(
    { key },
    { value, ...(description ? { description } : {}) },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return setting;
}

// -----------------------------------------------------------------------------
// User Management & Owner Protection Rule
// -----------------------------------------------------------------------------
export async function getUsers() {
  return User.find().select("-password").sort({ createdAt: -1 }).lean();
}

/**
 * Delete a user account with strict Owner Protection Rule
 * @param {string} targetUserId - ID of user being deleted
 * @param {Object} actor - The user initiating the deletion
 */
export async function deleteUser(targetUserId, actor) {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    const err = new Error("Target user not found");
    err.statusCode = 404;
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  // Security Rule: Admin CANNOT delete an Owner under any circumstances!
  if (targetUser.role === "owner" && actor.role !== "owner") {
    const err = new Error("Security Violation: Administrators are not permitted to delete store owners.");
    err.statusCode = 403;
    err.code = "OWNER_PROTECTION_VIOLATION";
    throw err;
  }

  // An owner cannot delete themselves if they are the sole owner
  if (targetUser.role === "owner" && actor._id.toString() === targetUserId) {
    const ownerCount = await User.countDocuments({ role: "owner" });
    if (ownerCount <= 1) {
      const err = new Error("Cannot delete the primary store owner account.");
      err.statusCode = 400;
      err.code = "PRIMARY_OWNER_REQUIRED";
      throw err;
    }
  }

  await User.findByIdAndDelete(targetUserId);
  return { id: targetUserId, deleted: true };
}

// -----------------------------------------------------------------------------
// Audit Logs
// -----------------------------------------------------------------------------
export async function getAuditLogs(query = {}) {
  const { page = 1, limit = 50, action, resourceType } = query;
  const filter = {};
  if (action) filter.action = action;
  if (resourceType) filter.resourceType = resourceType;

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    items: logs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1,
    },
  };
}
