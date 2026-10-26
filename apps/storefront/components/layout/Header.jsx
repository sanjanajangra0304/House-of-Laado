"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { brand } from "@/config/brand";
import { useCart } from "@/lib/cart-context";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import { MegaMenu } from "./MegaMenu";

import { useRouter } from "next/navigation";

import { getApiBaseUrl } from "@/lib/api";

export function Header() {
  const router = useRouter();
  const { totalCount, wishlist, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSearch(true);
      try {
        const res = await fetch(`${getApiBaseUrl()}/products?search=${encodeURIComponent(searchQuery.trim())}&limit=6`);
        if (res.ok) {
          const json = await res.json();
          setSearchResults(
            (json.data || []).map((p) => ({
              ...p,
              id: p._id || p.id,
              category: p.categorySlug || p.category?.name || "Suit Sets",
            }))
          );
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="bg-ivory-light border-b border-blush sticky top-0 z-40">
        <div className="max-w-fluid mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-burgundy hover:text-rose transition-colors -ml-2"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-burgundy hover:text-rose transition-colors ml-1"
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex-1 lg:flex-initial text-center lg:text-left">
              <Link href="/" className="inline-flex items-center space-x-2.5 sm:space-x-3 group text-left">
                {brand.logo?.imageUrl && (
                  <img
                    src={brand.logo.imageUrl}
                    alt={brand.logo.alt || brand.name}
                    className="h-12 sm:h-16 w-12 sm:w-16 object-contain rounded-full shadow-xs border border-blush/60 bg-ivory-light transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div>
                  <span className="font-serif text-xl sm:text-2xl font-extrabold tracking-tight text-burgundy group-hover:text-rose transition-colors block leading-tight">
                    {brand.name}
                  </span>
                  <span className="block text-[9px] sm:text-[10px] tracking-wider uppercase font-sans text-rose font-medium mt-0.5">
                    {brand.tagline}
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Predictive Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Search pure cotton suit sets, kurtas, bags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full h-11 pl-11 pr-4 rounded-pill border border-blush text-sm text-burgundy placeholder:text-burgundy/50 focus:outline-none focus:ring-2 focus:ring-rose focus:border-rose transition-all duration-200 bg-white"
                />
                <Search className="w-4 h-4 text-burgundy/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-burgundy/60 hover:text-rose p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Desktop Live Search Dropdown */}
              {isSearchOpen && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-ivory-light border border-blush shadow-2xl rounded-xl p-4 z-50 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-blush text-xs text-burgundy/85">
                    <span>
                      {isLoadingSearch ? "Searching..." : `Matching Products (${searchResults.length})`}
                    </span>
                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="hover:text-rose font-medium"
                    >
                      Close
                    </button>
                  </div>

                  {searchResults.length === 0 ? (
                    <p className="text-sm text-muted py-4 text-center">
                      No products found matching &ldquo;{searchQuery}&rdquo;.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {searchResults.slice(0, 5).map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug}`}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-sand/30 transition-colors"
                        >
                          <img
                            src={p.primaryImage}
                            alt={p.name}
                            className="w-12 h-14 object-cover rounded border border-border"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-xs font-semibold text-dark truncate">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-muted-light">
                              {p.category} • {p.fabric}
                            </p>
                            <span className="font-bold text-xs text-dark">
                              ₹{p.sellingPrice}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Action Icons (Account, Wishlist, Cart) */}
            <div className="flex items-center space-x-3 sm:space-x-4">

              {/* Account / Login */}
              <Link
                href="/account"
                className="hidden sm:flex items-center text-burgundy hover:text-rose transition-colors p-1.5"
                aria-label="Account"
              >
                <User className="w-5 h-5 stroke-[1.8]" />
              </Link>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="flex items-center text-burgundy hover:text-rose transition-colors p-1.5 relative"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5 stroke-[1.8]" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose text-ivory-light text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Bag with Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center text-burgundy hover:text-rose transition-colors p-1.5 relative"
                aria-label="Open cart"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose text-ivory-light text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                    {totalCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Input Drawer (When toggled) */}
          {isSearchOpen && (
            <div className="lg:hidden pb-4 pt-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search suits, kurtas, bags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-pill border border-blush text-xs text-burgundy focus:outline-none focus:ring-2 focus:ring-rose focus:border-rose bg-white"
                />
                <Search className="w-4 h-4 text-burgundy/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Mobile Search Results */}
              {searchQuery.trim() && (
                <div className="mt-2 bg-ivory-light border border-blush shadow-lg rounded-xl p-3 max-h-60 overflow-y-auto">
                  {searchResults.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center space-x-2 py-2 border-b border-blush/40 last:border-0"
                    >
                      <img
                        src={p.primaryImage}
                        alt={p.name}
                        className="w-10 h-12 object-cover rounded border border-blush/40"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-xs font-semibold text-burgundy truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] font-bold text-rose">
                          ₹{p.sellingPrice}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Mega Menu Navigation */}
        <MegaMenu />
      </header>

      {/* Mobile Drawer Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
