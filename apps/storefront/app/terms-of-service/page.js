import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { brand } from "@/config/brand";

export default function TermsOfServicePage() {
  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: "Terms of Service" }]} />

        <div className="my-6">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Legal Terms
          </span>
          <h1 className="font-serif text-3xl font-bold text-burgundy mb-4">
            Terms of Service
          </h1>
        </div>

        <div className="space-y-6 text-sm text-burgundy/85 leading-relaxed font-sans">
          <p>
            Welcome to {brand.name}. By accessing or purchasing from our store, you agree to be bound by these Terms of Service.
          </p>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">1. Handcrafted Variations</h2>
            <p>
              Our garments are handcrafted by artisans using wooden blocks and natural vegetable pigments. Minor variations in block placement or dye saturation are characteristic hallmarks of authentic handcrafting and should not be considered manufacturing defects.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">2. Pricing & Currency</h2>
            <p>
              All prices listed on our store are in Indian Rupees (INR ₹) and are inclusive of Goods & Services Tax (GST). We reserve the right to revise promotional discounts and catalog pricing at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-burgundy">3. Jurisdiction</h2>
            <p>
              Any disputes arising out of purchases or service agreements shall be subject to the exclusive jurisdiction of the competent courts in Jaipur, Rajasthan, India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
