"use client";

import { useState, useEffect } from "react";
import {
  Tag,
  X,
  Check,
  Copy,
  Sparkles,
  CreditCard,
  Truck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Percent,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { fetchActiveCouponsApi } from "@/lib/api";

export function AvailableOffersModal({ isOpen, onClose, currentSubtotal = null }) {
  const {
    subtotal: cartSubtotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    isApplyingCoupon,
  } = useCart();

  const effectiveSubtotal = currentSubtotal !== null ? currentSubtotal : cartSubtotal;

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [copiedCode, setCopiedCode] = useState("");

  // Fetch active coupons on modal open
  useEffect(() => {
    if (isOpen) {
      setStatusMessage({ type: "", text: "" });
      setLoading(true);
      fetchActiveCouponsApi()
        .then((res) => {
          if (res?.success && Array.isArray(res.data)) {
            setCoupons(res.data);
          }
        })
        .catch(() => {
          // Fallback default coupons if network issue
          setCoupons([
            {
              code: "WELCOME10",
              title: "10% Welcome Discount",
              description: "Enjoy 10% off on your first handcrafted order from our Jaipur atelier.",
              badge: "FIRST ORDER",
              discountType: "percentage",
              discountValue: 10,
              minOrderValue: 999,
              maxDiscountAmount: 500,
            },
            {
              code: "FESTIVE20",
              title: "Royal Festive 20% Off",
              description: "Flat 20% savings on royal Chanderi, Anarkali & festive silk kurta sets.",
              badge: "FESTIVE EDIT",
              discountType: "percentage",
              discountValue: 20,
              minOrderValue: 1999,
              maxDiscountAmount: 1000,
            },
            {
              code: "JAIPUR15",
              title: "Jaipur Artisan 15% Off",
              description: "Special 15% off celebrating authentic Sanganeri hand-block prints.",
              badge: "ARTISAN CRAFT",
              discountType: "percentage",
              discountValue: 15,
              minOrderValue: 1499,
              maxDiscountAmount: 600,
            },
            {
              code: "FREESHIP",
              title: "Free Express Shipping",
              description: "Complimentary premium courier delivery straight to your doorstep across India.",
              badge: "FREE DELIVERY",
              discountType: "flat",
              discountValue: 99,
              minOrderValue: 799,
              maxDiscountAmount: 99,
            },
          ]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = async (codeToApply) => {
    setStatusMessage({ type: "", text: "" });
    const cleanCode = (codeToApply || inputCode).trim().toUpperCase();
    if (!cleanCode) {
      setStatusMessage({ type: "error", text: "Please enter a promo code." });
      return;
    }

    const res = await applyCoupon(cleanCode, effectiveSubtotal);
    if (res.success) {
      setStatusMessage({
        type: "success",
        text: `Coupon '${cleanCode}' applied successfully! Savings updated.`,
      });
      setInputCode("");
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setStatusMessage({
        type: "error",
        text: res.message || "This coupon could not be applied.",
      });
    }
  };

  const handleCopy = (code) => {
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2200);
    }
  };

  const calculatePotentialSavings = (coupon) => {
    if (!effectiveSubtotal) return 0;
    if (coupon.discountType === "percentage") {
      let disc = Math.round((effectiveSubtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount) {
        disc = Math.min(disc, coupon.maxDiscountAmount);
      }
      return disc;
    }
    return Math.min(coupon.discountValue, effectiveSubtotal);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-burgundy-dark/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offers-modal-title"
    >
      <div
        className="bg-ivory-light border border-blush w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-burgundy to-burgundy-dark text-ivory-light px-6 py-4 flex items-center justify-between border-b border-blush/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-blush/20 flex items-center justify-center text-blush">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 id="offers-modal-title" className="font-serif font-bold text-base text-ivory-light">
                Coupons & Special Offers
              </h3>
              <p className="text-[11px] text-blush">
                Apply exclusive artisan savings to your order
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-ivory-light/10 text-ivory-light hover:bg-ivory-light/25 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close offers dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-burgundy">
          {/* Order Value Header Bar */}
          <div className="bg-blush-light/80 border border-blush rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-burgundy/80">Current Order Subtotal:</span>
            <span className="font-bold text-sm text-burgundy">
              ₹{effectiveSubtotal.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Custom Promo Code Input Box */}
          <div>
            <label className="text-xs font-semibold text-burgundy block mb-1.5">
              Have a Promo or Referral Code?
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApply(inputCode);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-burgundy/40 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Enter code (e.g. WELCOME10)"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setStatusMessage({ type: "", text: "" });
                  }}
                  className="w-full h-10 pl-10 pr-3 rounded-pill border border-blush text-xs uppercase font-mono font-semibold tracking-wider text-burgundy bg-white focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose"
                />
              </div>
              <button
                type="submit"
                disabled={isApplyingCoupon || !inputCode.trim()}
                className="px-5 h-10 rounded-pill bg-burgundy text-ivory-light text-xs font-serif font-bold hover:bg-burgundy-dark transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
              >
                {isApplyingCoupon ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <span>Apply</span>
                )}
              </button>
            </form>

            {/* Status Alert */}
            {statusMessage.text && (
              <div
                className={`mt-2.5 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 font-medium"
                    : "bg-rose/15 border border-rose/30 text-rose font-medium"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose flex-shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}
          </div>

          {/* Currently Applied Coupon Banner */}
          {appliedCoupon && (
            <div className="p-3.5 rounded-xl bg-olive/15 border border-olive/30 text-xs text-olive flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-olive" />
                <div>
                  <span className="font-bold font-mono">{appliedCoupon.code}</span> is active on your bag!
                  <span className="block text-[11px] font-normal text-olive/90">
                    Discount applied to order summary.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={removeCoupon}
                className="text-xs text-rose font-semibold hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Available Coupons List */}
          <div className="space-y-3">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-burgundy/70 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-rose" />
              <span>Available Promotional Coupons</span>
            </h4>

            {loading ? (
              <div className="py-8 text-center text-xs text-burgundy/60 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-rose" />
                <span>Loading available offers...</span>
              </div>
            ) : coupons.length === 0 ? (
              <p className="text-xs text-burgundy/60 italic py-2">
                No active promotional coupons at this moment.
              </p>
            ) : (
              <div className="space-y-3">
                {coupons.map((coupon) => {
                  const isApplied = appliedCoupon?.code === coupon.code;
                  const isEligible = effectiveSubtotal >= (coupon.minOrderValue || 0);
                  const deficit = Math.max(0, (coupon.minOrderValue || 0) - effectiveSubtotal);
                  const savings = calculatePotentialSavings(coupon);

                  return (
                    <div
                      key={coupon.code}
                      className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
                        isApplied
                          ? "bg-olive/10 border-olive shadow-xs"
                          : isEligible
                          ? "bg-white border-blush hover:border-rose/50 shadow-xs"
                          : "bg-stone-50 border-stone-200 opacity-80"
                      }`}
                    >
                      {/* Top Row: Code Pill + Badge + Action */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center flex-wrap gap-2">
                          {/* Ticket Pill */}
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blush-light border border-rose/30 font-mono font-bold text-xs tracking-wider text-burgundy">
                            <Tag className="w-3 h-3 text-rose" />
                            <span>{coupon.code}</span>
                          </div>

                          {coupon.badge && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-burgundy/10 text-burgundy">
                              {coupon.badge}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            className="text-[11px] text-burgundy/60 hover:text-burgundy flex items-center gap-0.5"
                            title="Copy Code"
                          >
                            {copiedCode === coupon.code ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Apply or Remove Button */}
                        <div>
                          {isApplied ? (
                            <button
                              type="button"
                              onClick={removeCoupon}
                              className="px-3 py-1 rounded-pill bg-olive/20 text-olive text-xs font-bold hover:bg-rose/15 hover:text-rose transition-colors cursor-pointer"
                            >
                              Applied ✓
                            </button>
                          ) : isEligible ? (
                            <button
                              type="button"
                              disabled={isApplyingCoupon}
                              onClick={() => handleApply(coupon.code)}
                              className="px-4 py-1.5 rounded-pill bg-burgundy text-ivory-light text-xs font-serif font-bold hover:bg-rose transition-colors shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              Apply
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                              Locked
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <p className="font-serif font-bold text-xs text-burgundy">
                        {coupon.title || `${coupon.discountValue}% Off Promo`}
                      </p>
                      <p className="text-[11px] text-burgundy/75 mt-0.5 leading-relaxed">
                        {coupon.description}
                      </p>

                      {/* Dynamic Savings or Deficit Bar */}
                      <div className="mt-3 pt-2.5 border-t border-blush/60 flex items-center justify-between text-[11px]">
                        {isEligible ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>
                              Saves ₹{savings.toLocaleString("en-IN")} on this order
                            </span>
                          </div>
                        ) : (
                          <div className="text-amber-800 font-medium flex items-center gap-1">
                            <span>Add ₹{deficit.toLocaleString("en-IN")} more to unlock</span>
                          </div>
                        )}

                        <span className="text-[10px] text-stone-500">
                          {coupon.minOrderValue > 0
                            ? `Min spend ₹${coupon.minOrderValue.toLocaleString("en-IN")}`
                            : "No minimum spend"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment & Bank Offers Strip */}
          <div className="bg-blush-light border border-blush rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-burgundy flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-rose" />
              <span>Instant Bank & Payment Benefits</span>
            </h4>

            <div className="space-y-2 text-xs text-burgundy/85">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-olive mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-burgundy">5% Instant Prepaid Discount: </span>
                  Pay with UPI, RuPay, Visa, Mastercard, or NetBanking online and save 5% immediately at checkout (no coupon code required).
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-olive mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-burgundy">Complimentary Express Shipping: </span>
                  Orders of ₹999 or higher receive free pan-India express courier with tracking.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-olive mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-burgundy">Doorstep Verification: </span>
                  Cash on Delivery and doorstep UPI scan-and-pay supported for all pin codes up to ₹5,000.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-blush-light border-t border-blush flex items-center justify-between text-xs text-burgundy/70">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-olive" />
            <span>100% Authentic Jaipur Craft</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-serif font-semibold text-rose hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
