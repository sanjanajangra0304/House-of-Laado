import mongoose from "mongoose";

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["subscribed", "unsubscribed"],
      default: "subscribed",
      index: true,
    },
    source: {
      type: String,
      default: "footer_newsletter",
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
    welcomeEmailSent: {
      type: Boolean,
      default: false,
    },
    welcomeEmailSentAt: {
      type: Date,
      default: null,
    },
    welcomeDiscountCode: {
      type: String,
      default: "WELCOME10",
    },
  },
  { timestamps: true }
);

export const NewsletterSubscriber = mongoose.model(
  "NewsletterSubscriber",
  newsletterSubscriberSchema
);
