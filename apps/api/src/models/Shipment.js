import mongoose from "mongoose";

const shipmentActivitySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    location: { type: String, default: "" },
    message: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
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
    courierName: {
      type: String,
      default: "Delhivery Express",
    },
    awbNumber: {
      type: String,
      default: "",
      index: true,
    },
    shiprocketShipmentId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "created",
        "pickup_scheduled",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "rto_initiated",
        "rto_delivered",
        "cancelled",
      ],
      default: "created",
      index: true,
    },
    labelUrl: {
      type: String,
      default: "",
    },
    invoiceUrl: {
      type: String,
      default: "",
    },
    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    activities: [shipmentActivitySchema],
  },
  { timestamps: true }
);

export const Shipment = mongoose.model("Shipment", shipmentSchema);
