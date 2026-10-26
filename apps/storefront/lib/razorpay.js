import { brand } from "@/config/brand";

/**
 * Dynamically load Razorpay Standard Checkout SDK script
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      return resolve(false);
    }

    if (window.Razorpay) {
      return resolve(true);
    }

    const existingScript = document.getElementById("razorpay-checkout-script");
    if (existingScript) {
      if (window.Razorpay) return resolve(true);
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open real Razorpay Standard Checkout modal
 * Never simulates or auto-confirms payment.
 */
export async function openRazorpayCheckout({
  razorpayOrder,
  order,
  customerDetails,
  keyId: passedKeyId,
  onSuccess,
  onFailure,
}) {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    const err = new Error(
      "Razorpay Checkout SDK could not be loaded. Please check your internet connection and try again."
    );
    if (onFailure) onFailure(err);
    return;
  }

  const keyId = passedKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId || keyId.includes("placeholder")) {
    const err = new Error(
      "Razorpay Key ID is not configured. Please set a valid Razorpay test key in NEXT_PUBLIC_RAZORPAY_KEY_ID."
    );
    if (onFailure) onFailure(err);
    return;
  }

  if (!razorpayOrder || !razorpayOrder.id) {
    const err = new Error(
      "Online payment gateway could not create a valid payment session. Please retry or choose Cash on Delivery."
    );
    if (onFailure) onFailure(err);
    return;
  }

  const options = {
    key: keyId,
    amount: razorpayOrder.amount, // in paise
    currency: razorpayOrder.currency || "INR",
    name: brand.name || "House of Laado",
    description: `Order #${order.orderNumber} - Handcrafted Ethnic Wear`,
    image: "/logo.png",
    order_id: razorpayOrder.id,
    prefill: {
      name: customerDetails.fullName,
      email: customerDetails.email,
      contact: customerDetails.phone,
    },
    theme: {
      color: "#1F2A44", // House of Laado luxury navy
    },
    modal: {
      backdropclose: false,
      escape: true,
      handleback: true,
      ondismiss: function () {
        if (onFailure) {
          onFailure(
            new Error(
              "Online payment was closed or cancelled. Your bag items are saved and you can retry paying or select Cash on Delivery."
            )
          );
        }
      },
    },
    handler: function (response) {
      if (
        !response.razorpay_payment_id ||
        !response.razorpay_order_id ||
        !response.razorpay_signature
      ) {
        if (onFailure) {
          onFailure(
            new Error("Incomplete payment authentication details returned from Razorpay.")
          );
        }
        return;
      }

      onSuccess({
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
      });
    },
  };

  try {
    const rzpInstance = new window.Razorpay(options);
    rzpInstance.on("payment.failed", function (response) {
      const desc =
        response?.error?.description ||
        "Payment was declined by your bank or card issuer. Please try another payment method.";
      if (onFailure) {
        onFailure(new Error(`Payment failed: ${desc}`));
      }
    });
    rzpInstance.open();
  } catch (err) {
    if (onFailure) {
      onFailure(new Error(`Failed to open Razorpay Checkout: ${err.message}`));
    }
  }
}
