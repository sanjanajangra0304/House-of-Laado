import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { brand } from "@/config/brand";

export default function ShippingPolicyPage() {
  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: "Shipping Policy" }]} />

        <div className="my-6">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Customer Care
          </span>
          <h1 className="font-serif text-3xl font-bold text-burgundy mb-4">
            Shipping & Delivery Policy
          </h1>
        </div>

        <div className="space-y-6 text-sm text-burgundy/85 leading-relaxed font-sans">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">1. Order Processing Time</h2>
            <p>
              All orders are inspected and dispatched directly from our Jaipur workshop within 24 to 48 business hours of order confirmation. For custom or festive pre-orders, dispatch timelines are mentioned on the respective product page.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">2. Delivery Timelines Across India</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Metros & Tier 1 Cities (Delhi, Mumbai, Bengaluru, etc.):</strong> 3 to 5 business days.</li>
              <li><strong>Tier 2 & Tier 3 Cities:</strong> 5 to 7 business days.</li>
              <li><strong>Remote & North-Eastern regions:</strong> 7 to 10 business days.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">3. Shipping Charges</h2>
            <p>
              We provide <strong>FREE express delivery across India</strong> on all orders above ₹{brand.freeShippingThreshold || 999}. For orders below ₹{brand.freeShippingThreshold || 999}, a nominal shipping fee of ₹{brand.defaultShippingFee || 99} is applicable.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">4. Cash on Delivery (COD)</h2>
            <p>
              Cash on Delivery is supported across 25,000+ Indian pincodes. Please ensure a valid phone number is provided during checkout for delivery OTP verification.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">5. Tracking Your Shipment</h2>
            <p>
              As soon as your parcel is handed over to our courier partners (Delhivery / Blue Dart), you will receive a tracking link via SMS and email. You can also track your shipment anytime on our <a href="/track-order" className="text-rose font-semibold hover:text-burgundy underline">Track Order</a> page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
