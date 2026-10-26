import { Suspense } from "react";
import { OrderSuccessClient } from "@/components/order/OrderSuccessClient";

export const metadata = {
  title: "Order Confirmed | House of Laado",
  description: "Your Indian ethnic clothing order has been confirmed successfully.",
};

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-sm text-stone-500">
          Loading order confirmation...
        </div>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  );
}
