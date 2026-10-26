import { Suspense } from "react";
import { TrackOrderClient } from "@/components/order/TrackOrderClient";

export const metadata = {
  title: "Track Order Status | House of Laado",
  description: "Check the real-time shipping and delivery status of your ethnic clothing order.",
};

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-sm text-stone-500">
          Loading order tracking...
        </div>
      }
    >
      <TrackOrderClient />
    </Suspense>
  );
}
