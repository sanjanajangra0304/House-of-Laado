import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { brand } from "@/config/brand";

export default function ExchangePolicyPage() {
  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: "Exchange & Returns Policy" }]} />

        <div className="my-6">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Customer Care
          </span>
          <h1 className="font-serif text-3xl font-bold text-burgundy mb-4">
            7-Day Exchange & Returns Policy
          </h1>
        </div>

        <div className="space-y-6 text-sm text-burgundy/85 leading-relaxed font-sans">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">1. 7-Day Doorstep Exchange Guarantee</h2>
            <p>
              We want you to love your purchase. If you experience any fit issues or wish to change sizes, we offer a seamless <strong>7-day doorstep exchange</strong> from the date of delivery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">2. Conditions for Exchange / Returns</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>The garment must be unused, unwashed, and in its original condition.</li>
              <li>All original brand tags, labels, and packaging must remain intact.</li>
              <li>Exchange requests must be submitted within 7 calendar days of parcel delivery.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">3. How to Initiate a Request</h2>
            <p>
              Simply email our care team at <a href={`mailto:${brand.contact.email}`} className="text-rose font-semibold hover:text-burgundy underline">{brand.contact.email}</a> or WhatsApp our support line at <a href={`https://wa.me/${brand.contact.whatsapp.replace(/[^0-9]/g, "")}`} className="text-rose font-semibold hover:text-burgundy underline">{brand.contact.phone}</a> with your Order ID and photo of the product. Our team will schedule reverse pickup from your address within 24-48 hours.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">4. Refund Processing</h2>
            <p>
              Once your returned item arrives at our Jaipur workshop and passes quality inspection, refunds are processed within 3 to 5 business days to your original payment method, or credited as store wallet credit based on your preference.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
