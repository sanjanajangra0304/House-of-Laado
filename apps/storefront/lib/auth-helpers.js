"use client";

/**
 * Customer Authentication Helpers — House of Laado
 */

export function isCustomerLoggedIn() {
  if (typeof window === "undefined") return false;
  try {
    const token = localStorage.getItem("customer_token");
    const user = localStorage.getItem("customer_user");
    return Boolean(token && user);
  } catch (e) {
    return false;
  }
}

export function getCustomerSession() {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const token = localStorage.getItem("customer_token");
    const rawUser = localStorage.getItem("customer_user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    return { token, user };
  } catch (e) {
    return { token: null, user: null };
  }
}

export function saveCustomerSession(token, user) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem("customer_token", token);
    if (user) localStorage.setItem("customer_user", JSON.stringify(user));
    window.dispatchEvent(new Event("house_of_laado_auth_change"));
  } catch (e) {
    console.error("Failed to persist customer auth session", e);
  }
}

export function clearCustomerSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    window.dispatchEvent(new Event("house_of_laado_auth_change"));
  } catch (e) {
    console.error("Failed to clear customer auth session", e);
  }
}

/**
 * Smart Shop Now click handler:
 * - If user is logged in, proceeds straight to destination.
 * - If user is NOT logged in, prompts for login/signup and redirects back upon authentication.
 */
export function handleShopNowClick(router, destination = "/shop") {
  if (isCustomerLoggedIn()) {
    router.push(destination);
  } else {
    const encoded = encodeURIComponent(destination);
    router.push(`/account?mode=login&redirect=${encoded}`);
  }
}
