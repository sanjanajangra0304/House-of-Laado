import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["razorpay", "shiprocket", "other"],
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "ignored", "failed"],
      default: "pending",
      index: true,
    },
    errorDetails: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

webhookEventSchema.index({ provider: 1, eventType: 1, createdAt: -1 });

export const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);
