import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, default: "" },
    price: { type: Number, required: true },
    size: { type: String, required: true },
    color: { type: String, default: "Default" },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isTestOrder: {
      type: Boolean,
      default: false,
      index: true,
    },
    customerDetails: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    shippingAddress: {
      streetAddress: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    items: [orderItemSchema],
    pricing: {
      subtotal: { type: Number, required: true },
      discountAmount: { type: Number, default: 0 },
      shippingFee: { type: Number, default: 0 },
      codFee: { type: Number, default: 0 },
      gstBreakdown: {
        gst5: { type: Number, default: 0 },
        gst12: { type: Number, default: 0 },
        totalGst: { type: Number, default: 0 },
      },
      grandTotal: { type: Number, required: true },
    },
    gstin: { type: String, default: "" },
    deliveryInstructions: { type: String, default: "" },
    paymentMethod: {
      type: String,
      enum: ["online", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
      index: true,
    },
    razorpayDetails: {
      orderId: { type: String, default: null },
      paymentId: { type: String, default: null },
      signature: { type: String, default: null },
    },
    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "packed", "dispatched", "delivered", "cancelled", "return_requested", "returned"],
      default: "placed",
      index: true,
    },
    cancellation: {
      type: {
        reason: { type: String, default: "" },
        cancelledBy: { type: String, default: "" },
        cancelledAt: { type: Date, default: null },
        refundId: { type: String, default: null },
        refundAmount: { type: Number, default: 0 },
        refundStatus: {
          type: String,
          enum: ["not_applicable", "requested", "pending", "processed", "completed", "failed"],
          default: "not_applicable",
        },
      },
      default: null,
      _id: false,
    },
    returnRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReturnRequest",
      default: null,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
    tracking: {
      courierName: { type: String, default: "Delhivery Express" },
      trackingNumber: { type: String, default: "" },
      estimatedDelivery: { type: Date, default: null },
    },
    emailNotifications: {
      confirmationSent: { type: Boolean, default: false },
      confirmationSentAt: { type: Date, default: null },
      confirmationMessageId: { type: String, default: "" },
      cancellationSent: { type: Boolean, default: false },
      cancellationSentAt: { type: Date, default: null },
      lastError: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
