import Link from "next/link";
import { trendingCollections } from "@/data/collections";

export function TrendingCollections() {
  return (
    <section className="py-12 sm:py-16 bg-ivory-light">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Artisan Curation
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-burgundy">
            Top Trending Collections
          </h2>
        </div>

        {/* 3-Column Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {trendingCollections.map((col) => (
            <div
              key={col.id}
              className="group relative rounded-2xl overflow-hidden border border-blush shadow-md hover:shadow-xl transition-all duration-300 bg-blush-light flex flex-col"
            >
              {/* Image with zoom on hover */}
              <div className="relative aspect-[3/4] overflow-hidden bg-sand/30">
                <img
                  src={col.image}
                  alt={col.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Soft Burgundy Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(62,10,20,0.85)] via-[rgba(62,10,20,0.4)] to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-ivory-light">
                  <span className="text-xs font-sans uppercase tracking-widest text-blush font-semibold mb-1">
                    {col.subtitle}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold mb-4 text-ivory-light leading-snug">
                    {col.title}
                  </h3>

                  <div>
                    <Link
                      href={col.href}
                      className="btn-dark-band text-xs sm:text-sm px-6 py-2.5 shadow"
                    >
                      {col.cta} →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
