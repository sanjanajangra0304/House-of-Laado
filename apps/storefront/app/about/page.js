import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { brand } from "@/config/brand";

export default function AboutPage() {
  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: "About Our Atelier" }]} />

        <div className="my-6 text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Our Story
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-burgundy mb-4">
            Preserving 400 Years of Rajasthani Hand-Block Artistry
          </h1>
          <p className="text-sm text-burgundy/85 leading-relaxed font-sans">
            Born in the historic craft belt of Jaipur, {brand.name} was founded with a singular conviction: that authentic Indian handlooms deserve to be celebrated, accessible, and worn every single day.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden aspect-[16/9] mb-12 border border-blush shadow-md">
          <img
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80"
            alt="Jaipur block print artisan workshop"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-burgundy/85 leading-relaxed font-sans mb-12">
          <div className="space-y-3 bg-blush-light p-6 rounded-2xl border border-blush">
            <h3 className="font-serif text-lg font-bold text-burgundy">
              🌿 Pure Fabrics, Never Polyester
            </h3>
            <p>
              We exclusively use 100% pure mulmul cotton, cambric cotton, and chanderi silks. In a market flooded with synthetic poly-crepes that trap body heat, our breathable fabrics allow skin to stay cool, crisp, and comfortable.
            </p>
          </div>

          <div className="space-y-3 bg-blush-light p-6 rounded-2xl border border-blush">
            <h3 className="font-serif text-lg font-bold text-burgundy">
              🎨 Sustainable Woodblock Printing
            </h3>
            <p>
              Each wooden printing block is hand-chiseled from seasoned sheesham or teakwood. Our dyemasters use mineral-rich river water and plant-based vegetable pigments, carrying forward ancestral knowledge handed down through generations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
