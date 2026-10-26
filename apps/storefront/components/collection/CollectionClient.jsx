"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterSidebar } from "@/components/filter/FilterSidebar";
import { SortDropdown } from "@/components/filter/SortDropdown";
import { SlidersHorizontal, X, Check } from "lucide-react";
import Link from "next/link";

export function CollectionClient({ slug, categoryInfo, collectionProducts, categories }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL query parameters
  const [selectedSize, setSelectedSize] = useState(searchParams.get("size") || "all");
  const [selectedPriceRange, setSelectedPriceRange] = useState(searchParams.get("price") || "all");
  const [selectedFabric, setSelectedFabric] = useState(searchParams.get("fabric") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [apiProducts, setApiProducts] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSize !== "all") params.set("size", selectedSize);
    if (selectedPriceRange !== "all") params.set("price", selectedPriceRange);
    if (selectedFabric !== "all") params.set("fabric", selectedFabric);
    if (sortBy !== "featured") params.set("sort", sortBy);

    const queryString = params.toString();
    const newUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.replaceState(null, "", newUrl);

    // Fetch from API for server-side filtering
    const fetchFiltered = async () => {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const apiParams = new URLSearchParams();
        if (slug && slug !== "all") apiParams.set("category", slug);
        if (selectedSize !== "all") apiParams.set("size", selectedSize);
        if (selectedFabric !== "all") apiParams.set("fabric", selectedFabric);
        if (sortBy) apiParams.set("sort", sortBy);

        if (selectedPriceRange === "under-999") {
          apiParams.set("maxPrice", "999");
        } else if (selectedPriceRange === "1000-1999") {
          apiParams.set("minPrice", "1000");
          apiParams.set("maxPrice", "1999");
        } else if (selectedPriceRange === "2000-2999") {
          apiParams.set("minPrice", "2000");
          apiParams.set("maxPrice", "2999");
        } else if (selectedPriceRange === "3000-plus") {
          apiParams.set("minPrice", "3000");
        }

        const res = await fetch(`${apiUrl}/products?${apiParams.toString()}&limit=24`);
        if (res.ok) {
          const json = await res.json();
          setApiProducts(
            (json.data || []).map((p) => ({
              ...p,
              id: p._id || p.id,
              isNew: p.isNewArrival ?? p.isNew,
            }))
          );
        }
      } catch (e) {
        // Fallback to client collectionProducts
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiltered();
  }, [selectedSize, selectedPriceRange, selectedFabric, sortBy, slug, pathname]);

  const rawProducts = apiProducts !== null ? apiProducts : collectionProducts;

  const fabricsList = useMemo(() => {
    const set = new Set((collectionProducts || []).map((p) => p.fabric));
    return Array.from(set);
  }, [collectionProducts]);

  const filteredProducts = useMemo(() => {
    // If apiProducts is loaded, sorting & filtering are already server-side
    if (apiProducts !== null) return apiProducts;

    return (collectionProducts || [])
      .filter((p) => {
        if (selectedSize !== "all" && (!p.sizes || !p.sizes.includes(selectedSize))) return false;
        if (selectedFabric !== "all" && p.fabric !== selectedFabric) return false;
        if (selectedPriceRange === "under-999" && p.sellingPrice >= 999) return false;
        if (selectedPriceRange === "1000-1999" && (p.sellingPrice < 1000 || p.sellingPrice > 1999)) return false;
        if (selectedPriceRange === "2000-2999" && (p.sellingPrice < 2000 || p.sellingPrice > 2999)) return false;
        if (selectedPriceRange === "3000-plus" && p.sellingPrice < 3000) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc" || sortBy === "price_asc") return a.sellingPrice - b.sellingPrice;
        if (sortBy === "price-desc" || sortBy === "price_desc") return b.sellingPrice - a.sellingPrice;
        if (sortBy === "bestselling") return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
  }, [collectionProducts, apiProducts, selectedSize, selectedPriceRange, selectedFabric, sortBy]);

  const handleResetFilters = () => {
    setSelectedSize("all");
    setSelectedPriceRange("all");
    setSelectedFabric("all");
  };

  const hasActiveFilters = selectedSize !== "all" || selectedPriceRange !== "all" || selectedFabric !== "all";


  return (
    <>
      {/* Top Controls Row */}
      <div className="flex items-center justify-between py-3 mb-6 bg-blush-light border border-blush/40 rounded-xl px-4">
        <div className="text-xs text-burgundy/80 font-medium">
          Showing <span className="font-bold text-burgundy">{filteredProducts.length}</span> items
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center space-x-1.5 h-9 px-3.5 rounded-pill border border-blush bg-ivory-light text-xs font-semibold text-burgundy shadow-sm hover:bg-blush transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6 px-1">
          <span className="text-xs text-burgundy/80 font-medium">Active Filters:</span>
          {selectedSize !== "all" && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-ivory-light border border-blush rounded-pill text-xs font-semibold text-burgundy shadow-sm">
              <span>Size: {selectedSize}</span>
              <button onClick={() => setSelectedSize("all")} className="hover:text-rose ml-1 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedPriceRange !== "all" && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-ivory-light border border-blush rounded-pill text-xs font-semibold text-burgundy shadow-sm">
              <span>Price: {selectedPriceRange}</span>
              <button onClick={() => setSelectedPriceRange("all")} className="hover:text-rose ml-1 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedFabric !== "all" && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-ivory-light border border-blush rounded-pill text-xs font-semibold text-burgundy shadow-sm">
              <span>Fabric: {selectedFabric}</span>
              <button onClick={() => setSelectedFabric("all")} className="hover:text-rose ml-1 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="text-xs text-rose font-semibold hover:text-burgundy hover:underline ml-1 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid & Sidebar Layout */}
      <div className="flex gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 sticky top-28 bg-ivory-light border border-blush rounded-2xl p-5 shadow-sm">
          <FilterSidebar
            selectedCategory={slug}
            onSelectCategory={(c) => {
              if (c !== slug && c !== "all") {
                window.location.href = `/collections/${c}`;
              } else if (c === "all") {
                window.location.href = "/shop";
              }
            }}
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

        {/* Product Cards */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="bg-blush-light border border-blush rounded-2xl p-12 text-center my-8">
              <h3 className="font-serif text-lg font-bold text-burgundy mb-2">
                No products found in this category
              </h3>
              <p className="text-xs text-burgundy/80 max-w-md mx-auto mb-6">
                Check out our complete shop collection or reset your active filters.
              </p>
              <div className="flex justify-center space-x-3">
                <button onClick={handleResetFilters} className="btn-outline text-xs">
                  Reset Filters
                </button>
                <Link href="/shop" className="btn-primary text-xs">
                  Browse All Products
                </Link>
              </div>
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
              selectedCategory={slug}
              onSelectCategory={(c) => {
                setIsMobileFilterOpen(false);
                if (c !== slug && c !== "all") {
                  window.location.href = `/collections/${c}`;
                } else if (c === "all") {
                  window.location.href = "/shop";
                }
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
    </>
  );
}
