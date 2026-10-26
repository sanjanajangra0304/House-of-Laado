"use client";

import { useCart } from "@/lib/cart-context";
import { brand } from "@/config/brand";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isCustomerLoggedIn } from "@/lib/auth-helpers";
import { onProductImageError, DEFAULT_PRODUCT_FALLBACK } from "@/lib/image-fallback";

export function CartDrawer() {
  const router = useRouter();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalCount,
    appliedCoupon,
    discountAmount,
    removeCoupon,
  } = useCart();

  if (!isCartOpen) return null;

  const freeShippingThreshold = brand.freeShippingThreshold || 999;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-burgundy/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-w-md bg-ivory-light h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="p-5 border-b border-blush flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-rose" />
            <h2 className="font-serif font-semibold text-lg text-burgundy">
              Shopping Cart ({totalCount})
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1 rounded-full text-burgundy/70 hover:text-burgundy hover:bg-blush-light transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-blush-light p-4 border-b border-blush text-xs">
          {amountToFreeShipping > 0 ? (
            <p className="text-burgundy font-medium mb-1.5">
              Add <span className="text-rose font-bold">₹{amountToFreeShipping}</span> more to get <span className="text-rose font-bold">Free Express Delivery</span>!
            </p>
          ) : (
            <p className="text-olive font-semibold mb-1.5">
              🎉 Congratulations! You unlocked Free Express Delivery!
            </p>
          )}
          <div className="w-full bg-blush rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-16 h-16 text-blush mb-4 stroke-[1.2]" />
              <h3 className="font-serif text-lg font-semibold text-burgundy mb-1">
                Your cart is empty
              </h3>
              <p className="text-sm text-burgundy/70 max-w-xs mb-6">
                Discover our bestselling suit sets, handcrafted kurtas, and festive arrivals.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="btn-primary text-xs"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                className="flex space-x-3.5 pb-4 border-b border-blush/60 last:border-0"
              >
                {/* Product Thumbnail */}
                <img
                  src={item.image || DEFAULT_PRODUCT_FALLBACK}
                  alt={item.name}
                  onError={onProductImageError}
                  className="w-20 h-24 object-cover rounded-lg border border-blush flex-shrink-0"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-sm font-semibold text-burgundy line-clamp-1 hover:text-rose transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-burgundy/70 mt-0.5">
                    Size: <span className="font-medium text-burgundy">{item.selectedSize}</span> | Color: <span className="font-medium text-burgundy">{item.selectedColor}</span>
                  </p>

                  <div className="flex items-center space-x-2 mt-1.5">
                    <span className="font-bold text-burgundy text-sm">
                      ₹{item.price}
                    </span>
                    {item.comparePrice && item.comparePrice > item.price && (
                      <span className="text-xs text-burgundy/50 line-through">
                        ₹{item.comparePrice}
                      </span>
                    )}
                  </div>

                  {/* Quantity & Remove controls */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-blush rounded-pill px-2 py-0.5 space-x-2 bg-ivory-light">
                      <button
                        onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                        className="text-burgundy/80 hover:text-burgundy p-0.5 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold text-burgundy px-1">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                        className="text-burgundy/80 hover:text-burgundy p-0.5 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                      className="text-burgundy/50 hover:text-rose p-1 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Checkout CTA */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-blush bg-ivory-light space-y-3">
            <div className="space-y-1.5 pb-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-burgundy/80">Subtotal</span>
                <span className="font-bold text-burgundy text-lg">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-olive font-semibold">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-burgundy/70">
              Taxes calculated at checkout. Free shipping available on qualifying orders.
            </p>

            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false);
                if (!isCustomerLoggedIn()) {
                  router.push(`/account?mode=login&redirect=${encodeURIComponent("/checkout")}`);
                } else {
                  router.push("/checkout");
                }
              }}
              className="btn-primary w-full py-3.5 flex items-center justify-center space-x-2 text-sm shadow cursor-pointer transition-transform hover:scale-[1.01]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-full text-center text-xs text-burgundy/80 hover:text-rose transition-colors py-1"
            >
              Or Continue Browsing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
