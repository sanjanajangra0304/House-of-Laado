import Link from "next/link";
import { brand } from "@/config/brand";

export function StoryBlock() {
  return (
    <section className="py-14 sm:py-18 bg-blush-light border-y border-blush">
      <div className="max-w-container mx-auto px-6 lg:px-12 text-center">
        <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-2 font-sans">
          Heritage & Craftsmanship
        </span>

        <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-semibold text-burgundy mb-6 max-w-3xl mx-auto leading-tight tracking-[-0.034em]">
          Indian Ethnic Wear for Women
        </h2>

        <div className="max-w-3xl mx-auto space-y-4 text-xs sm:text-[15px] text-burgundy/85 leading-[1.714] font-sans">
          <p>
            Discover the charm of Jaipur-inspired fashion with {brand.name}. From comfortable cotton kurtis and elegant suit sets to stylish dresses and co-ord sets, our collection blends traditional Indian craftsmanship with modern designs.
          </p>
          <p>
            Looking to buy kurtis online in Jaipur? Explore our range of printed, straight and A-line kurtis, crafted for effortless everyday style. Whether it’s work, casual outings or festive occasions, find comfortable Indian ethnic wear for women made to look and feel beautiful.
          </p>
          <p className="font-semibold text-burgundy">
            Shop Jaipuri cotton suits, women&apos;s kurtis, ethnic dresses and more at {brand.name}.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/shop"
            className="btn-primary text-xs sm:text-sm py-3 px-8 shadow-md"
          >
            Explore House of Laado Collection →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 max-w-4xl mx-auto border-t border-blush/60 mt-12">
          <div>
            <span className="font-serif text-3xl sm:text-4xl font-bold text-rose block">
              100%
            </span>
            <span className="text-xs text-burgundy/85 font-medium uppercase tracking-wider mt-1 block">
              Pure Breathable Cotton
            </span>
          </div>

          <div>
            <span className="font-serif text-3xl sm:text-4xl font-bold text-rose block">
              400+
            </span>
            <span className="text-xs text-burgundy/85 font-medium uppercase tracking-wider mt-1 block">
              Years of Block Print Legacy
            </span>
          </div>

          <div>
            <span className="font-serif text-3xl sm:text-4xl font-bold text-rose block">
              25k+
            </span>
            <span className="text-xs text-burgundy/85 font-medium uppercase tracking-wider mt-1 block">
              Women Dressed Across India
            </span>
          </div>

          <div>
            <span className="font-serif text-3xl sm:text-4xl font-bold text-rose block">
              0%
            </span>
            <span className="text-xs text-burgundy/85 font-medium uppercase tracking-wider mt-1 block">
              Synthetic Harsh Chemicals
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
