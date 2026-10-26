"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  Search,
  CheckCircle2,
  Truck,
  Package,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { trackOrderApi } from "@/lib/api";
import { brand } from "@/config/brand";

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrderId);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (queryId) => {
    const cleanId = (queryId || "").trim();
    if (!cleanId) return;

    setLoading(true);
    setError("");
    setOrderData(null);
    setHasSearched(true);

    try {
      const res = await trackOrderApi(cleanId);
      if (res?.success && res?.data) {
        setOrderData(res.data);
      } else if (res?.data) {
        setOrderData(res.data);
      } else {
        setError(`No order found matching #${cleanId}. Please check your Order ID and try again.`);
      }
    } catch (err) {
      console.warn("Order tracking lookup failed:", err.message);
      setError(
        err?.message ||
          `Order #${cleanId} could not be found. Please check the ID from your confirmation email or SMS.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      setOrderNumber(initialOrderId);
      handleSearch(initialOrderId);
    }
  }, [initialOrderId]);

  const rawStatus = (orderData?.orderStatus || "placed").toLowerCase();
  const currentStatus = rawStatus === "placed" ? "pending" : rawStatus;

  const getStepStatus = (stepKey) => {
    const sequence = ["pending", "confirmed", "packed", "dispatched", "delivered"];
    const currentIndex = sequence.indexOf(currentStatus);
    const stepIndex = sequence.indexOf(stepKey);

    if (currentStatus === "cancelled") {
      return { isDone: false, isCurrent: false };
    }
    if (currentStatus === "return_requested" || currentStatus === "returned") {
      return { isDone: true, isCurrent: stepKey === "delivered" };
    }

    if (stepIndex < currentIndex) {
      return { isDone: true, isCurrent: false };
    }
    if (stepIndex === currentIndex) {
      return { isDone: true, isCurrent: true };
    }
    return { isDone: false, isCurrent: false };
  };

  const steps = [
    {
      id: "pending",
      title: "Order Placed",
      description: orderData?.createdAt
        ? `Placed on ${new Date(orderData.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`
        : "Order received via secure checkout",
      ...getStepStatus("pending"),
    },
    {
      id: "confirmed",
      title: "Payment & Order Confirmed",
      description:
        orderData?.payment?.status === "completed"
          ? "Payment verified by bank gateway"
          : "Confirmed for fulfillment",
      ...getStepStatus("confirmed"),
    },
    {
      id: "packed",
      title: "Quality Checked & Packed",
      description: "Handcrafted and inspected at our Jaipur atelier",
      ...getStepStatus("packed"),
    },
    {
      id: "dispatched",
      title: "Dispatched & In Transit",
      description:
        orderData?.tracking?.courierName && orderData?.tracking?.trackingNumber
          ? `${orderData.tracking.courierName} (AWB: ${orderData.tracking.trackingNumber})`
          : orderData?.tracking?.courierName
          ? `In transit with ${orderData.tracking.courierName}`
          : currentStatus === "dispatched"
          ? "Handed over to delivery partner"
          : "Courier label will be generated upon dispatch",
      ...getStepStatus("dispatched"),
    },
    {
      id: "delivered",
      title: "Delivered to Doorstep",
      description:
        orderData?.tracking?.deliveredAt
          ? `Delivered on ${new Date(orderData.tracking.deliveredAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}`
          : "Out for delivery to your address",
      ...getStepStatus("delivered"),
    },
  ];

  return (
    <div className="bg-ivory-light min-h-[75vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Track Your Order" }]} />

        {/* Header Block with Clean Spacing */}
        <div className="text-center my-6 sm:my-8">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Real-Time Order Tracking
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-semibold text-burgundy tracking-[-0.034em] mb-2">
            Track Order Status
          </h1>
          <p className="text-xs sm:text-[14px] text-burgundy/85 max-w-md mx-auto font-sans leading-[1.714]">
            Enter your order ID (e.g. {orderNumber || "VL-1001"}) to check live dispatch and fulfillment status.
          </p>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(orderNumber);
            }}
            className="flex gap-2 max-w-md mx-auto mt-6"
          >
            <input
              type="text"
              required
              placeholder="Enter Order ID (e.g. VL-1001)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="input-pill flex-1 text-xs sm:text-sm bg-ivory-light border-blush"
            />
            <button
              type="submit"
              disabled={loading || !orderNumber.trim()}
              className="btn-primary text-xs sm:text-sm px-6 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Track</span>
            </button>
          </form>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="bg-rose/10 border border-rose/30 text-rose rounded-2xl p-4 sm:p-5 mb-8 flex items-start space-x-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-burgundy mb-1">Order Not Found</p>
              <p className="text-burgundy/85 leading-relaxed">{error}</p>
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={`https://wa.me/${brand.contact.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hi, I need help tracking my order: ${orderNumber}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-olive hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact WhatsApp Support</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Real Order Tracking Card */}
        {hasSearched && orderData && (
          <div className="bg-ivory-light border border-blush rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Top Order Summary Header */}
            <div className="flex flex-wrap items-center justify-between pb-5 border-b border-blush gap-4">
              <div>
                <span className="text-[11px] text-burgundy/70 block uppercase tracking-wider font-semibold">
                  Order Number
                </span>
                <span className="font-serif font-bold text-lg sm:text-xl text-burgundy">
                  #{orderData.orderNumber}
                </span>
              </div>

              {orderData.createdAt && (
                <div>
                  <span className="text-[11px] text-burgundy/70 block uppercase tracking-wider font-semibold">
                    Placed On
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-burgundy flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-burgundy/70" />
                    {new Date(orderData.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[11px] text-burgundy/70 block uppercase tracking-wider font-semibold">
                  Current Status
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-badge text-xs font-bold uppercase tracking-wider ${
                    currentStatus === "delivered"
                      ? "bg-olive/15 text-olive"
                      : currentStatus === "dispatched"
                      ? "bg-rose/15 text-rose"
                      : currentStatus === "cancelled"
                      ? "bg-rose/15 text-rose"
                      : "bg-blush-light text-burgundy"
                  }`}
                >
                  {currentStatus}
                </span>
              </div>
            </div>

            {/* Courier & Transit Details (Displayed ONLY if real data exists) */}
            {(orderData.tracking?.courierName || orderData.tracking?.trackingNumber) && (
              <div className="bg-blush-light border border-blush rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-ivory-light border border-blush flex items-center justify-center text-rose flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-burgundy/70 block">Courier Partner</span>
                    <span className="font-semibold text-burgundy">
                      {orderData.tracking.courierName || "Assigned Courier"}
                    </span>
                  </div>
                </div>

                {orderData.tracking.trackingNumber && (
                  <div>
                    <span className="text-[11px] text-burgundy/70 block">AWB / Tracking Number</span>
                    <span className="font-mono font-semibold text-burgundy">
                      {orderData.tracking.trackingNumber}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Status Timeline */}
            <div>
              <h3 className="font-serif text-base font-bold text-burgundy mb-6">
                Fulfillment Timeline
              </h3>

              <div className="relative pl-6 space-y-7 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blush">
                {steps.map((step) => (
                  <div key={step.id} className="relative flex items-start space-x-4">
                    <div
                      className={`absolute -left-6 w-4 h-4 rounded-full border-2 bg-ivory-light flex items-center justify-center ${
                        step.isCurrent
                          ? "border-rose bg-rose ring-4 ring-rose/20"
                          : step.isDone
                          ? "border-olive bg-olive text-ivory-light"
                          : "border-blush bg-ivory-light"
                      }`}
                    >
                      {step.isDone && !step.isCurrent && (
                        <CheckCircle2 className="w-3 h-3 text-ivory-light" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h4
                        className={`font-serif text-sm font-bold ${
                          step.isCurrent
                            ? "text-rose"
                            : step.isDone
                            ? "text-burgundy"
                            : "text-burgundy/60"
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-xs text-burgundy/80 mt-0.5 font-sans leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items Preview (If present) */}
            {orderData.items && orderData.items.length > 0 && (
              <div className="pt-6 border-t border-blush">
                <h3 className="font-serif text-sm font-bold text-burgundy mb-3">
                  Items in this Order ({orderData.items.length})
                </h3>
                <div className="space-y-3">
                  {orderData.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-blush-light/60 border border-blush/60 text-xs"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title || "Product"}
                            className="w-10 h-12 object-cover rounded border border-blush flex-shrink-0"
                          />
                        )}
                        <div className="truncate">
                          <p className="font-semibold text-burgundy truncate">{item.title}</p>
                          <p className="text-[11px] text-burgundy/70">
                            Size: {item.size || "M"} • Qty: {item.quantity || 1}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-rose flex-shrink-0 ml-3">
                        ₹{(item.price || 0) * (item.quantity || 1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Destination */}
            {orderData.shippingAddress && (
              <div className="pt-4 border-t border-blush flex flex-wrap justify-between items-center text-xs text-burgundy/85">
                <div>
                  <span className="text-[11px] text-burgundy/70 block uppercase font-semibold">
                    Delivering To
                  </span>
                  <span className="text-burgundy font-medium">
                    {orderData.shippingAddress.fullName || "Customer"} —{" "}
                    {orderData.shippingAddress.city}, {orderData.shippingAddress.state} (
                    {orderData.shippingAddress.postalCode})
                  </span>
                </div>
              </div>
            )}

            {/* Support Assistance */}
            <div className="p-4 rounded-xl bg-blush-light border border-blush text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-burgundy">Need assistance with your delivery?</p>
                <p className="text-[11px] text-burgundy/85 mt-0.5 font-sans">
                  Our Jaipur atelier support is available Mon–Sat (10 AM to 7 PM IST).
                </p>
              </div>
              <a
                href={`https://wa.me/${brand.contact.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hi, I have a question regarding my order #${orderData.orderNumber}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-pill bg-olive hover:bg-olive/90 text-ivory-light font-medium text-xs transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                <span>WhatsApp Care</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Default Help Card when no search performed yet */}
        {!hasSearched && (
          <div className="bg-ivory-light border border-blush rounded-2xl p-6 sm:p-8 text-center shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-blush-light border border-blush mx-auto flex items-center justify-center text-rose">
              <Package className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h2 className="font-serif text-lg font-bold text-burgundy">
              Where can I find my Order ID?
            </h2>
            <p className="text-xs sm:text-[14px] text-burgundy/85 max-w-md mx-auto font-sans leading-[1.714]">
              Your Order ID was sent to your email and SMS immediately after placing your order. It starts with <span className="font-mono font-semibold text-burgundy">VL-</span> followed by your unique order reference.
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-burgundy/80">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-olive" />
                <span>100% Genuine Atelier Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-rose" />
                <span>Pan-India Express Logistics</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
