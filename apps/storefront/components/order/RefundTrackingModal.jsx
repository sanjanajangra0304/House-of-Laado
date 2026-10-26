"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  X,
  CheckCircle2,
  Clock,
  Truck,
  IndianRupee,
  AlertCircle,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { fetchReturnRequestByIdApi } from "@/lib/api";

const RETURN_STAGES = [
  { key: "requested", label: "Requested", desc: "Submitted to atelier concierge" },
  { key: "approved", label: "Approved", desc: "Reverse pickup scheduled" },
  { key: "item_received", label: "Received", desc: "Arrived at Jaipur atelier" },
  { key: "inspection_passed", label: "Inspected", desc: "Quality checks passed" },
  { key: "completed", label: "Refunded", desc: "Settlement finalized" },
];

export function RefundTrackingModal({ returnRequest: initialRequest, order, isOpen, onClose }) {
  const [returnReq, setReturnReq] = useState(() => {
    if (initialRequest) return initialRequest;
    if (order?.cancellation?.cancelledAt || (order?.cancellation?.refundStatus && order.cancellation.refundStatus !== "not_applicable")) {
      return {
        _id: order.cancellation.refundId || `CAN-${order.orderNumber}`,
        requestId: order.cancellation.refundId || `CAN-${order.orderNumber}`,
        status: order.cancellation.refundStatus === "completed" ? "completed" : order.cancellation.refundStatus === "failed" ? "rejected" : order.cancellation.refundStatus === "processing" ? "refund_processing" : "requested",
        type: "cancellation_refund",
        refundAmount: order.cancellation.refundAmount || order.pricing?.grandTotal || 0,
        reason: order.cancellation.reason || "Customer order cancellation",
        refundDetails: {
          refundId: order.cancellation.refundId,
          status: order.cancellation.refundStatus,
        },
        createdAt: order.cancellation.cancelledAt || order.updatedAt,
        items: (order.items || []).map((it) => ({
          name: it.name,
          size: it.size,
          color: it.color || "Standard",
          quantity: it.quantity,
          price: it.price,
        })),
        order: order,
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRequest) {
      setReturnReq(initialRequest);
      // Refresh latest return request details if id exists
      const targetId = initialRequest._id || initialRequest.requestId;
      if (targetId && !targetId.startsWith("CAN-")) {
        fetchReturnRequestByIdApi(targetId)
          .then((res) => {
            if (res?.data) setReturnReq(res.data);
          })
          .catch(() => {});
      }
    } else if (order?.cancellation?.cancelledAt || (order?.cancellation?.refundStatus && order.cancellation.refundStatus !== "not_applicable")) {
      setReturnReq({
        _id: order.cancellation.refundId || `CAN-${order.orderNumber}`,
        requestId: order.cancellation.refundId || `CAN-${order.orderNumber}`,
        status: order.cancellation.refundStatus === "completed" ? "completed" : order.cancellation.refundStatus === "failed" ? "rejected" : order.cancellation.refundStatus === "processing" ? "refund_processing" : "requested",
        type: "cancellation_refund",
        refundAmount: order.cancellation.refundAmount || order.pricing?.grandTotal || 0,
        reason: order.cancellation.reason || "Customer order cancellation",
        refundDetails: {
          refundId: order.cancellation.refundId,
          status: order.cancellation.refundStatus,
        },
        createdAt: order.cancellation.cancelledAt || order.updatedAt,
        items: (order.items || []).map((it) => ({
          name: it.name,
          size: it.size,
          color: it.color || "Standard",
          quantity: it.quantity,
          price: it.price,
        })),
        order: order,
      });
    }
  }, [initialRequest, order]);

  if (!isOpen || !returnReq) return null;

  const isRejected = returnReq.status === "rejected";
  const isInspectionFailed = returnReq.status === "inspection_failed";
  const isExchange = returnReq.type === "exchange";
  const isCancellation = returnReq.type === "cancellation_refund";

  const getStageIndex = (status) => {
    switch (status) {
      case "requested":
        return 0;
      case "approved":
      case "pickup_scheduled":
        return 1;
      case "item_received":
      case "received_at_warehouse":
        return 2;
      case "inspection_passed":
      case "refund_processing":
        return 3;
      case "completed":
        return 4;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(returnReq.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-ivory-light border border-blush rounded-2xl shadow-xl overflow-hidden text-burgundy max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-blush flex items-center justify-between bg-blush-light/50 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1F2A44]/10 text-[#1F2A44] flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-[#1F2A44]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-burgundy">
                {isExchange
                  ? "Exchange Request Tracking"
                  : isCancellation
                  ? "Cancellation Refund Tracking"
                  : "Refund & Return Tracking"}
              </h3>
              <p className="text-[11px] text-burgundy/70 font-mono">
                Request ID: {returnReq.requestId || returnReq._id}
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

        {/* Content Body */}
        <div className="p-5 space-y-5 text-xs overflow-y-auto flex-1">
          {/* Status Alert Banner */}
          {isRejected ? (
            <div className="p-4 rounded-xl bg-rose/10 border border-rose/30 text-rose space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>Return Request Rejected</span>
              </div>
              <p className="text-[11px] text-rose/90 leading-relaxed">
                {returnReq.decisionReason ||
                  returnReq.adminNotes ||
                  "This request could not be accepted as garment condition criteria were not met."}
              </p>
            </div>
          ) : isInspectionFailed ? (
            <div className="p-4 rounded-xl bg-rose/10 border border-rose/30 text-rose space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>Atelier Inspection Not Passed</span>
              </div>
              <p className="text-[11px] text-rose/90 leading-relaxed">
                {returnReq.decisionReason ||
                  returnReq.adminNotes ||
                  "Garment arrived with missing brand tags or signs of wear. Our concierge will contact you."}
              </p>
            </div>
          ) : returnReq.status === "completed" ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isExchange ? "Exchange Completed" : "Refund Successfully Completed"}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {isExchange
                  ? "Your exchange item has been prepared and dispatched from our Jaipur workshop."
                  : `₹${(returnReq.refundAmount || 0).toLocaleString("en-IN")} has been finalized. ${
                      returnReq.providerRefundId
                        ? `Razorpay Refund ID: ${returnReq.providerRefundId}`
                        : returnReq.payoutDetails?.payoutReference
                        ? `Payout Transaction Ref: ${returnReq.payoutDetails.payoutReference}`
                        : "Credited to your original payment method."
                    }`}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-olive/10 border border-olive/30 text-burgundy space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">Current Status: {returnReq.status?.toUpperCase()}</span>
                <span className="text-[10px] text-burgundy/60 font-mono">
                  Refund: {returnReq.refundStatus?.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-burgundy/80 leading-relaxed">
                Reverse pickup is handled via Delhivery Express. Please ensure garments are packed securely with all original brand tags.
              </p>
            </div>
          )}

          {/* Visual Step Progress Tracker */}
          {!isRejected && !isInspectionFailed && (
            <div className="py-2">
              <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-blush z-0" />
                <div
                  className="absolute left-0 top-3.5 h-0.5 bg-burgundy z-0 transition-all duration-500"
                  style={{ width: `${(currentStageIndex / (RETURN_STAGES.length - 1)) * 100}%` }}
                />

                {RETURN_STAGES.map((stage, idx) => {
                  const isDone = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div key={stage.key} className="relative z-10 flex flex-col items-center text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          isDone
                            ? "bg-burgundy text-ivory-light ring-4 ring-ivory-light"
                            : "bg-blush text-burgundy/60"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 font-semibold ${
                          isCurrent ? "text-burgundy font-bold" : isDone ? "text-burgundy/80" : "text-burgundy/40"
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Request Details Grid */}
          <div className="p-4 rounded-xl bg-white border border-blush space-y-2.5">
            <h4 className="font-serif font-bold text-xs text-burgundy pb-1 border-b border-blush">
              Request Information
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-burgundy/60 block">Order Number</span>
                <span className="font-semibold">{returnReq.orderNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-burgundy/60 block">Request Date</span>
                <span className="font-semibold">
                  {new Date(returnReq.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-burgundy/60 block">Request Type</span>
                <span className="font-semibold capitalize">
                  {returnReq.type === "exchange" ? "Size / Color Exchange" : "Return for Refund"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-burgundy/60 block">
                  {isExchange ? "Exchange Status" : "Refund Amount"}
                </span>
                <span className="font-bold text-burgundy">
                  {isExchange ? "Garment Replacement" : `₹${(returnReq.refundAmount || 0).toLocaleString("en-IN")}`}
                </span>
              </div>
            </div>

            {returnReq.reason && (
              <div className="pt-2 border-t border-blush text-xs">
                <span className="text-[10px] text-burgundy/60 block">Reason Specified:</span>
                <p className="text-[11px] text-burgundy/80 font-medium italic mt-0.5">
                  &ldquo;{returnReq.reason}&rdquo;
                </p>
              </div>
            )}

            {returnReq.adminNotes && (
              <div className="pt-2 border-t border-blush text-xs bg-blush-light/50 p-2.5 rounded-lg">
                <span className="text-[10px] text-burgundy/60 block font-bold">Atelier Concierge Notes:</span>
                <p className="text-[11px] text-burgundy/80 mt-0.5">{returnReq.adminNotes}</p>
              </div>
            )}
          </div>

          {/* Items in this return */}
          {returnReq.items && returnReq.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-xs text-burgundy">
                Items Included in this Request ({returnReq.items.length})
              </h4>
              <div className="divide-y divide-blush border border-blush rounded-xl bg-white overflow-hidden">
                {returnReq.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center space-x-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-14 object-cover rounded-md border border-blush flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-xs text-burgundy truncate">{item.name}</p>
                      <p className="text-[10px] text-burgundy/70">
                        Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                      </p>
                      {item.exchangeSize && (
                        <p className="text-[10px] font-semibold text-olive">
                          Requested Replacement Size: {item.exchangeSize}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-xs text-burgundy">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reverse Pickup Guidance */}
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#C6A75E]/30 text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-[#1F2A44]">
              <Truck className="w-4 h-4 text-[#C6A75E]" />
              <span>Next Steps for Doorstep Pickup</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-burgundy/80">
              <li>Our reverse logistics partner (Delhivery) will arrive within 24-48 business hours.</li>
              <li>Please keep garments neatly folded in the original cotton packaging with all tags attached.</li>
              <li>Hand over the parcel to the pickup executive upon verifying the OTP or airway bill.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blush flex justify-end bg-blush-light/30 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-pill bg-burgundy text-ivory-light text-xs font-semibold hover:bg-olive transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
