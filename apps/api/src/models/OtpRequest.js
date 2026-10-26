import mongoose from "mongoose";

const otpRequestSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      trim: true,
      index: true,
      default: function () {
        return this.phone || this.email;
      },
      validate: {
        validator: function (v) {
          return Boolean(v || this.phone || this.email);
        },
        message: "Identifier (email or phone) is required",
      },
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["login", "checkout", "register", "password_reset", "forgot_password"],
      default: "checkout",
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: auto purge when expired
    },
  },
  {
    timestamps: true,
  }
);

otpRequestSchema.pre("validate", function (next) {
  if (!this.identifier) {
    this.identifier = this.phone || this.email;
  }
  next();
});

otpRequestSchema.index({ identifier: 1, purpose: 1, isVerified: 1 });
otpRequestSchema.index({ phone: 1, purpose: 1, isVerified: 1 });

export const OtpRequest = mongoose.model("OtpRequest", otpRequestSchema);
