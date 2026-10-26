"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { brand } from "@/config/brand";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CreditCard,
  Banknote,
  CheckCircle2,
  MapPin,
  Sparkles,
  FileText,
  Info,
  Gift,
  Lock,
  Tag,
} from "lucide-react";
import { onProductImageError, DEFAULT_PRODUCT_FALLBACK } from "@/lib/image-fallback";
import { createOrderApi, verifyPaymentApi, checkServiceabilityApi } from "@/lib/api";
import { AvailableOffersModal } from "@/components/checkout/AvailableOffersModal";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const ORDER_BUMP_ITEM = {
  id: "order-bump-scrunchie",
  name: "Handcrafted Pure Silk Zari Scrunchie",
  price: 99,
  size: "Free Size",
  color: "Maroon & Gold",
  quantity: 1,
  image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=80",
};

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cartItems,
    subtotal,
    clearCart,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    isApplyingCoupon,
  } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine: "",
    city: "",
    state: "Rajasthan",
    pincode: "",
    paymentMethod: "online", // "online" (Razorpay 5% discount) or "cod"
    gstin: "",
    deliveryInstructions: "",
  });

  const [hasGstin, setHasGstin] = useState(false);
  const [includeOrderBump, setIncludeOrderBump] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Offers and coupon state
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [checkoutCouponCode, setCheckoutCouponCode] = useState("");
  const [checkoutCouponStatus, setCheckoutCouponStatus] = useState({ type: "", message: "" });

  // Pincode serviceability state
  const [pincodeStatus, setPincodeStatus] = useState({
    loading: false,
    checked: false,
    serviceable: true,
    zone: "",
    estimatedDays: "",
    courierName: "",
    message: "",
  });

  // Pre-load Razorpay checkout script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // Pre-fill user data if logged in
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("customer_user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setFormData((prev) => ({
          ...prev,
          fullName: u.name || prev.fullName,
          email: u.email || prev.email,
          phone: u.phone || prev.phone,
        }));
      }
    } catch {}
  }, []);

  // Check pincode serviceability when 6 digits are typed
  useEffect(() => {
    const cleanPin = formData.pincode.trim();
    if (/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setPincodeStatus((prev) => ({ ...prev, loading: true, checked: false }));
      checkServiceabilityApi(cleanPin, formData.paymentMethod === "cod")
        .then((res) => {
          if (res.success && res.data) {
            setPincodeStatus({
              loading: false,
              checked: true,
              serviceable: res.data.serviceable,
              zone: res.data.zone || "Pan-India Hub",
              estimatedDays: res.data.estimatedDays || "3-5 Business Days",
              courierName: res.data.recommendedCourier || "Delhivery Express",
              message: res.data.message || "",
            });
          }
        })
        .catch(() => {
          setPincodeStatus({
            loading: false,
            checked: true,
            serviceable: true,
            zone: "Pan-India Standard Delivery",
            estimatedDays: "3-5 Business Days",
            courierName: "Delhivery Express",
            message: "",
          });
        });
    } else {
      setPincodeStatus({
        loading: false,
        checked: false,
        serviceable: true,
        zone: "",
        estimatedDays: "",
        courierName: "",
        message: "",
      });
    }
  }, [formData.pincode, formData.paymentMethod]);

  // Combined items including order bump if selected
  const activeItems = useMemo(() => {
    const items = [...cartItems];
    if (includeOrderBump) {
      items.push(ORDER_BUMP_ITEM);
    }
    return items;
  }, [cartItems, includeOrderBump]);

  const activeSubtotal = useMemo(() => {
    return subtotal + (includeOrderBump ? ORDER_BUMP_ITEM.price : 0);
  }, [subtotal, includeOrderBump]);

  // COD limit enforcement (Max ₹5,000)
  const isCodAvailable = activeSubtotal <= 5000;

  const shippingFee =
    activeSubtotal >= (brand.freeShippingThreshold || 999) || activeSubtotal === 0 ? 0 : 99;
  const codFee = formData.paymentMethod === "cod" ? 50 : 0; // Standard ₹50 COD verification & handling fee
  const couponDiscount = appliedCoupon ? discountAmount : 0;
  // 5% instant discount for online payments when no other coupon is applied
  const prepaidDiscount =
    formData.paymentMethod === "online" && couponDiscount === 0
      ? Math.round(activeSubtotal * 0.05)
      : 0;

  // Indian Apparel GST Calculation (5% for < ₹1000, 12% for >= ₹1000)
  const gstBreakdown = useMemo(() => {
    let gst5 = 0;
    let gst12 = 0;
    for (const item of activeItems) {
      const lineTotal = item.price * item.quantity;
      if (item.price < 1000) {
        gst5 += Math.round(lineTotal - lineTotal / 1.05);
      } else {
        gst12 += Math.round(lineTotal - lineTotal / 1.12);
      }
    }
    return { gst5, gst12, totalGst: gst5 + gst12 };
  }, [activeItems]);

  const grandTotal = Math.max(
    0,
    activeSubtotal - couponDiscount - prepaidDiscount + shippingFee + codFee
  );

  const handleApplyCheckoutCoupon = async (e) => {
    e.preventDefault();
    const clean = checkoutCouponCode.trim().toUpperCase();
    if (!clean) return;
    setCheckoutCouponStatus({ type: "", message: "" });
    const res = await applyCoupon(clean, activeSubtotal);
    if (res.success) {
      setCheckoutCouponStatus({
        type: "success",
        message: `Coupon '${res.data?.code || clean}' applied! Savings updated.`,
      });
      setCheckoutCouponCode("");
    } else {
      setCheckoutCouponStatus({
        type: "error",
        message: res.message || "Invalid coupon code.",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Pincode validation (6 digits)
    if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
      setErrorMessage("Please enter a valid 6-digit Indian PIN code starting with 1-9.");
      return;
    }

    // Phone validation
    if (!/^[0-9+ -]{10,14}$/.test(formData.phone.trim())) {
      setErrorMessage("Please enter a valid 10-digit mobile number for order delivery tracking.");
      return;
    }

    // GSTIN validation if enabled
    if (hasGstin && formData.gstin.trim()) {
      const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinPattern.test(formData.gstin.trim().toUpperCase())) {
        setErrorMessage("Please enter a valid 15-character Indian GSTIN (e.g. 08AABCV1234F1Z5).");
        return;
      }
    }

    if (formData.paymentMethod === "cod" && !isCodAvailable) {
      setErrorMessage(
        "Cash on Delivery is limited to orders up to ₹5,000. Please select Online Payment."
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      customerDetails: {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
      },
      shippingAddress: {
        streetAddress: formData.addressLine.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      },
      items: activeItems.map((item) => ({
        product: item._id || item.id,
        name: item.name,
        price: item.price,
        size: item.selectedSize || "Free Size",
        color: item.selectedColor || "Default",
        quantity: item.quantity,
        image: item.image,
      })),
      paymentMethod: formData.paymentMethod,
      couponCode: appliedCoupon?.code || undefined,
      gstin: hasGstin ? formData.gstin.trim().toUpperCase() : undefined,
      deliveryInstructions: formData.deliveryInstructions.trim() || undefined,
    };

    try {
      // 1. Create Order on Backend API
      const orderResponse = await createOrderApi(payload);
      if (!orderResponse || !orderResponse.data) {
        throw new Error(orderResponse?.message || "Failed to create order on server.");
      }

      const { order, razorpayOrder, keyId } = orderResponse.data;

      // 2A. If Cash on Delivery (COD): clear cart and redirect to success page
      if (formData.paymentMethod === "cod") {
        try {
          removeCoupon();
        } catch {}
        clearCart();
        router.push(
          `/order-success?orderId=${encodeURIComponent(
            order.orderNumber
          )}&method=cod&amount=${grandTotal}`
        );
        return;
      }

      // 2B. If Online Payment via Razorpay
      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error(
          "Could not initialize online payment session. Please try again or select Cash on Delivery."
        );
      }

      const razorpayKey =
        keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey || razorpayKey.includes("placeholder")) {
        throw new Error(
          "Razorpay test key is not configured. Please provide a valid Razorpay test key (e.g. rzp_test_...)."
        );
      }

      // Ensure Razorpay SDK script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error(
          "Razorpay Checkout SDK could not be loaded. Please check your internet connection and try again."
        );
      }

      const rzpOptions = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: brand.name || "House of Laado",
        description: `Order #${order.orderNumber} - Handcrafted Ethnic Wear`,
        image: "/logo.png",
        order_id: razorpayOrder.id,
        prefill: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          contact: formData.phone.trim(),
        },
        theme: {
          color: "#1F2A44",
        },
        modal: {
          backdropclose: false,
          escape: true,
          handleback: true,
          ondismiss: function () {
            setIsSubmitting(false);
            setErrorMessage(
              "Online payment was closed or cancelled. Your bag items are saved and you can retry paying or select Cash on Delivery."
            );
          },
        },
        handler: async function (response) {
          try {
            const verifyRes = await verifyPaymentApi({
              orderId: order.orderNumber,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes && verifyRes.success) {
              try {
                removeCoupon();
              } catch {}
              clearCart();
              router.push(
                `/order-success?orderId=${encodeURIComponent(
                  order.orderNumber
                )}&method=online&amount=${order.pricing.grandTotal}`
              );
            } else {
              throw new Error(
                verifyRes?.message || "Payment verification could not be confirmed."
              );
            }
          } catch (verifyErr) {
            setIsSubmitting(false);
            setErrorMessage(
              verifyErr?.message ||
                "Payment verification failed. If money was debited, please contact atelier concierge with Payment ID: " +
                  response.razorpay_payment_id
            );
          }
        },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on("payment.failed", function (failResponse) {
        setIsSubmitting(false);
        setErrorMessage(
          failResponse.error?.description ||
            "Payment failed with Razorpay. Please retry or choose Cash on Delivery."
        );
      });
      rzp.open();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(
        err?.message || "An error occurred while creating your order. Please try again."
      );
    }
  };

  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs
          items={[
            { label: "Shopping Bag", href: "/cart" },
            { label: "Secure Checkout" },
          ]}
        />

        <div className="my-6 pb-4 border-b border-blush flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy">
              Delivery Details & Payment
            </h1>
            <p className="text-xs text-burgundy/85 mt-1">
              Complete your order with 100% verified encrypted payment & instant SMS updates
            </p>
          </div>
          <Link
            href="/cart"
            className="text-xs text-burgundy/80 hover:text-burgundy flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Bag</span>
          </Link>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose/10 border border-rose/30 text-rose text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose" />
            <span>{errorMessage}</span>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-blush-light border border-blush rounded-2xl p-12 text-center my-8 max-w-md mx-auto">
            <p className="text-sm text-burgundy/85 mb-4">Your bag is currently empty.</p>
            <Link href="/shop" className="btn-primary text-xs">
              Explore Collections
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
          >
            {/* LEFT: Delivery Address & Payment Method (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Contact Information */}
              <div className="bg-ivory-light border border-blush rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="font-serif font-bold text-base text-burgundy">
                  1. Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-burgundy block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="input-pill w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-burgundy block mb-1">
                      Mobile Number (for tracking SMS) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="input-pill w-full text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-burgundy block mb-1">
                    Email Address (for invoice & tracking updates) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="order@gmail.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="input-pill w-full text-xs"
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-ivory-light border border-blush rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="font-serif font-bold text-base text-burgundy">
                  2. Shipping Address
                </h2>
                <div>
                  <label className="text-xs font-semibold text-burgundy block mb-1">
                    Street Address, Flat, Building *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House / Apartment number and street"
                    value={formData.addressLine}
                    onChange={(e) =>
                      setFormData({ ...formData, addressLine: e.target.value })
                    }
                    className="input-pill w-full text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-burgundy block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jaipur, Mumbai..."
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="input-pill w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-burgundy block mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Rajasthan"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      className="input-pill w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-burgundy block mb-1">
                      PIN Code (6 Digits) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 302029"
                        value={formData.pincode}
                        onChange={(e) =>
                          setFormData({ ...formData, pincode: e.target.value })
                        }
                        className="input-pill w-full text-xs pr-8"
                      />
                      {pincodeStatus.loading && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose absolute right-3 top-3" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Pincode Serviceability Live Feedback */}
                {pincodeStatus.checked && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      pincodeStatus.serviceable
                        ? "bg-olive/10 border-olive/30 text-olive font-medium"
                        : "bg-blush-light border-rose/30 text-rose"
                    }`}
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-olive" />
                    <div>
                      {pincodeStatus.serviceable ? (
                        <>
                          <span className="font-semibold">
                            Delivery available to {pincodeStatus.zone}:
                          </span>{" "}
                          Estimated {pincodeStatus.estimatedDays} via {pincodeStatus.courierName}.
                        </>
                      ) : (
                        <span>{pincodeStatus.message || "Delivery might experience slight delay."}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Instructions */}
                <div>
                  <label className="text-xs font-semibold text-burgundy block mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <select
                    value={formData.deliveryInstructions}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryInstructions: e.target.value })
                    }
                    className="input-pill w-full text-xs text-burgundy bg-ivory-light border border-blush"
                  >
                    <option value="">No special instructions</option>
                    <option value="Leave parcel with building security guard">
                      Leave parcel with building security guard
                    </option>
                    <option value="Please call mobile before arriving">
                      Please call mobile before arriving
                    </option>
                    <option value="Deliver during office hours (10 AM - 6 PM)">
                      Deliver during office hours (10 AM - 6 PM)
                    </option>
                    <option value="Do not ring doorbell (baby sleeping / pets)">
                      Do not ring doorbell (baby sleeping / pets)
                    </option>
                  </select>
                </div>

                {/* B2B GSTIN Section */}
                <div className="pt-2 border-t border-blush">
                  <button
                    type="button"
                    onClick={() => setHasGstin(!hasGstin)}
                    className="text-xs text-rose font-medium hover:underline flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>
                      {hasGstin
                        ? "Remove GSTIN for Business Invoice"
                        : "+ Add GSTIN for Business Input Tax Credit (Optional)"}
                    </span>
                  </button>

                  {hasGstin && (
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-burgundy block mb-1">
                        15-digit GSTIN (Goods and Services Tax Identification Number)
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="e.g. 08AABCV1234F1Z5"
                        value={formData.gstin}
                        onChange={(e) =>
                          setFormData({ ...formData, gstin: e.target.value.toUpperCase() })
                        }
                        className="input-pill w-full text-xs uppercase font-mono"
                      />
                      <p className="text-[11px] text-burgundy/70 mt-1">
                        Tax invoice will reflect this GSTIN for input tax credit claims.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method Section — Online Razorpay & Cash on Delivery */}
              <div className="bg-ivory-light border border-blush rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif font-bold text-base text-burgundy">
                    3. Payment Method
                  </h2>
                  <span className="text-[11px] font-bold text-rose bg-rose/10 px-2.5 py-1 rounded-full border border-rose/30 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-rose" />
                    <span>256-Bit Bank Grade SSL</span>
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Option 1: Razorpay Online (UPI, Cards, NetBanking) */}
                  <label
                    className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      formData.paymentMethod === "online"
                        ? "border-rose bg-blush-light/80 shadow-xs"
                        : "border-blush bg-ivory-light hover:border-blush-dark"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="online"
                          checked={formData.paymentMethod === "online"}
                          onChange={() => setFormData({ ...formData, paymentMethod: "online" })}
                          className="accent-rose w-4 h-4 cursor-pointer"
                        />
                        <span className="font-serif font-bold text-sm text-burgundy flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-rose" />
                          <span>UPI, Credit / Debit Cards & NetBanking</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-olive bg-olive/15 border border-olive/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-olive" />
                        <span>Save 5% Instant Discount</span>
                      </span>
                    </div>

                    <p className="text-burgundy/80 text-xs mt-2 ml-7 leading-relaxed">
                      Pay securely via Razorpay Standard Checkout with Google Pay, PhonePe, Paytm, BHIM UPI, Cards or NetBanking. Instant automated confirmation & priority atelier dispatch.
                    </p>

                    <div className="mt-3 ml-7 pt-2.5 border-t border-blush/60 flex flex-wrap items-center gap-2 text-[10px] text-burgundy/75 font-medium">
                      <span className="bg-blush px-2 py-0.5 rounded">Google Pay / PhonePe UPI</span>
                      <span className="bg-blush px-2 py-0.5 rounded">Visa / Mastercard / RuPay</span>
                      <span className="bg-blush px-2 py-0.5 rounded">All Indian NetBanking</span>
                      <span className="text-olive font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-olive" />
                        <span>Zero Convenience Fee</span>
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Cash on Delivery (COD) */}
                  <label
                    className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      formData.paymentMethod === "cod"
                        ? "border-rose bg-blush-light/80 shadow-xs"
                        : "border-blush bg-ivory-light hover:border-blush-dark"
                    } ${!isCodAvailable ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          disabled={!isCodAvailable}
                          checked={formData.paymentMethod === "cod"}
                          onChange={() => {
                            if (isCodAvailable) {
                              setFormData({ ...formData, paymentMethod: "cod" });
                            }
                          }}
                          className="accent-rose w-4 h-4 cursor-pointer"
                        />
                        <span className="font-serif font-bold text-sm text-burgundy flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-rose" />
                          <span>Cash on Delivery (Pay on Receipt)</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-burgundy bg-blush px-2 py-0.5 rounded">
                        +₹50 Verification Fee
                      </span>
                    </div>

                    <p className="text-burgundy/80 text-xs mt-2 ml-7 leading-relaxed">
                      Pay securely with cash or scan-and-pay UPI upon parcel delivery at your doorstep by Delhivery Express. Zero upfront payment required.
                    </p>

                    {!isCodAvailable ? (
                      <div className="mt-3 ml-7 p-2 rounded-lg bg-rose/10 border border-rose/30 text-rose text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>COD is available for orders up to ₹5,000 only. Please select Online Payment.</span>
                      </div>
                    ) : (
                      <div className="mt-3 ml-7 pt-2 border-t border-blush/60 text-[11px] text-burgundy/75 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-rose flex-shrink-0" />
                        <span>Our Jaipur atelier will confirm your delivery address via SMS before dispatch.</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT: Order Summary Snapshot (5 cols) */}
            <div className="lg:col-span-5 space-y-6 sticky top-28">
              {/* Order Bump: Handcrafted Accessory */}
              <div className="bg-blush-light border border-rose/30 rounded-2xl p-4 shadow-xs relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="order-bump"
                    checked={includeOrderBump}
                    onChange={(e) => setIncludeOrderBump(e.target.checked)}
                    className="accent-rose w-4 h-4 mt-1 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <label
                      htmlFor="order-bump"
                      className="cursor-pointer font-bold text-burgundy flex items-center gap-1.5"
                    >
                      <Gift className="w-4 h-4 text-rose" />
                      <span>One-Time Offer: Handcrafted Pure Silk Scrunchie (+₹99)</span>
                    </label>
                    <p className="text-burgundy/85 text-[11px] mt-0.5">
                      Made with leftover Banarasi silk zari fabric from our Jaipur atelier. Normal price ₹299.
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="bg-blush-light border border-blush rounded-2xl p-6 shadow-xs space-y-6">
                <h2 className="font-serif font-bold text-lg text-burgundy pb-3 border-b border-blush flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs font-sans font-normal text-burgundy/70">
                    ({activeItems.length} {activeItems.length === 1 ? "item" : "items"})
                  </span>
                </h2>

                {/* Items thumbnail summary */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {activeItems.map((item) => (
                    <div
                      key={`${item.id}-${item.selectedSize || item.size}`}
                      className="flex items-center space-x-3 text-xs"
                    >
                      <img
                        src={item.image || DEFAULT_PRODUCT_FALLBACK}
                        alt={item.name}
                        onError={onProductImageError}
                        className="w-12 h-14 object-cover rounded-lg border border-blush flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-semibold text-burgundy truncate">
                          {item.name}
                        </p>
                        <p className="text-burgundy/70 text-[11px]">
                          Qty: {item.quantity} | Size: {item.selectedSize || item.size}
                        </p>
                      </div>
                      <span className="font-bold text-burgundy">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Offers & Coupons Section */}
                <div className="pt-3 pb-2 border-t border-blush space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-burgundy flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-rose" />
                      <span>Offers & Promo Code</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsOffersModalOpen(true)}
                      className="text-xs font-bold text-rose hover:text-burgundy underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>View All Offers</span>
                    </button>
                  </div>

                  {appliedCoupon ? (
                    <div className="p-3 rounded-xl bg-olive/15 border border-olive/30 flex items-center justify-between text-xs text-olive">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-olive flex-shrink-0" />
                        <div>
                          <span className="font-mono font-bold">{appliedCoupon.code}</span> applied!
                          <span className="block text-[11px] text-olive/90">
                            {appliedCoupon.title || "Promotional discount active"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs font-semibold text-rose hover:underline ml-2 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. WELCOME10"
                          value={checkoutCouponCode}
                          onChange={(e) => {
                            setCheckoutCouponCode(e.target.value.toUpperCase());
                            setCheckoutCouponStatus({ type: "", message: "" });
                          }}
                          className="h-9 px-3 rounded-pill border border-blush text-xs uppercase font-mono font-semibold tracking-wider flex-1 bg-white text-burgundy focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose"
                        />
                        <button
                          type="button"
                          disabled={isApplyingCoupon || !checkoutCouponCode.trim()}
                          onClick={handleApplyCheckoutCoupon}
                          className="h-9 px-4 rounded-pill bg-burgundy text-ivory-light text-xs font-serif font-bold hover:bg-rose transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                        >
                          {isApplyingCoupon ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span>Apply</span>
                          )}
                        </button>
                      </div>

                      {/* Interactive banner to open modal */}
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

                  {checkoutCouponStatus.message && (
                    <div
                      className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                        checkoutCouponStatus.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose/10 text-rose border border-rose/20"
                      }`}
                    >
                      {checkoutCouponStatus.type === "success" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-rose flex-shrink-0" />
                      )}
                      <span>{checkoutCouponStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* Breakdown */}
                <div className="space-y-2 text-xs pt-4 border-t border-blush">
                  <div className="flex justify-between text-burgundy/80">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-burgundy">
                      ₹{activeSubtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-rose font-semibold">
                      <span>Coupon ({appliedCoupon?.code})</span>
                      <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {prepaidDiscount > 0 && (
                    <div className="flex justify-between text-olive font-semibold">
                      <span>Prepaid 5% Instant Discount</span>
                      <span>-₹{prepaidDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-burgundy/80">
                    <span>Express Shipping</span>
                    <span className="font-semibold text-burgundy">
                      {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                    </span>
                  </div>

                  {codFee > 0 && (
                    <div className="flex justify-between text-burgundy/80">
                      <span>COD Verification Fee</span>
                      <span className="font-semibold text-burgundy">₹{codFee}</span>
                    </div>
                  )}

                  {/* GST Breakdown line */}
                  <div className="flex justify-between text-[11px] text-burgundy/70 pt-1">
                    <span>GST (Included in price)</span>
                    <span>
                      ₹{gstBreakdown.totalGst.toLocaleString("en-IN")} (5%: ₹{gstBreakdown.gst5}, 12%: ₹{gstBreakdown.gst12})
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-burgundy pt-3 border-t border-blush">
                    <span className="font-serif font-bold text-base">Grand Total</span>
                    <span className="font-serif font-bold text-xl text-rose">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting || (formData.paymentMethod === "cod" && !isCodAvailable)}
                  className="btn-primary w-full py-4 text-sm flex items-center justify-center space-x-2 shadow-lg disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {formData.paymentMethod === "online"
                          ? "Connecting to Razorpay..."
                          : "Recording Your Order..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {formData.paymentMethod === "online"
                          ? `Pay ₹${grandTotal.toLocaleString("en-IN")} via Razorpay`
                          : `Place COD Order • ₹${grandTotal.toLocaleString("en-IN")}`}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center space-x-2 text-[11px] text-burgundy/70">
                  <Truck className="w-3.5 h-3.5 text-rose" />
                  <span>Free express shipping & 7-day doorstep exchange.</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Available Offers & Discounts Modal */}
      <AvailableOffersModal
        isOpen={isOffersModalOpen}
        onClose={() => setIsOffersModalOpen(false)}
        currentSubtotal={activeSubtotal}
      />
    </div>
  );
}
