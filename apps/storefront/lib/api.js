export function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname && window.location.hostname !== "localhost") {
    return `${window.location.protocol}//${window.location.hostname}:5000/api/v1`;
  }
  return "http://localhost:5000/api/v1";
}

/**
 * Detect whether an API request is intended for administrative operations
 */
export function isAdministrativeRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  // 0. Public auth & guest customer endpoints never require admin authorization
  if (
    path === "/auth/login" ||
    path === "/auth/register" ||
    path === "/auth/logout" ||
    path.startsWith("/auth/forgot-password") ||
    path.startsWith("/auth/send-otp") ||
    path.startsWith("/auth/verify-otp") ||
    path.startsWith("/auth/addresses") ||
    path === "/auth/profile"
  ) {
    return false;
  }

  // 1. If currently inside any /admin route in browser, it is an administrative operation
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    return true;
  }

  // 2. Explicit admin API endpoints
  if (
    path.startsWith("/admin") ||
    path.startsWith("/settings") ||
    path.includes("/audit-logs") ||
    path.includes("/stats")
  ) {
    return true;
  }

  // 3. Product catalog management (archive/delete, create, update, price bulk update, stock bulk update, CSV export)
  if (path.startsWith("/products")) {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) return true;
    if (path.startsWith("/products/export-csv") || path.startsWith("/products/bulk-")) return true;
  }

  // 4. Order management & bulk operations (excluding public customer endpoints)
  if (
    path.startsWith("/orders") &&
    !path.startsWith("/orders/my") &&
    !path.startsWith("/orders/checkout") &&
    !path.startsWith("/orders/track") &&
    !path.startsWith("/orders/serviceability") &&
    !path.startsWith("/orders/verify-payment") &&
    !path.startsWith("/orders/validate-coupon") &&
    !path.startsWith("/orders/coupons")
  ) {
    return true;
  }
  if (path.includes("/returns/requests") || path.includes("/orders/bulk-delete")) {
    return true;
  }

  // 5. Category management
  if (path.startsWith("/categories") && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return true;
  }

  // 6. Promotions & banners mutations
  if (path.startsWith("/coupons") && ["POST", "PUT", "DELETE"].includes(method)) {
    return true;
  }
  if (path.startsWith("/banners") && ["POST", "PUT", "DELETE"].includes(method)) {
    return true;
  }

  // 7. Review moderation
  if (path.startsWith("/reviews") && ["PUT", "DELETE"].includes(method)) {
    return true;
  }

  return false;
}

/**
 * Universal API Fetch Client
 */
export async function apiFetch(path, options = {}) {
  const url = `${getApiBaseUrl()}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const isAdmin = isAdministrativeRequest(path, options);

  // Attach token if present in localStorage (client side)
  if (typeof window !== "undefined" && !headers["Authorization"]) {
    let token = null;

    if (isAdmin) {
      // Prioritize admin_token for all administrative requests and admin pages
      token = localStorage.getItem("admin_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        // Explicitly set placeholder so backend auth never falls back to customer HttpOnly cookie
        headers["Authorization"] = "Bearer no_admin_token";
      }
    } else {
      // Customer storefront requests: use customer_token
      token = localStorage.getItem("customer_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      // If unauthorized on an administrative route, clean up expired state and prompt re-login
      if (
        (response.status === 401 || data?.error?.code === "INVALID_TOKEN") &&
        isAdmin &&
        typeof window !== "undefined"
      ) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        if (!window.location.pathname.startsWith("/admin/login")) {
          window.location.href = "/admin/login?expired=1";
        }
      }
      const error = new Error(data?.error?.message || "An error occurred with the request.");
      error.code = data?.error?.code;
      error.details = data?.error?.details;
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Auth APIs
 */
export async function loginAdmin(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginCustomerApi(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerCustomerApi({ name, email, password, phone }) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, phone }),
  });
}

export async function sendForgotPasswordOtpApi(identifier) {
  return apiFetch("/auth/forgot-password/send-otp", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

export async function verifyForgotPasswordOtpApi({ identifier, otp, newPassword }) {
  return apiFetch("/auth/forgot-password/verify-otp", {
    method: "POST",
    body: JSON.stringify({ identifier, otp, newPassword }),
  });
}

export async function logoutAdmin() {
  return apiFetch("/auth/logout", {
    method: "POST",
  });
}

export async function getAdminMe() {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return apiFetch("/auth/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}


/**
 * Products APIs
 */
export async function fetchProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/products${query ? `?${query}` : ""}`);
}

export async function createProductApi(payload) {
  return apiFetch("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProductApi(id, payload) {
  return apiFetch(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteProductApi(id) {
  return apiFetch(`/products/${id}`, {
    method: "DELETE",
  });
}

export async function fetchProductByIdApi(id) {
  return apiFetch(`/products/id/${encodeURIComponent(id)}`);
}

export async function fetchProductBySlugApi(slug) {
  return apiFetch(`/products/${encodeURIComponent(slug)}`);
}

/**
 * Orders APIs
 */
export async function fetchOrdersApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/orders${query ? `?${query}` : ""}`);
}

export async function updateOrderStatusApi(id, payload) {
  return apiFetch(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createOrderApi(payload) {
  return apiFetch("/orders/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyPaymentApi(payload) {
  return apiFetch("/orders/verify-payment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function trackOrderApi(orderNumber) {
  return apiFetch(`/orders/track/${encodeURIComponent(orderNumber)}`);
}

export async function checkServiceabilityApi(pincode, isCod = false) {
  return apiFetch(`/orders/serviceability/${encodeURIComponent(pincode)}?isCod=${isCod}`);
}

/**
 * Customer Orders & Returns
 */
export async function fetchCustomerOrdersApi() {
  return apiFetch("/orders/my/orders");
}

export async function fetchCustomerReturnsApi() {
  return apiFetch("/orders/my/returns");
}

export async function cancelOrderApi(orderId, payload = {}, token = null) {
  const options = {
    method: "POST",
    body: JSON.stringify(payload),
  };
  if (token) {
    options.headers = { Authorization: `Bearer ${token}` };
  }
  return apiFetch(`/orders/${orderId}/cancel`, options);
}

export async function requestReturnApi(orderId, payload, token = null) {
  const options = {
    method: "POST",
    body: JSON.stringify(payload),
  };
  if (token) {
    options.headers = { Authorization: `Bearer ${token}` };
  }
  return apiFetch(`/orders/${orderId}/return`, options);
}

export async function fetchReturnRequestByIdApi(id) {
  return apiFetch(`/orders/returns/${id}`);
}

/**
 * Admin Returns & Refunds
 */
export async function fetchReturnRequestsApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/orders/returns/requests${query ? `?${query}` : ""}`);
}

export async function updateReturnRequestApi(id, payload) {
  return apiFetch(`/orders/returns/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function processReturnRefundApi(id, payload = {}) {
  return apiFetch(`/orders/returns/requests/${id}/refund`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteOrderApi(orderId) {
  return apiFetch(`/orders/${orderId}`, {
    method: "DELETE",
  });
}

export async function bulkDeleteOrdersApi(orderIds) {
  return apiFetch("/orders/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ orderIds }),
  });
}

export async function fetchActiveCouponsApi() {
  return apiFetch("/orders/coupons");
}

export async function validateCouponApi(code, subtotal = 0) {
  return apiFetch("/orders/validate-coupon", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });
}

/**
 * Admin Stats API
 */
export async function fetchAdminStatsApi() {
  return apiFetch("/admin/stats");
}

/**
 * Image Upload API (Cloudinary via Multer)
 */
export async function uploadImageApi(file, folder = "house_of_laado/products") {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);

  const headers = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${getApiBaseUrl()}/uploads/image`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Upload failed");
  }
  return data;
}

/**
 * Multiple Images Upload API
 */
export async function uploadMultipleImagesApi(files, folder = "house_of_laado/products") {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("images", file);
  });
  formData.append("folder", folder);

  const headers = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${getApiBaseUrl()}/uploads/multiple`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Upload failed");
  }
  return data;
}

/**
 * Bulk Product Actions
 */
export async function bulkUpdatePricesApi(payload) {
  return apiFetch("/products/bulk-price", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function bulkUpdateStockApi(updates) {
  return apiFetch("/products/bulk-stock", {
    method: "PATCH",
    body: JSON.stringify({ updates }),
  });
}

export async function exportProductsCsvApi() {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const res = await fetch(`${getApiBaseUrl()}/products/export-csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error("CSV Export failed");
  return res.text();
}

/**
 * Coupons API
 */
export async function fetchCouponsApi() {
  return apiFetch("/admin/coupons");
}

export async function createCouponApi(payload) {
  return apiFetch("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteCouponApi(id) {
  return apiFetch(`/admin/coupons/${id}`, {
    method: "DELETE",
  });
}

/**
 * Banners API
 */
export async function fetchBannersApi() {
  return apiFetch("/admin/banners");
}

export async function createBannerApi(payload) {
  return apiFetch("/admin/banners", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteBannerApi(id) {
  return apiFetch(`/admin/banners/${id}`, {
    method: "DELETE",
  });
}

/**
 * Settings & Audit API
 */
export async function fetchSettingsApi() {
  return apiFetch("/admin/settings");
}

export async function updateSettingApi(key, payload) {
  return apiFetch(`/admin/settings/${key}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchAuditLogsApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/audit-logs${query ? `?${query}` : ""}`);
}

/**
 * Reviews API
 */
export async function fetchProductReviewsApi(productId, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/reviews/product/${encodeURIComponent(productId)}${query ? `?${query}` : ""}`);
}

export async function submitReviewApi(payload) {
  return apiFetch("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function checkReviewEligibilityApi(productId) {
  return apiFetch(`/reviews/eligible/${encodeURIComponent(productId)}`);
}

export async function updateReviewApi(reviewId, payload) {
  return apiFetch(`/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteReviewApi(reviewId) {
  return apiFetch(`/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
  });
}

/**
 * Wishlist API
 */
export async function fetchWishlistApi() {
  return apiFetch("/wishlist");
}

export async function toggleWishlistApi(productId) {
  return apiFetch("/wishlist/toggle", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function syncWishlistApi(productIds = []) {
  return apiFetch("/wishlist/sync", {
    method: "POST",
    body: JSON.stringify({ productIds }),
  });
}

/**
 * Customer Account & Address APIs
 */
export async function updateCustomerProfileApi(payload) {
  return apiFetch("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchSavedAddressesApi() {
  return apiFetch("/auth/addresses");
}

export async function addSavedAddressApi(payload) {
  return apiFetch("/auth/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSavedAddressApi(id, payload) {
  return apiFetch(`/auth/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSavedAddressApi(id) {
  return apiFetch(`/auth/addresses/${id}`, {
    method: "DELETE",
  });
}

export async function setDefaultAddressApi(id) {
  return apiFetch(`/auth/addresses/${id}/default`, {
    method: "PATCH",
  });
}

/**
 * Content, Blog & Policy APIs
 */
export async function fetchBlogPostsApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/content/blog${query ? `?${query}` : ""}`);
}

export async function fetchBlogPostBySlugApi(slug) {
  return apiFetch(`/content/blog/${encodeURIComponent(slug)}`);
}

export async function fetchPageBySlugApi(slug) {
  return apiFetch(`/content/pages/${encodeURIComponent(slug)}`);
}

export async function submitContactMessageApi(payload) {
  return apiFetch("/content/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function subscribeNewsletterApi(email, source = "footer") {
  return apiFetch("/content/newsletter", {
    method: "POST",
    body: JSON.stringify({ email, source }),
  });
}
