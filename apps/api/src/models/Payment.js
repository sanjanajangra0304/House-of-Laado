import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    method: {
      type: String,
      enum: ["upi", "card", "netbanking", "wallet", "cod", "other"],
      default: "upi",
    },
    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed", "refunded", "partially_refunded"],
      default: "created",
      index: true,
    },
    refunds: [
      {
        refundId: String,
        amount: Number,
        status: String,
        reason: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
