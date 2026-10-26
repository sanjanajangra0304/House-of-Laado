import Joi from "joi";

const orderItemSchema = Joi.object({
  product: Joi.string().required(),
  name: Joi.string().required(),
  sku: Joi.string().allow("").optional(),
  price: Joi.number().min(0).required(),
  size: Joi.string().required(),
  color: Joi.string().default("Default"),
  quantity: Joi.number().integer().min(1).required(),
  image: Joi.string().allow("").default("").optional(),
});

export const checkoutOrderSchema = Joi.object({
  customerDetails: Joi.object({
    fullName: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9+ -]{10,15}$/).required(),
  }).required(),
  shippingAddress: Joi.object({
    streetAddress: Joi.string().trim().min(5).required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).required().messages({
      "string.pattern.base": "Please provide a valid 6-digit Indian PIN code.",
    }),
  }).required(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  paymentMethod: Joi.string().valid("online", "cod").required(),
  couponCode: Joi.string().trim().uppercase().allow("").optional(),
  gstin: Joi.string().trim().uppercase().allow("").optional(),
  deliveryInstructions: Joi.string().trim().allow("").max(500).optional(),
});

export const verifyPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
});

export const updateStatusSchema = Joi.object({
  orderStatus: Joi.string().valid(
    "placed",
    "confirmed",
    "packed",
    "dispatched",
    "delivered",
    "cancelled",
    "return_requested",
    "returned"
  ).optional(),
  trackingNumber: Joi.string().trim().allow("").optional(),
  courierName: Joi.string().trim().allow("").optional(),
  note: Joi.string().trim().allow("").optional(),
});

export const cancelOrderSchema = Joi.object({
  reason: Joi.string().trim().max(300).allow("").optional(),
  note: Joi.string().trim().max(500).allow("").optional(),
});

export const returnOrderSchema = Joi.object({
  type: Joi.string().valid("exchange", "return_refund").default("return_refund"),
  reason: Joi.string().trim().min(3).max(500).required(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  photos: Joi.array().items(Joi.string().allow("")).max(5).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        exchangeSize: Joi.string().allow("", null).optional(),
        exchangeColor: Joi.string().allow("", null).optional(),
      })
    )
    .optional(),
  requestedSize: Joi.string().trim().allow("", null).optional(),
  requestedColor: Joi.string().trim().allow("", null).optional(),
  payoutDetails: Joi.object({
    method: Joi.string().valid("upi", "bank_transfer", "not_applicable").optional(),
    upiId: Joi.string().trim().allow("").optional(),
    bankAccountNumber: Joi.string().trim().allow("").optional(),
    ifscCode: Joi.string().trim().allow("").optional(),
    accountHolderName: Joi.string().trim().allow("").optional(),
  }).optional(),
});

export const adminUpdateReturnRequestSchema = Joi.object({
  status: Joi.string()
    .valid(
      "requested",
      "approved",
      "rejected",
      "pickup_scheduled",
      "item_received",
      "received_at_warehouse",
      "inspection_passed",
      "inspection_failed",
      "refund_processing",
      "completed"
    )
    .optional(),
  adminNotes: Joi.string().trim().max(1000).allow("").optional(),
  decisionReason: Joi.string().trim().max(1000).allow("").optional(),
  refundStatus: Joi.string()
    .valid("not_applicable", "requested", "approved", "processing", "completed", "rejected", "failed")
    .optional(),
  refundAmount: Joi.number().min(0).optional(),
  pickupTracking: Joi.object({
    courierName: Joi.string().allow("").optional(),
    trackingNumber: Joi.string().allow("").optional(),
    pickupScheduledDate: Joi.date().allow(null).optional(),
  }).optional(),
});

export const adminProcessRefundSchema = Joi.object({
  refundAmount: Joi.number().min(0).optional(),
  payoutReference: Joi.string().trim().allow("").optional(),
  notes: Joi.string().trim().allow("").optional(),
});
