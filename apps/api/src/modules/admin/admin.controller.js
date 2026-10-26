import * as adminService from "./admin.service.js";

export async function getStats(req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}

// Coupons
export async function getCoupons(req, res, next) {
  try {
    const coupons = await adminService.getCoupons();
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
}

export async function createCoupon(req, res, next) {
  try {
    const coupon = await adminService.createCoupon(req.body);
    res.status(201).json({ success: true, message: "Coupon created", data: coupon });
  } catch (err) {
    next(err);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const coupon = await adminService.updateCoupon(req.params.id, req.body);
    res.json({ success: true, message: "Coupon updated", data: coupon });
  } catch (err) {
    next(err);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    const result = await adminService.deleteCoupon(req.params.id);
    res.json({ success: true, message: "Coupon deleted", data: result });
  } catch (err) {
    next(err);
  }
}

// Banners
export async function getBanners(req, res, next) {
  try {
    const banners = await adminService.getBanners();
    res.json({ success: true, data: banners });
  } catch (err) {
    next(err);
  }
}

export async function createBanner(req, res, next) {
  try {
    const banner = await adminService.createBanner(req.body);
    res.status(201).json({ success: true, message: "Banner created", data: banner });
  } catch (err) {
    next(err);
  }
}

export async function updateBanner(req, res, next) {
  try {
    const banner = await adminService.updateBanner(req.params.id, req.body);
    res.json({ success: true, message: "Banner updated", data: banner });
  } catch (err) {
    next(err);
  }
}

export async function deleteBanner(req, res, next) {
  try {
    const result = await adminService.deleteBanner(req.params.id);
    res.json({ success: true, message: "Banner deleted", data: result });
  } catch (err) {
    next(err);
  }
}

// Settings
export async function getSettings(req, res, next) {
  try {
    const settings = await adminService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSetting(req, res, next) {
  try {
    const setting = await adminService.updateSetting(req.params.key, req.body);
    res.json({ success: true, message: "Setting updated", data: setting });
  } catch (err) {
    next(err);
  }
}

// Users & Owner Protection
export async function getUsers(req, res, next) {
  try {
    const users = await adminService.getUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const result = await adminService.deleteUser(req.params.id, req.user);
    res.json({ success: true, message: "User deleted", data: result });
  } catch (err) {
    next(err);
  }
}

// Audit Logs
export async function getAuditLogs(req, res, next) {
  try {
    const logs = await adminService.getAuditLogs(req.query);
    res.json({ success: true, data: logs.items, pagination: logs.pagination });
  } catch (err) {
    next(err);
  }
}
