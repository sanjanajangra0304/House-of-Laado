"use client";

import React, { useState } from "react";
import { AlertTriangle, X, CheckCircle2, ShieldCheck, Loader2, HelpCircle } from "lucide-react";
import { cancelOrderApi } from "@/lib/api";

const CANCELLATION_REASONS = [
  "Ordered by mistake / duplicate order",
  "Incorrect size or color selected",
  "Found a better price or offer elsewhere",
  "Delivery timeframe too long",
  "Need to modify shipping address",
  "Change of mind",
  "Other",
];

export function CancelOrderModal({ order, isOpen, onClose, onSuccess, token }) {
  const [reason, setReason] = useState(CANCELLATION_REASONS[0]);
  const [customNote, setCustomNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !order) return null;

  const isPrepaid = order.paymentMethod === "online";
  const isPaid = order.paymentStatus === "paid";
  const grandTotal = order.pricing?.grandTotal || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) {
      setError("Please check the confirmation box to proceed with cancellation.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        reason: reason === "Other" && customNote ? customNote : reason,
        note: customNote,
      };

      const res = await cancelOrderApi(order._id || order.id, payload, token);
      if (res?.success) {
        onSuccess(res.data, res.message);
        onClose();
      } else {
        setError(res?.error?.message || res?.message || "Failed to cancel order.");
      }
    } catch (err) {
      setError(err?.message || "Error submitting cancellation request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-ivory-light border border-blush rounded-2xl shadow-xl overflow-hidden text-burgundy">
        {/* Header */}
        <div className="p-5 border-b border-blush flex items-center justify-between bg-blush-light/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-rose/15 text-rose flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-burgundy">
                Cancel Order #{order.orderNumber}
              </h3>
              <p className="text-[11px] text-burgundy/70">
                Self-service cancellation for unfulfilled orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-blush flex items-center justify-center text-burgundy/60 hover:text-burgundy transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-rose text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* Refund Notice based on Payment Mode */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#C6A75E]/40 text-burgundy space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-xs text-[#1F2A44]">
              <ShieldCheck className="w-4 h-4 text-[#C6A75E]" />
              <span>Refund & Policy Notice</span>
            </div>
            {isPrepaid && isPaid ? (
              <p className="text-[11px] text-burgundy/80 leading-relaxed">
                As this is a prepaid order, ₹{grandTotal.toLocaleString("en-IN")} will be refunded back to your original payment method via <strong>Razorpay</strong>. The gateway settles funds within <strong>3 to 5 business days</strong>.
              </p>
            ) : isPrepaid ? (
              <p className="text-[11px] text-burgundy/80 leading-relaxed">
                Online payment was pending or uncaptured. The order will be cancelled and reserved inventory will be restored immediately without any charge.
              </p>
            ) : (
              <p className="text-[11px] text-burgundy/80 leading-relaxed">
                As this is a <strong>Cash on Delivery (COD)</strong> order, no payment was collected. Your order will be cancelled immediately and no reverse payout is required.
              </p>
            )}
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-burgundy block">
              Reason for Cancellation <span className="text-rose">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-blush bg-white text-burgundy text-xs focus:outline-none focus:ring-1 focus:ring-rose"
            >
              {CANCELLATION_REASONS.map((r, i) => (
                <option key={i} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-burgundy block">
              Additional Details <span className="font-normal text-burgundy/60">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Tell our atelier concierge how we can improve..."
              className="w-full p-2.5 rounded-xl border border-blush bg-white text-burgundy text-xs focus:outline-none focus:ring-1 focus:ring-rose resize-none"
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className="pt-2">
            <label className="flex items-start space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-blush text-burgundy focus:ring-rose cursor-pointer"
              />
              <span className="text-[11px] text-burgundy/85 leading-normal">
                I confirm that I wish to permanently cancel Order #{order.orderNumber} and understand that released handcrafted inventory cannot be guaranteed if reordered later.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-blush">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-pill border border-blush text-xs font-semibold hover:bg-blush-light transition-colors"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={submitting || !confirmed}
              className="px-5 py-2 rounded-pill bg-rose text-ivory-light text-xs font-semibold hover:bg-burgundy disabled:opacity-50 transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
