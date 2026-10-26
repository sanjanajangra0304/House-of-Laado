import Link from "next/link";
import { categoryShortcuts } from "@/data/categories";

export function CategoryShortcuts() {
  return (
    <section className="py-8 sm:py-12 bg-ivory-light">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Curated For You
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy">
            Shop By Category
          </h2>
        </div>

        {/* Circular Category Tiles */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4 md:gap-6 justify-center">
          {categoryShortcuts.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group flex flex-col items-center text-center transition-transform duration-200"
            >
              {/* Circular Image Container */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-blush group-hover:border-rose p-0.5 transition-all duration-300 shadow-sm group-hover:shadow-md">
                <div className="w-full h-full rounded-full overflow-hidden bg-sand/20">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {cat.badge && (
                  <span className="absolute -top-1 -right-1 bg-rose text-ivory-light text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow">
                    {cat.badge}
                  </span>
                )}
              </div>

              {/* Category Label */}
              <span className="font-serif text-xs sm:text-sm font-semibold text-burgundy mt-2.5 group-hover:text-rose transition-colors text-center line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
