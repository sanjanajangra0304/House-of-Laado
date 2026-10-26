import mongoose from "mongoose";

const inventoryReservationSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variantSize: {
      type: String,
      default: "Standard",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    checkoutSessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "expired"],
      default: "active",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL Index automatically deletes document when expiresAt is reached
    },
  },
  { timestamps: true }
);

export const InventoryReservation = mongoose.model(
  "InventoryReservation",
  inventoryReservationSchema
);
