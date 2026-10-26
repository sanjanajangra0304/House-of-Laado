import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerDetails: {
      fullName: { type: String, default: "" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: { type: String, required: true },
        sku: { type: String, default: "" },
        price: { type: Number, required: true },
        size: { type: String, required: true },
        color: { type: String, default: "Default" },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String, default: "" },
        exchangeSize: { type: String, default: null },
        exchangeColor: { type: String, default: null },
      },
    ],
    type: {
      type: String,
      enum: ["exchange", "return_refund"],
      default: "return_refund",
    },
    reason: {
      type: String,
      required: [true, "Reason for return or exchange is required"],
    },
    description: {
      type: String,
      default: "",
    },
    photos: {
      type: [String],
      default: [],
    },
    exchangeDetails: {
      requestedSize: { type: String, default: null },
      requestedColor: { type: String, default: null },
    },
    status: {
      type: String,
      enum: [
        "requested",
        "approved",
        "rejected",
        "pickup_scheduled",
        "item_received",
        "received_at_warehouse",
        "inspection_passed",
        "inspection_failed",
        "refund_processing",
        "completed",
      ],
      default: "requested",
      index: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, default: "customer" },
        note: { type: String, default: "" },
      },
    ],
    refundStatus: {
      type: String,
      enum: [
        "not_applicable",
        "requested",
        "approved",
        "processing",
        "completed",
        "rejected",
        "failed",
      ],
      default: "not_applicable",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    providerRefundId: {
      type: String,
      default: null,
    },
    refundDetails: {
      refundId: { type: String, default: "" },
      status: { type: String, default: "" },
    },
    decisionReason: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    stockRestored: {
      type: Boolean,
      default: false,
    },
    payoutDetails: {
      method: {
        type: String,
        enum: ["upi", "bank_transfer", "not_applicable"],
        default: "not_applicable",
      },
      upiId: { type: String, default: "" },
      bankAccountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      accountHolderName: { type: String, default: "" },
      payoutReference: { type: String, default: "" },
      processedAt: { type: Date, default: null },
      processedBy: { type: String, default: "" },
    },
    pickupTracking: {
      courierName: { type: String, default: "Delhivery Reverse" },
      trackingNumber: { type: String, default: "" },
      pickupScheduledDate: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
