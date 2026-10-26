"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { Search as SearchIcon } from "lucide-react";
import Link from "next/link";

const SYNONYMS = {
  kurti: "kurta",
  kurtis: "kurtas",
  suit: "suit set",
  suits: "suit sets",
  anarkali: "suit sets",
  coord: "co-ord",
  coords: "co-ord sets",
  dupatta: "suit sets",
  bag: "bags",
  tote: "bags",
  dress: "dresses",
};

function expandSearchQuery(input) {
  if (!input) return "";
  const words = input.toLowerCase().trim().split(/\s+/);
  const expanded = [...words];
  for (const w of words) {
    if (SYNONYMS[w] && !expanded.includes(SYNONYMS[w])) {
      expanded.push(SYNONYMS[w]);
    }
  }
  return expanded.join(" ");
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const expandedQuery = expandSearchQuery(query);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const endpoint = expandedQuery.trim()
          ? `${apiUrl}/products?search=${encodeURIComponent(expandedQuery.trim())}&limit=24`
          : `${apiUrl}/products?limit=24`;

        const res = await fetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled) {
            setResults(
              (json.data || []).map((p) => ({
                ...p,
                id: p._id || p.id,
                category: p.categorySlug || p.category?.name || "Ethnic Wear",
                isNew: p.isNewArrival ?? p.isNew,
              }))
            );
          }
        } else {
          if (!isCancelled) setResults([]);
        }
      } catch (err) {
        if (!isCancelled) setResults([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-fluid mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[{ label: "Search Results" }]} />

        {/* Search Input Box */}
        <div className="max-w-xl mx-auto my-6 sm:my-10 text-center">
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-burgundy mb-4">
            Search Our Catalog
          </h1>

          <div className="relative">
            <input
              type="text"
              placeholder="Search suit sets, kurtas, bags, mulmul cotton..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-10 rounded-pill border border-blush text-sm text-burgundy placeholder:text-burgundy/50 focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose shadow-sm bg-blush-light"
            />
            <SearchIcon className="w-5 h-5 text-burgundy/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-burgundy/70 hover:text-burgundy p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-burgundy/80">
            <span className="font-semibold text-burgundy">Trending:</span>
            {["Anarkali", "Pure Cotton", "Suit Sets", "Tote Bags", "Kurtas", "Co-ord Sets"].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-2.5 py-1 rounded-pill bg-blush-light border border-blush hover:bg-blush text-burgundy transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count Header */}
        <div className="flex items-center justify-between pb-4 border-b border-blush mb-6">
          <p className="text-xs sm:text-sm text-burgundy/85">
            Found <span className="font-bold text-burgundy">{results.length}</span> results for &ldquo;{query || "All Products"}&rdquo;
          </p>
        </div>

        {/* Results Grid */}
        {results.length === 0 ? (
          <div className="bg-blush-light border border-blush rounded-2xl p-12 text-center my-8">
            <h3 className="font-serif text-lg font-bold text-burgundy mb-2">
              No products found matching &ldquo;{query}&rdquo;
            </h3>
            <p className="text-xs text-burgundy/80 max-w-md mx-auto mb-6">
              Check your spelling or explore our bestselling hand-block printed ethnic suits.
            </p>
            <Link href="/shop" className="btn-primary text-xs">
              View All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted">Loading search results...</div>}>
      <SearchContent />
    </Suspense>
  );
}
