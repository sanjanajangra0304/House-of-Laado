"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { toggleWishlistApi, syncWishlistApi, validateCouponApi } from "./api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Load cart and wishlist from localStorage on mount & sync with server if logged in
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("laado_cart") || localStorage.getItem("vastra_cart");
      if (savedCart) setCartItems(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem("laado_wishlist") || localStorage.getItem("vastra_wishlist");
      let initialWishlist = [];
      if (savedWishlist) {
        initialWishlist = JSON.parse(savedWishlist);
        setWishlist(initialWishlist);
      }

      const savedCoupon = localStorage.getItem("laado_coupon") || localStorage.getItem("vastra_coupon");
      if (savedCoupon) setAppliedCoupon(JSON.parse(savedCoupon));

      // If user is authenticated, sync wishlist to server
      const token = localStorage.getItem("customer_token");
      if (token && initialWishlist.length > 0) {
        const productIds = initialWishlist.map((item) => item.id || item._id).filter(Boolean);
        syncWishlistApi(productIds).catch(() => {});
      }
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  // Save cart changes
  const saveCart = (items) => {
    setCartItems(items);
    try {
      localStorage.setItem("laado_cart", JSON.stringify(items));
    } catch {}
  };

  const addToCart = (product, size = "M", color = null, quantity = 1) => {
    const resolvedColor = color || product.colors?.[0]?.name || "Default";
    // Find matching variant if available
    const matchingVariant = product.variants?.find(
      (v) =>
        v.size === size &&
        (!resolvedColor || resolvedColor === "Default" || !v.color || v.color.toLowerCase() === resolvedColor.toLowerCase())
    );

    const maxStock = matchingVariant?.stock !== undefined ? matchingVariant.stock : (product.stock ?? 999);
    const itemSku = matchingVariant?.sku || product.sku || "";

    const existingIndex = cartItems.findIndex(
      (item) => item.id === product.id && item.selectedSize === size && item.selectedColor === resolvedColor
    );

    let updated;
    if (existingIndex > -1) {
      const currentQty = cartItems[existingIndex].quantity;
      const targetQty = currentQty + quantity;
      const finalQty = maxStock !== undefined ? Math.min(targetQty, maxStock) : targetQty;
      updated = [...cartItems];
      updated[existingIndex].quantity = finalQty;
    } else {
      const initialQty = maxStock !== undefined ? Math.min(quantity, Math.max(1, maxStock)) : quantity;
      updated = [
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: itemSku,
          price: matchingVariant?.price || product.sellingPrice,
          comparePrice: product.compareAtPrice,
          image: matchingVariant?.image || product.primaryImage,
          selectedSize: size,
          selectedColor: resolvedColor,
          quantity: initialQty,
          maxStock,
        }
      ];
    }
    saveCart(updated);
    setIsCartOpen(true);
  };

  const removeFromCart = (id, size, color = null) => {
    const updated = cartItems.filter(
      (item) =>
        !(
          item.id === id &&
          item.selectedSize === size &&
          (!color || item.selectedColor === color)
        )
    );
    saveCart(updated);
  };

  const updateQuantity = (id, size, colorOrQty, possibleQty = null) => {
    let color = null;
    let newQty = 0;
    if (possibleQty !== null) {
      color = colorOrQty;
      newQty = possibleQty;
    } else {
      newQty = colorOrQty;
    }

    if (newQty <= 0) {
      removeFromCart(id, size, color);
      return;
    }
    const updated = cartItems.map((item) => {
      const matches =
        item.id === id &&
        item.selectedSize === size &&
        (!color || item.selectedColor === color);
      if (matches) {
        const cappedQty = item.maxStock !== undefined ? Math.min(newQty, item.maxStock) : newQty;
        return { ...item, quantity: cappedQty };
      }
      return item;
    });
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const toggleWishlist = (product) => {
    let updated;
    const exists = wishlist.some((item) => item.id === product.id);
    if (exists) {
      updated = wishlist.filter((item) => item.id !== product.id);
    } else {
      updated = [...wishlist, product];
    }
    setWishlist(updated);
    try {
      localStorage.setItem("laado_wishlist", JSON.stringify(updated));
    } catch {}

    const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
    if (token) {
      toggleWishlistApi(product.id || product._id).catch(() => {});
    }
  };

  const isWishlisted = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const applyCoupon = async (code, customSubtotal = null) => {
    setCouponError("");
    setIsApplyingCoupon(true);
    try {
      const targetSubtotal = customSubtotal !== null ? customSubtotal : subtotal;
      const data = await validateCouponApi(code, targetSubtotal);
      if (data.success && data.data) {
        setAppliedCoupon(data.data);
        try {
          localStorage.setItem("laado_coupon", JSON.stringify(data.data));
        } catch {}
        return { success: true, data: data.data };
      } else {
        const msg = data.message || "Invalid coupon code.";
        setCouponError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = err?.message || "Could not validate coupon at this time.";
      setCouponError(msg);
      return { success: false, message: msg };
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    try {
      localStorage.removeItem("laado_coupon");
      localStorage.removeItem("vastra_coupon");
    } catch {}
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  // Dynamically recalculate percentage discounts when subtotal changes
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.minOrderValue && subtotal < appliedCoupon.minOrderValue) {
      return 0; // Below eligibility threshold
    }
    if (appliedCoupon.discountType === "percentage") {
      let disc = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscountAmount) {
        disc = Math.min(disc, appliedCoupon.maxDiscountAmount);
      }
      return disc;
    }
    return Math.min(appliedCoupon.discountValue || 0, subtotal);
  }, [appliedCoupon, subtotal]);

  const shippingFee = subtotal >= 1000 ? 0 : subtotal > 0 ? 99 : 0;
  const prepaidDiscount = subtotal >= 1000 && !appliedCoupon ? Math.round(subtotal * 0.05) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        wishlist,
        toggleWishlist,
        isWishlisted,
        subtotal,
        totalCount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        couponError,
        isApplyingCoupon,
        discountAmount,
        shippingFee,
        prepaidDiscount,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
