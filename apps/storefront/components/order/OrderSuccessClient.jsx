"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ShoppingBag,
  Clock,
  Sparkles,
  ShieldCheck,
  Printer,
  MessageCircle,
  FileCheck,
} from "lucide-react";
import { brand } from "@/config/brand";

export function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "HOL-849201";
  const method = searchParams.get("method") || "online";
  const amount = searchParams.get("amount") || "1899";

  const [whatsappOptedIn, setWhatsappOptedIn] = useState(false);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="bg-ivory-light min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center print:bg-ivory-light print:p-0">
      <div className="max-w-xl w-full bg-ivory-light rounded-3xl border border-blush shadow-xl p-6 sm:p-10 text-center print:shadow-none print:border-none">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-olive/15 text-olive border border-olive/30 flex items-center justify-center mx-auto mb-6 shadow-xs print:hidden">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </div>

        {/* Brand & Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose/15 text-rose text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Order Confirmed & Received</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy mb-2">
          Thank You for Shopping with {brand.name}!
        </h1>

        <p className="text-xs sm:text-sm text-burgundy/85 mb-8 max-w-md mx-auto leading-relaxed">
          Your order has been recorded. Our master artisans in Jaipur are carefully preparing your hand-block garments for dispatch.
        </p>

        {/* Order Details Card */}
        <div className="bg-blush-light p-5 rounded-2xl border border-blush text-left text-xs space-y-3 mb-6 print:border-blush">
          <div className="flex justify-between items-center pb-2 border-b border-blush">
            <span className="text-burgundy/70 font-medium">Order Number:</span>
            <span className="font-mono font-bold text-burgundy text-sm">
              #{orderId}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-burgundy/70 font-medium">Payment Mode:</span>
            <span className="font-semibold text-burgundy capitalize">
              {method === "online"
                ? "Prepaid Online (Razorpay 100% Verified)"
                : "Cash on Delivery (COD — Pay ₹" + Number(amount).toLocaleString("en-IN") + " upon receipt)"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-burgundy/70 font-medium">Total Amount:</span>
            <span className="font-serif font-bold text-rose text-sm">
              ₹{Number(amount).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-burgundy/70 font-medium">Courier Partner:</span>
            <span className="font-semibold text-burgundy">
              Delhivery Express Air
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-blush">
            <span className="text-burgundy/70 font-medium flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-rose" />
              <span>Estimated Delivery:</span>
            </span>
            <span className="font-semibold text-olive">
              3 – 5 Business Days
            </span>
          </div>
        </div>

        {/* WhatsApp Notification Opt-in Box */}
        <div className="p-4 rounded-2xl bg-olive/10 border border-olive/30 text-left text-xs mb-6 print:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <MessageCircle className="w-4 h-4 text-olive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-burgundy">Receive WhatsApp Dispatch Updates</p>
                <p className="text-burgundy/85 text-[11px] mt-0.5">
                  Get real-time AWB tracking links & delivery boy contact details straight to your WhatsApp.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWhatsappOptedIn(!whatsappOptedIn)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer flex-shrink-0 focus-visible:outline-2 focus-visible:outline-blush ${
                whatsappOptedIn
                  ? "bg-olive text-ivory-light"
                  : "border border-olive text-olive hover:bg-olive/15"
              }`}
            >
              {whatsappOptedIn ? "Subscribed ✓" : "Opt-In Free"}
            </button>
          </div>
          {whatsappOptedIn && (
            <p className="text-[11px] text-olive font-medium mt-2 pt-2 border-t border-olive/30">
              ✓ Subscribed! Tracking notifications will be dispatched to your registered phone number.
            </p>
          )}
        </div>

        {/* Progress Timeline Teaser */}
        <div className="p-4 rounded-2xl bg-blush-light/80 border border-blush text-left text-xs text-burgundy mb-8 flex items-start gap-3 print:hidden">
          <Clock className="w-4 h-4 text-rose flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-burgundy">Live Delivery Updates</p>
            <p className="text-burgundy/80 text-[11px] mt-0.5">
              You will receive SMS tracking updates as soon as Delhivery Express scans your parcel at Jaipur central hub.
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <Link
            href={`/track-order?orderId=${encodeURIComponent(orderId)}`}
            className="flex-1 py-3 px-6 rounded-full bg-rose hover:bg-burgundy text-ivory text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-blush"
          >
            <Truck className="w-4 h-4" />
            <span>Track Order Pipeline</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="py-3 px-5 rounded-full border border-burgundy hover:bg-burgundy hover:text-ivory text-burgundy text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-blush"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>

          <Link
            href="/shop"
            className="py-3 px-5 rounded-full border border-burgundy hover:bg-burgundy hover:text-ivory text-burgundy text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-blush"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
