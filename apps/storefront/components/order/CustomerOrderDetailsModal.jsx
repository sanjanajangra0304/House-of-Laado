"use client";

import React from "react";
import {
  Package,
  X,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export function CustomerOrderDetailsModal({ order, isOpen, onClose, onCancel, onReturn, onTrackRefund }) {
  if (!isOpen || !order) return null;

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusColors = {
    placed: "bg-blush-light text-burgundy border-blush",
    confirmed: "bg-olive/10 text-olive border-olive/30",
    packed: "bg-blush-light/60 text-burgundy border-blush",
    dispatched: "bg-olive/15 text-olive border-olive/30",
    delivered: "bg-olive/10 text-olive border-olive/20",
    cancelled: "bg-rose/10 text-rose border-rose/20",
    return_requested: "bg-rose/10 text-rose border-rose/30",
    returned: "bg-olive/10 text-olive border-olive/30",
  };

  const currentStatus = (order.orderStatus || order.status || "").toLowerCase();
  const isCancelled = currentStatus === "cancelled" || Boolean(order.cancellation?.cancelledAt);
  const isPrepaid = order.paymentMethod === "online";
  const isCancellable = ["placed", "confirmed"].includes(currentStatus) && !isCancelled;
  const isReturnable = currentStatus === "delivered";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-ivory-light border border-blush rounded-2xl shadow-xl overflow-hidden text-burgundy max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-blush flex items-center justify-between bg-blush-light/50 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1F2A44]/10 text-[#1F2A44] flex items-center justify-center">
              <Package className="w-4 h-4 text-[#1F2A44]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-base text-burgundy">
                  Order #{order.orderNumber}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-badge border uppercase tracking-wider ${
                    statusColors[order.orderStatus] || "bg-blush-light text-burgundy border-blush"
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>
              <p className="text-[11px] text-burgundy/70 mt-0.5">
                Placed on {orderDate}
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
          {/* Order Cancellation Banner if Cancelled */}
          {order.orderStatus === "cancelled" && (
            <div className="p-3.5 rounded-xl bg-rose/10 border border-rose/30 text-rose space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Order Cancelled</span>
              </div>
              <p className="text-[11px] text-rose/90 leading-relaxed">
                {order.cancellation?.reason || "This order was cancelled prior to dispatch."}
              </p>
              {order.cancellation?.refundAmount > 0 && (
                <p className="text-[11px] font-bold text-rose pt-0.5">
                  Refund of ₹{order.cancellation.refundAmount.toLocaleString("en-IN")} initiated (Status: {order.cancellation.refundStatus}).
                </p>
              )}
            </div>
          )}

          {/* Items Breakdown */}
          <div className="space-y-2.5">
            <h4 className="font-serif font-bold text-xs text-burgundy">
              Purchased Ensembles ({order.items?.length || 0})
            </h4>
            <div className="divide-y divide-blush border border-blush rounded-xl bg-white overflow-hidden">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="p-3 flex items-center space-x-3.5">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-18 object-cover rounded-lg border border-blush flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-serif text-xs font-semibold text-burgundy truncate">
                      {item.name}
                    </h5>
                    <p className="text-[11px] text-burgundy/70">
                      Size: <strong className="text-burgundy">{item.size}</strong> • Color: <strong className="text-burgundy">{item.color || "Default"}</strong>
                      {item.sku && ` • SKU: ${item.sku}`}
                    </p>
                    <p className="text-[11px] text-burgundy/60">
                      Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="font-serif font-bold text-xs text-burgundy">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & GST Breakdown */}
          <div className="p-4 rounded-xl bg-white border border-blush space-y-2">
            <h4 className="font-serif font-bold text-xs text-burgundy pb-1 border-b border-blush">
              Financial Summary
            </h4>
            <div className="space-y-1.5 text-xs text-burgundy/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{(order.pricing?.subtotal || 0).toLocaleString("en-IN")}</span>
              </div>
              {order.pricing?.discountAmount > 0 && (
                <div className="flex justify-between text-olive font-semibold">
                  <span>Promotional Coupon Discount</span>
                  <span>-₹{order.pricing.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>
                  {order.pricing?.shippingFee === 0 ? "FREE" : `₹${order.pricing?.shippingFee}`}
                </span>
              </div>
              {order.pricing?.codFee > 0 && (
                <div className="flex justify-between">
                  <span>Cash on Delivery Verification Fee</span>
                  <span>₹{order.pricing.codFee}</span>
                </div>
              )}
              {order.pricing?.gstBreakdown?.totalGst > 0 && (
                <div className="flex justify-between text-[11px] text-burgundy/60">
                  <span>Included GST (Taxes)</span>
                  <span>₹{order.pricing.gstBreakdown.totalGst.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between font-serif font-bold text-sm text-burgundy pt-2 border-t border-blush">
                <span>Total Amount</span>
                <span>₹{(order.pricing?.grandTotal || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address & Courier Tracking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-blush space-y-1 text-xs">
              <div className="flex items-center space-x-1 font-bold text-burgundy mb-1">
                <MapPin className="w-3.5 h-3.5 text-rose" />
                <span>Delivery Address</span>
              </div>
              <p className="font-semibold text-burgundy">{order.customerDetails?.fullName}</p>
              <p className="text-burgundy/80">{order.shippingAddress?.streetAddress}</p>
              <p className="text-burgundy/80">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                <strong className="text-burgundy">{order.shippingAddress?.pincode}</strong>
              </p>
              <p className="text-burgundy/70 pt-0.5">Contact: {order.customerDetails?.phone}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-blush space-y-1 text-xs">
              <div className="flex items-center space-x-1 font-bold text-burgundy mb-1">
                <Truck className="w-3.5 h-3.5 text-olive" />
                <span>Logistics & Dispatch</span>
              </div>
              <p className="text-burgundy/80">
                Courier: <strong>{order.tracking?.courierName || "Delhivery Express"}</strong>
              </p>
              {order.tracking?.trackingNumber ? (
                <p className="text-burgundy/80 font-mono">
                  AWB: <strong>{order.tracking.trackingNumber}</strong>
                </p>
              ) : (
                <p className="text-burgundy/60 text-[11px]">AWB assigned upon packing</p>
              )}
              <p className="text-burgundy/80">
                Payment: <strong>{order.paymentMethod?.toUpperCase()}</strong> ({order.paymentStatus})
              </p>
            </div>
          </div>

          {/* Order Status History Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-xs text-burgundy">
                Atelier Fulfillment History
              </h4>
              <div className="border border-blush rounded-xl bg-white p-3 space-y-2.5">
                {order.statusHistory.map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-burgundy mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-burgundy capitalize">{step.status}</span>
                        <span className="text-[10px] text-burgundy/60">
                          {new Date(step.changedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {step.note && <p className="text-[11px] text-burgundy/70 mt-0.5">{step.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-blush flex flex-wrap items-center justify-between gap-2 bg-blush-light/30 flex-shrink-0">
          <div className="flex items-center space-x-2">
            {isCancellable && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCancel(order);
                }}
                className="px-4 py-2 rounded-pill border border-rose/40 text-rose hover:bg-rose hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel Order
              </button>
            )}
            {isReturnable && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReturn(order);
                }}
                className="px-4 py-2 rounded-pill bg-olive text-ivory-light hover:bg-burgundy text-xs font-semibold transition-colors"
              >
                Return / Exchange
              </button>
            )}
            {["return_requested", "returned"].includes(order.orderStatus) && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTrackRefund(order);
                }}
                className="px-4 py-2 rounded-pill border border-burgundy text-burgundy hover:bg-burgundy hover:text-ivory-light text-xs font-semibold transition-colors"
              >
                View Return / Refund Status
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-pill bg-burgundy text-ivory-light text-xs font-semibold hover:bg-olive transition-colors ml-auto"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
