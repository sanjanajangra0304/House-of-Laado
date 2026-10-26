"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { brand } from "@/config/brand";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag, Sparkles, Gift } from "lucide-react";
import { isCustomerLoggedIn } from "@/lib/auth-helpers";
import { AvailableOffersModal } from "@/components/checkout/AvailableOffersModal";
import { onProductImageError, DEFAULT_PRODUCT_FALLBACK } from "@/lib/image-fallback";

export default function CartPage() {
  const router = useRouter();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalCount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponError,
    isApplyingCoupon,
    discountAmount,
    shippingFee,
    grandTotal,
    prepaidDiscount,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const res = await applyCoupon(couponCode.trim());
    if (res.success) {
      setCouponCode("");
    }
  };

  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[{ label: "Shopping Bag" }]} />

        <div className="my-6 pb-4 border-b border-blush">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy">
            Your Shopping Bag ({totalCount})
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-blush-light border border-blush rounded-2xl p-12 sm:p-16 text-center my-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-ivory-light border border-blush flex items-center justify-center mx-auto mb-4 text-rose shadow-sm">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-burgundy mb-2">
              Your bag is currently empty
            </h3>
            <p className="text-xs sm:text-sm text-burgundy/85 mb-6 leading-relaxed">
              Explore our handcrafted pure cotton suits, Sanganeri kurtas, and artisanal bags.
            </p>
            <Link href="/shop" className="btn-primary text-xs">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT: Items List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free shipping banner */}
              <div className="bg-blush-light p-4 rounded-xl border border-blush text-xs">
                {subtotal >= freeShippingThreshold ? (
                  <p className="text-olive font-semibold">
                    🎉 You have unlocked Free Express Shipping!
                  </p>
                ) : (
                  <p className="text-burgundy font-medium">
                    Add <span className="text-rose font-bold">₹{freeShippingThreshold - subtotal}</span> more to unlock <span className="text-rose font-bold">Free Express Delivery</span>!
                  </p>
                )}
              </div>

              {/* Items Card List */}
              <div className="divide-y divide-blush border border-blush rounded-2xl overflow-hidden bg-ivory-light shadow-sm">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="p-4 sm:p-6 flex space-x-4 items-start sm:items-center">
                    <img
                      src={item.image || DEFAULT_PRODUCT_FALLBACK}
                      alt={item.name}
                      onError={onProductImageError}
                      className="w-20 h-26 sm:w-24 sm:h-32 object-cover rounded-xl border border-blush flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.slug}`} className="font-serif text-sm sm:text-base font-semibold text-burgundy hover:text-rose transition-colors line-clamp-1 block">
                        {item.name}
                      </Link>

                      <p className="text-xs text-burgundy/70 mt-1">
                        Size: <span className="font-semibold text-burgundy">{item.selectedSize}</span> | Color: <span className="font-semibold text-burgundy">{item.selectedColor}</span>
                      </p>

                      <div className="flex items-baseline space-x-2 mt-2">
                        <span className="font-bold text-burgundy text-sm sm:text-base">
                          ₹{item.price}
                        </span>
                        {item.comparePrice && item.comparePrice > item.price && (
                          <span className="text-xs text-burgundy/50 line-through">
                            ₹{item.comparePrice}
                          </span>
                        )}
                      </div>

                      {/* Mobile controls row */}
                      <div className="flex sm:hidden items-center justify-between mt-3">
                        <div className="flex items-center border border-blush rounded-pill px-2 py-0.5 space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                            className="p-1 text-burgundy/80 hover:text-burgundy"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-burgundy px-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                            className="p-1 text-burgundy/80 hover:text-burgundy"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                          className="text-burgundy/50 hover:text-rose p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Desktop quantity controls */}
                    <div className="hidden sm:flex items-center border border-blush rounded-pill px-3 py-1 space-x-3 bg-ivory-light">
                      <button
                        onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                        className="text-burgundy/80 hover:text-burgundy p-1"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-burgundy px-1">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                        className="text-burgundy/80 hover:text-burgundy p-1"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Desktop item total */}
                    <div className="hidden sm:block text-right min-w-[80px]">
                      <span className="font-bold text-burgundy text-base">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>

                    {/* Desktop remove button */}
                    <div className="hidden sm:block pl-2">
                      <button
                        onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                        className="p-2 text-burgundy/50 hover:text-rose transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Order Summary (4 cols) */}
            <div className="lg:col-span-4 bg-blush-light border border-blush rounded-2xl p-6 shadow-sm space-y-6 sticky top-28">
              <h3 className="font-serif font-bold text-lg text-burgundy pb-3 border-b border-blush">
                Order Summary
              </h3>

              {/* Promo Coupon Form */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-serif font-bold text-burgundy flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-rose" />
                    <span>Have a Promo Code?</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsOffersModalOpen(true)}
                    className="text-xs font-bold text-rose hover:text-burgundy underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>View All Offers (4)</span>
                  </button>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-olive/10 border border-olive/30 text-xs text-olive font-semibold">
                    <span>
                      🎉 Coupon &lsquo;{appliedCoupon.code}&rsquo; applied (-₹{discountAmount})
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-rose hover:underline font-bold ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. WELCOME10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="h-10 px-3.5 rounded-pill border border-blush text-xs uppercase flex-1 focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose bg-ivory-light text-burgundy font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="h-10 px-4 rounded-pill bg-burgundy text-ivory-light text-xs font-serif font-semibold hover:bg-rose transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isApplyingCoupon ? "..." : "Apply"}
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => setIsOffersModalOpen(true)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blush/30 to-blush-light border border-blush hover:border-rose/50 transition-all flex items-center justify-between text-xs text-burgundy cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5 text-rose group-hover:scale-110 transition-transform" />
                        <span className="font-semibold">Explore 4 Active Coupons</span>
                      </div>
                      <span className="text-[11px] text-rose font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>Apply</span>
                        <span>&rarr;</span>
                      </span>
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-xs mt-2 font-medium text-rose">
                    {couponError}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs pb-4 border-b border-blush">
                <div className="flex justify-between text-burgundy/80">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-burgundy">₹{subtotal}</span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-olive font-medium">
                    <span>Promo Discount ({appliedCoupon.code})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-burgundy/80">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-burgundy">
                    {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center text-burgundy">
                <span className="font-serif font-bold text-base">Grand Total</span>
                <span className="font-serif font-bold text-xl text-rose">
                  ₹{grandTotal}
                </span>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={() => {
                  if (!isCustomerLoggedIn()) {
                    router.push(`/account?mode=login&redirect=${encodeURIComponent("/checkout")}`);
                  } else {
                    router.push("/checkout");
                  }
                }}
                className="btn-primary w-full py-4 text-sm flex items-center justify-center space-x-2 shadow-lg cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust Guarantee */}
              <div className="flex items-center space-x-2 text-[11px] text-burgundy/70 pt-2">
                <ShieldCheck className="w-4 h-4 text-olive flex-shrink-0" />
                <span>Encrypted checkout with 100% money-back guarantee.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Available Offers & Discounts Modal */}
      <AvailableOffersModal
        isOpen={isOffersModalOpen}
        onClose={() => setIsOffersModalOpen(false)}
        currentSubtotal={subtotal}
      />
    </div>
  );
}
