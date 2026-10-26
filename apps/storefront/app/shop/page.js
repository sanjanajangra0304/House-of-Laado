"use client";

import { useState, useMemo, useEffect } from "react";
import { categories } from "@/data/categories";
import { fetchProducts } from "@/lib/api";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterSidebar } from "@/components/filter/FilterSidebar";
import { SortDropdown } from "@/components/filter/SortDropdown";
import { SlidersHorizontal, X, Loader2 } from "lucide-react";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedFabric, setSelectedFabric] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    fetchProducts({ limit: 100 })
      .then((res) => {
        if (res?.data) {
          const mapped = res.data.map((p) => ({
            ...p,
            id: p._id || p.id,
            categorySlug: p.categorySlug || p.category?.slug,
            primaryImage: p.primaryImage || p.images?.[0] || "",
            isNew: p.isNewArrival ?? p.isNew,
          }));
          setProducts(mapped);
        }
      })
      .catch((err) => console.error("Error loading catalog:", err))
      .finally(() => setLoading(false));
  }, []);

  // Extract unique fabrics from products
  const fabricsList = useMemo(() => {
    const set = new Set(products.map((p) => p.fabric).filter(Boolean));
    return Array.from(set);
  }, [products]);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== "all" && p.categorySlug !== selectedCategory) {
          return false;
        }
        // Size filter
        if (selectedSize !== "all" && (!p.sizes || !p.sizes.includes(selectedSize))) {
          return false;
        }
        // Fabric filter
        if (selectedFabric !== "all" && p.fabric !== selectedFabric) {
          return false;
        }
        // Price filter
        if (selectedPriceRange === "under-999" && p.sellingPrice >= 999) return false;
        if (
          selectedPriceRange === "1000-1999" &&
          (p.sellingPrice < 1000 || p.sellingPrice > 1999)
        )
          return false;
        if (
          selectedPriceRange === "2000-2999" &&
          (p.sellingPrice < 2000 || p.sellingPrice > 2999)
        )
          return false;
        if (selectedPriceRange === "3000-plus" && p.sellingPrice < 3000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.sellingPrice - b.sellingPrice;
        if (sortBy === "price-desc") return b.sellingPrice - a.sellingPrice;
        if (sortBy === "bestselling") return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return 0; // default featured
      });
  }, [products, selectedCategory, selectedSize, selectedPriceRange, selectedFabric, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedSize("all");
    setSelectedPriceRange("all");
    setSelectedFabric("all");
  };

  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-fluid mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Breadcrumbs items={[{ label: "All Products" }]} />

        {/* Page Title & Overview */}
        <div className="my-4 sm:my-6 pb-4 border-b border-blush">
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-burgundy mb-1">
            All Handcrafted Collections
          </h1>
          <p className="text-xs sm:text-sm text-burgundy/85 max-w-2xl">
            Explore our complete atelier collection of pure mulmul suit sets, breathable kurtas, tiered dresses, and artisanal accessories.
          </p>
        </div>

        {/* Top Controls Row */}
        <div className="flex items-center justify-between py-3 mb-6 bg-blush-light border border-blush/40 rounded-xl px-4">
          <div className="text-xs text-burgundy/80 font-medium">
            Showing <span className="font-bold text-burgundy">{filteredProducts.length}</span> of {products.length} items
          </div>

          <div className="flex items-center space-x-3">
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center space-x-1.5 h-9 px-3.5 rounded-pill border border-blush bg-ivory-light text-xs font-semibold text-burgundy shadow-sm hover:bg-blush transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>

            {/* Sort Dropdown */}
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {/* Layout: Sidebar + Product Grid */}
        <div className="flex gap-8 items-start">
          {/* Desktop Filter Sidebar (Left) */}
          <div className="hidden lg:block w-64 flex-shrink-0 sticky top-28 bg-ivory-light border border-blush rounded-2xl p-5 shadow-sm">
            <FilterSidebar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              selectedPriceRange={selectedPriceRange}
              onSelectPriceRange={setSelectedPriceRange}
              selectedFabric={selectedFabric}
              onSelectFabric={setSelectedFabric}
              onResetFilters={handleResetFilters}
              categoriesList={categories}
              fabricsList={fabricsList}
            />
          </div>

          {/* Product Grid Area (Right) */}
          <div className="flex-1">
            {loading ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-burgundy/70">
                <Loader2 className="w-8 h-8 animate-spin text-burgundy mb-3" />
                <p className="text-sm font-medium">Loading handcrafted collections from atelier...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-blush-light border border-blush rounded-2xl p-12 text-center my-8">
                <h3 className="font-serif text-lg font-bold text-burgundy mb-2">
                  No products matched your active filters
                </h3>
                <p className="text-xs text-burgundy/80 max-w-md mx-auto mb-6">
                  Try clearing your size, category, or price range filters to view our full collection.
                </p>
                <button onClick={handleResetFilters} className="btn-primary text-xs">
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-burgundy/60 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative z-10 w-[85%] max-w-sm bg-ivory-light h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-blush mb-4">
              <h3 className="font-serif font-bold text-lg text-burgundy">
                Filter Products
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-full text-burgundy/70 hover:text-burgundy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <FilterSidebar
              selectedCategory={selectedCategory}
              onSelectCategory={(c) => {
                setSelectedCategory(c);
                setIsMobileFilterOpen(false);
              }}
              selectedSize={selectedSize}
              onSelectSize={(s) => {
                setSelectedSize(s);
                setIsMobileFilterOpen(false);
              }}
              selectedPriceRange={selectedPriceRange}
              onSelectPriceRange={(p) => {
                setSelectedPriceRange(p);
                setIsMobileFilterOpen(false);
              }}
              selectedFabric={selectedFabric}
              onSelectFabric={(f) => {
                setSelectedFabric(f);
                setIsMobileFilterOpen(false);
              }}
              onResetFilters={() => {
                handleResetFilters();
                setIsMobileFilterOpen(false);
              }}
              categoriesList={categories}
              fabricsList={fabricsList}
            />
          </div>
        </div>
      )}
    </div>
  );
}
