import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { brand } from "@/config/brand";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: "Privacy Policy" }]} />

        <div className="my-6">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Legal & Compliance
          </span>
          <h1 className="font-serif text-3xl font-bold text-burgundy mb-4">
            Privacy Policy
          </h1>
        </div>

        <div className="space-y-6 text-sm text-burgundy/85 leading-relaxed font-sans">
          <p>
            At {brand.name}, we value your privacy and are committed to protecting your personal data in full compliance with the Digital Personal Data Protection (DPDP) Act, 2023.
          </p>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">1. Information We Collect</h2>
            <p>
              When you purchase or browse our store, we collect necessary contact information (name, delivery address, email, phone number) to process your order and provide delivery tracking updates. We do not store sensitive payment card or UPI credential details—all payments are securely encrypted through Razorpay.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">2. How We Use Your Data</h2>
            <p>
              Your data is solely used to dispatch orders, notify you of parcel milestones, and provide customer support. We never sell or rent your personal information to third-party marketing brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">3. Contacting the Grievance Officer</h2>
            <p>
              If you have any questions or wish to request data correction or erasure, please contact our support team at <a href={`mailto:${brand.contact.email}`} className="text-rose font-semibold hover:text-burgundy underline">{brand.contact.email}</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
