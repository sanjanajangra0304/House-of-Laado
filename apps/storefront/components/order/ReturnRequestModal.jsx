"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Truck,
  IndianRupee,
  Loader2,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { requestReturnApi, uploadImageApi } from "@/lib/api";

const RETURN_REASONS = [
  "Size is too small / tight fit",
  "Size is too large / loose fit",
  "Color differs from website photography",
  "Fabric or craftsmanship expectation",
  "Received defective or damaged garment",
  "Incorrect silhouette or size delivered",
  "Other",
];

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export function ReturnRequestModal({ order, isOpen, onClose, onSuccess }) {
  const [type, setType] = useState("return_refund"); // "return_refund" or "exchange"
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync state when order changes
  React.useEffect(() => {
    if (order) {
      setSelectedItems(
        (order.items || []).map((it) => ({
          product: it.product?._id || it.product || it.id,
          name: it.name,
          size: it.size,
          color: it.color || "Default",
          price: it.price,
          quantity: 1,
          maxQuantity: it.quantity,
          image: it.image,
          isSelected: true,
          exchangeSize: it.size,
          exchangeColor: it.color || "Default",
        }))
      );
      setAccountHolderName(order.customerDetails?.fullName || "");
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // Calculate delivery date and check 7-day window
  const RETURN_WINDOW_DAYS = 7;
  let deliveredDate = null;
  if (Array.isArray(order.statusHistory)) {
    const deliveredEntry = order.statusHistory.find((s) => s.status === "delivered");
    if (deliveredEntry?.changedAt) {
      deliveredDate = new Date(deliveredEntry.changedAt);
    }
  }
  if (!deliveredDate) {
    deliveredDate = new Date(order.updatedAt || order.createdAt);
  }

  const windowMs = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const isWindowExpired = Date.now() - deliveredDate.getTime() > windowMs;
  const isCod = order.paymentMethod === "cod";

  const handleToggleItem = (index) => {
    setSelectedItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, isSelected: !it.isSelected } : it))
    );
  };

  const handleQuantityChange = (index, qty) => {
    setSelectedItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, quantity: Math.max(1, Math.min(it.maxQuantity, Number(qty))) } : it
      )
    );
  };

  const handleExchangeSizeChange = (index, size) => {
    setSelectedItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, exchangeSize: size } : it))
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 3) {
      setError("Maximum 3 photo attachments permitted.");
      return;
    }

    setIsUploadingPhoto(true);
    setError("");

    try {
      const res = await uploadImageApi(file, "house_of_laado/returns");
      if (res?.data?.url || res?.url) {
        const uploadedUrl = res.data?.url || res.url;
        setPhotos((prev) => [...prev, uploadedUrl]);
      } else {
        setError("Could not upload photo. Please verify image format.");
      }
    } catch (err) {
      setError(err?.message || "Error uploading return photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Calculate estimated refund
  const activeSelected = selectedItems.filter((it) => it.isSelected);
  const selectedSubtotal = activeSelected.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const orderSubtotal = order.pricing?.subtotal || selectedSubtotal;
  const discountRatio = orderSubtotal > 0 ? (order.pricing?.discountAmount || 0) / orderSubtotal : 0;
  const estimatedRefund =
    type === "exchange"
      ? 0
      : Math.max(0, Math.round(selectedSubtotal * (1 - discountRatio)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeSelected.length === 0) {
      setError("Please select at least one item from the order to return or exchange.");
      return;
    }

    if (isCod && type === "return_refund") {
      if (payoutMethod === "upi" && !upiId.trim()) {
        setError("Please enter a valid UPI ID (e.g. yourname@okaxis) to receive your refund.");
        return;
      }
      if (payoutMethod === "bank_transfer" && (!bankAccountNumber.trim() || !ifscCode.trim())) {
        setError("Please provide complete bank account number and IFSC code for refund transfer.");
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        type,
        reason,
        description,
        photos,
        items: activeSelected.map((it) => ({
          product: it.product,
          quantity: it.quantity,
          exchangeSize: type === "exchange" ? it.exchangeSize : undefined,
          exchangeColor: type === "exchange" ? it.exchangeColor : undefined,
        })),
        payoutDetails:
          isCod && type === "return_refund"
            ? {
                method: payoutMethod,
                upiId: upiId.trim(),
                bankAccountNumber: bankAccountNumber.trim(),
                ifscCode: ifscCode.trim().toUpperCase(),
                accountHolderName: accountHolderName.trim(),
              }
            : undefined,
      };

      const res = await requestReturnApi(order._id || order.id, payload);
      if (res?.success) {
        onSuccess(res.data, res.message);
        onClose();
      } else {
        setError(res?.error?.message || res?.message || "Failed to submit return request.");
      }
    } catch (err) {
      setError(err?.message || "Error submitting return request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-ivory-light border border-blush rounded-2xl shadow-xl overflow-hidden text-burgundy max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-blush flex items-center justify-between bg-blush-light/50 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-olive/15 text-olive flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-olive" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-burgundy">
                Request Return or Exchange
              </h3>
              <p className="text-[11px] text-burgundy/70">
                Order #{order.orderNumber} • Delivered on {deliveredDate.toLocaleDateString("en-IN")}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {isWindowExpired ? (
            <div className="p-4 rounded-xl bg-rose/10 border border-rose/30 text-rose text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>7-Day Return Policy Expired</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                As per our 7-Day Doorstep Exchange Guarantee, return and exchange requests must be filed within 7 calendar days of delivery. For handcrafted repair or special fit assistance, please contact our Jaipur atelier concierge.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-olive/10 border border-olive/30 text-burgundy flex items-start space-x-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-olive flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">7-Day Doorstep Guarantee Active</span>
                <p className="text-[11px] text-burgundy/80 mt-0.5 leading-relaxed">
                  Garments must be unused, unwashed, with all original brand tags intact. Delhivery reverse pickup will be scheduled upon approval.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-rose text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* Type Selector (Return vs Exchange) */}
          <div className="space-y-1.5">
            <label className="font-bold text-burgundy block">Select Request Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("return_refund")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  type === "return_refund"
                    ? "bg-burgundy text-ivory-light border-burgundy shadow-xs"
                    : "bg-white text-burgundy border-blush hover:border-burgundy/40"
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Return for Refund</span>
              </button>
              <button
                type="button"
                onClick={() => setType("exchange")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  type === "exchange"
                    ? "bg-burgundy text-ivory-light border-burgundy shadow-xs"
                    : "bg-white text-burgundy border-blush hover:border-burgundy/40"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Size / Color Exchange</span>
              </button>
            </div>
          </div>

          {/* Select Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-burgundy block">
                Select Items to {type === "exchange" ? "Exchange" : "Return"}
              </label>
              <span className="text-[11px] text-burgundy/60">
                {activeSelected.length} of {selectedItems.length} selected
              </span>
            </div>

            <div className="divide-y divide-blush/60 border border-blush rounded-xl bg-white overflow-hidden">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="p-3 flex items-start space-x-3 hover:bg-ivory-light/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={item.isSelected}
                    onChange={() => handleToggleItem(idx)}
                    className="mt-1 rounded border-blush text-burgundy focus:ring-rose cursor-pointer"
                  />
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-16 object-cover rounded-md border border-blush flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-serif font-semibold text-xs text-burgundy truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-burgundy/70">
                      Ordered: Size {item.size} • Color: {item.color} • ₹{item.price}
                    </p>

                    {item.isSelected && (
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-burgundy/70 font-bold">Qty:</span>
                          <select
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                            className="h-7 px-2 rounded-lg border border-blush text-[11px] bg-white"
                          >
                            {Array.from({ length: item.maxQuantity }, (_, i) => i + 1).map((q) => (
                              <option key={q} value={q}>
                                {q}
                              </option>
                            ))}
                          </select>
                        </div>

                        {type === "exchange" && (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] text-burgundy/70 font-bold">New Size:</span>
                            <select
                              value={item.exchangeSize}
                              onChange={(e) => handleExchangeSizeChange(idx, e.target.value)}
                              className="h-7 px-2 rounded-lg border border-blush text-[11px] bg-white font-semibold"
                            >
                              {AVAILABLE_SIZES.map((sz) => (
                                <option key={sz} value={sz}>
                                  {sz}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="font-bold text-burgundy block">
              Reason <span className="text-rose">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-blush bg-white text-burgundy text-xs focus:outline-none focus:ring-1 focus:ring-rose"
            >
              {RETURN_REASONS.map((r, i) => (
                <option key={i} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-burgundy block">
              Concierge Notes <span className="font-normal text-burgundy/60">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us what felt off so we can tailor the exchange or improve..."
              className="w-full p-2.5 rounded-xl border border-blush bg-white text-burgundy text-xs focus:outline-none focus:ring-1 focus:ring-rose resize-none"
            />
          </div>

          {/* Photo Evidence Upload */}
          <div className="space-y-1.5">
            <label className="font-bold text-burgundy block">
              Attach Photos <span className="font-normal text-burgundy/60">(Optional, up to 3)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg border border-blush overflow-hidden group">
                  <img src={url} alt="Proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {photos.length < 3 && (
                <label className="w-16 h-16 rounded-lg border border-dashed border-blush hover:border-burgundy flex flex-col items-center justify-center cursor-pointer bg-white transition-colors">
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin text-burgundy" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-burgundy/60" />
                      <span className="text-[9px] text-burgundy/60 mt-0.5">Upload</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* COD Payout Details if COD & Return for Refund */}
          {isCod && type === "return_refund" && (
            <div className="p-4 rounded-xl bg-white border border-blush space-y-3">
              <div className="flex items-center space-x-1.5 font-bold text-xs text-burgundy">
                <IndianRupee className="w-4 h-4 text-olive" />
                <span>COD Refund Payout Details</span>
              </div>
              <p className="text-[11px] text-burgundy/70">
                Since this was a COD delivery, please supply your payout account details for safe refund settlement upon workshop inspection.
              </p>

              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="payoutMethod"
                    value="upi"
                    checked={payoutMethod === "upi"}
                    onChange={() => setPayoutMethod("upi")}
                    className="text-burgundy focus:ring-rose"
                  />
                  <span>UPI ID</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="payoutMethod"
                    value="bank_transfer"
                    checked={payoutMethod === "bank_transfer"}
                    onChange={() => setPayoutMethod("bank_transfer")}
                    className="text-burgundy focus:ring-rose"
                  />
                  <span>Bank Account</span>
                </label>
              </div>

              {payoutMethod === "upi" ? (
                <div>
                  <label className="text-[11px] font-bold block mb-1">UPI VPA Address</label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@okaxis or mobile@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-blush text-xs"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Name as on passbook"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-blush text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold block mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="Bank Account Number"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-blush text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SBIN0001234"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-blush text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Estimated Refund Summary */}
          {type === "return_refund" && (
            <div className="p-3.5 rounded-xl bg-blush-light border border-blush flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-burgundy block">Estimated Refund Amount</span>
                <span className="text-[10px] text-burgundy/60">
                  Calculated from selected item values and proportional promotional discounts
                </span>
              </div>
              <span className="font-serif font-bold text-base text-burgundy">
                ₹{estimatedRefund.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-blush">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-pill border border-blush text-xs font-semibold hover:bg-blush-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isWindowExpired || activeSelected.length === 0}
              className="px-5 py-2 rounded-pill bg-burgundy text-ivory-light text-xs font-semibold hover:bg-olive disabled:opacity-50 transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>Submit {type === "exchange" ? "Exchange" : "Return"} Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
