import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, title, subtitle, actionText, actionHref }) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-burgundy/85">No products available in this selection.</p>
      </div>
    );
  }

  return (
    <section className="py-8 sm:py-12">
      {/* Section Header */}
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 pb-3 border-b border-blush">
          <div>
            {subtitle && (
              <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
                {subtitle}
              </span>
            )}
            {title && (
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy">
                {title}
              </h2>
            )}
          </div>

          {actionText && actionHref && (
            <a
              href={actionHref}
              className="text-xs font-serif font-semibold text-burgundy hover:text-rose transition-colors underline underline-offset-4 mt-2 sm:mt-0"
            >
              {actionText} →
            </a>
          )}
        </div>
      )}

      {/* Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
