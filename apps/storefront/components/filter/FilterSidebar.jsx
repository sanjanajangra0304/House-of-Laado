"use client";

import { X } from "lucide-react";

export function FilterSidebar({
  selectedCategory,
  onSelectCategory,
  selectedSize,
  onSelectSize,
  selectedPriceRange,
  onSelectPriceRange,
  selectedFabric,
  onSelectFabric,
  onResetFilters,
  categoriesList = [],
  fabricsList = [],
}) {
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const priceRanges = [
    { label: "All Prices", value: "all" },
    { label: "Under ₹999", value: "under-999" },
    { label: "₹1,000 - ₹1,999", value: "1000-1999" },
    { label: "₹2,000 - ₹2,999", value: "2000-2999" },
    { label: "₹3,000 & Above", value: "3000-plus" },
  ];

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedSize !== "all" ||
    selectedPriceRange !== "all" ||
    selectedFabric !== "all";

  return (
    <aside className="w-full space-y-6">
      {/* Header & Reset Action */}
      <div className="flex items-center justify-between pb-3 border-b border-blush">
        <h3 className="font-serif font-bold text-burgundy text-base">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs text-rose font-semibold hover:text-burgundy hover:underline flex items-center space-x-1"
          >
            <span>Reset All</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      {categoriesList.length > 0 && (
        <div className="space-y-2.5 pb-5 border-b border-blush/60">
          <h4 className="font-serif font-semibold text-xs tracking-wider uppercase text-burgundy">
            Category
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <button
              onClick={() => onSelectCategory("all")}
              className={`w-full text-left text-xs py-1 px-2 rounded-lg transition-colors flex justify-between ${
                selectedCategory === "all"
                  ? "bg-rose text-ivory-light font-medium"
                  : "text-burgundy/80 hover:text-burgundy hover:bg-blush-light"
              }`}
            >
              <span>All Categories</span>
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                className={`w-full text-left text-xs py-1 px-2 rounded-lg transition-colors flex justify-between ${
                  selectedCategory === cat.slug
                    ? "bg-rose text-ivory-light font-medium"
                    : "text-burgundy/80 hover:text-burgundy hover:bg-blush-light"
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Pills Filter */}
      <div className="space-y-2.5 pb-5 border-b border-blush/60">
        <h4 className="font-serif font-semibold text-xs tracking-wider uppercase text-burgundy">
          Size
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSelectSize("all")}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
              selectedSize === "all"
                ? "bg-burgundy text-ivory-light border-burgundy shadow-sm"
                : "border-blush text-burgundy/80 hover:border-burgundy hover:text-burgundy"
            }`}
          >
            All
          </button>
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => onSelectSize(s)}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                selectedSize === s
                  ? "bg-burgundy text-ivory-light border-burgundy shadow-sm"
                  : "border-blush text-burgundy/80 hover:border-burgundy hover:text-burgundy"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-2.5 pb-5 border-b border-blush/60">
        <h4 className="font-serif font-semibold text-xs tracking-wider uppercase text-burgundy">
          Price Range
        </h4>
        <div className="space-y-1.5">
          {priceRanges.map((range) => (
            <label
              key={range.value}
              className="flex items-center space-x-2 text-xs text-burgundy/80 hover:text-burgundy cursor-pointer py-0.5"
            >
              <input
                type="radio"
                name="price_range"
                value={range.value}
                checked={selectedPriceRange === range.value}
                onChange={() => onSelectPriceRange(range.value)}
                className="accent-rose w-3.5 h-3.5"
              />
              <span className={selectedPriceRange === range.value ? "font-semibold text-burgundy" : ""}>
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Fabric Filter */}
      {fabricsList.length > 0 && (
        <div className="space-y-2.5 pb-4">
          <h4 className="font-serif font-semibold text-xs tracking-wider uppercase text-burgundy">
            Fabric
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            <button
              onClick={() => onSelectFabric("all")}
              className={`w-full text-left text-xs py-1 px-2 rounded-lg transition-colors ${
                selectedFabric === "all"
                  ? "bg-blush-light text-burgundy font-semibold"
                  : "text-burgundy/80 hover:text-burgundy hover:bg-blush-light"
              }`}
            >
              All Fabrics
            </button>
            {fabricsList.map((f) => (
              <button
                key={f}
                onClick={() => onSelectFabric(f)}
                className={`w-full text-left text-xs py-1 px-2 rounded-lg transition-colors truncate ${
                  selectedFabric === f
                    ? "bg-blush-light text-burgundy font-semibold"
                    : "text-burgundy/80 hover:text-burgundy hover:bg-blush-light"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
