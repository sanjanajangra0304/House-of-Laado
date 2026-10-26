"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { onProductImageError, onSecondaryImageError, DEFAULT_PRODUCT_FALLBACK } from "@/lib/image-fallback";
import { getColorHex } from "@/lib/colorHelper";

export function ProductCard({ product }) {
  const { toggleWishlist, isWishlisted, addToCart } = useCart();

  const availableColors = useMemo(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const map = new Map();
      product.variants.forEach((v) => {
        const col = (v.color || "").trim();
        if (!col) return;
        if (!map.has(col)) {
          const found = (product.colors || []).find(
            (c) => (c.name || "").toLowerCase() === col.toLowerCase()
          );
          map.set(col, {
            name: col,
            hex: found?.hex || getColorHex(col),
            stock: 0,
          });
        }
        map.get(col).stock += Math.max(0, (Number(v.stock) || 0) - (Number(v.reservedStock) || 0));
      });
      return Array.from(map.values());
    }
    if (Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors.map((c) => ({
        name: c.name || "Default",
        hex: c.hex || getColorHex(c.name || "Default"),
        stock: product.stock ?? 20,
      }));
    }
    return [];
  }, [product]);

  const [selectedColor, setSelectedColor] = useState(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const inStock = product.variants.find((v) => (Number(v.stock) || 0) > 0);
      if (inStock && inStock.color) return inStock.color.trim();
      return (product.variants[0].color || "").trim() || null;
    }
    return product.colors?.[0]?.name || null;
  });

  const [isHovered, setIsHovered] = useState(false);
  const [showQuickSizes, setShowQuickSizes] = useState(false);
  const wishlisted = isWishlisted(product.id);

  const availableSizes = useMemo(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const matched = product.variants.filter(
        (v) => (v.color || "").trim().toLowerCase() === (selectedColor || "").trim().toLowerCase()
      );
      const pool = matched.length > 0 ? matched : product.variants;
      const inStockSizes = pool
        .filter((v) => Math.max(0, (Number(v.stock) || 0) - (Number(v.reservedStock) || 0)) > 0)
        .map((v) => v.size);
      return inStockSizes.length > 0 ? inStockSizes : pool.map((v) => v.size);
    }
    return product.sizes?.length ? product.sizes : ["XS", "S", "M", "L", "XL", "XXL"];
  }, [product.variants, selectedColor, product.sizes]);

  const isSoldOut = product.isSoldOut || (
    Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants.every((v) => Number(v.stock) <= 0)
      : (product.stock !== undefined && product.stock <= 0)
  );

  return (
    <div
      className="group relative bg-white border border-blush rounded-card overflow-hidden transition-all duration-300 hover:border-rose hover:shadow-lg flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQuickSizes(false);
      }}
    >
      {/* Product Image Area with Dual Hover Swap */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand/20">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          {/* Primary Front Image */}
          <img
            src={product.primaryImage || DEFAULT_PRODUCT_FALLBACK}
            alt={product.name}
            onError={onProductImageError}
            className={`w-full h-full object-cover transition-all duration-700 ease-out ${
              isHovered && product.secondaryImage
                ? "opacity-0 scale-105"
                : "opacity-100 scale-100"
            }`}
          />

          {/* Secondary Detail/Back Image (Cross-fades on hover) */}
          {product.secondaryImage && (
            <img
              src={product.secondaryImage}
              alt={`${product.name} back view`}
              onError={onSecondaryImageError}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                isHovered
                  ? "opacity-100 scale-105"
                  : "opacity-0 scale-100"
              }`}
            />
          )}
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {isSoldOut ? (
            <Badge variant="soldout">Sold Out</Badge>
          ) : (
            <>
              {product.isNew && <Badge variant="new">New</Badge>}
              {product.compareAtPrice && product.compareAtPrice > product.sellingPrice && (
                <Badge variant="sale">
                  {product.discountPercent ? `${product.discountPercent}% Off` : "Sale"}
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border border-blush/40 ${
            wishlisted
              ? "bg-rose text-ivory-light shadow-md"
              : "bg-ivory-light/90 backdrop-blur-sm text-burgundy hover:bg-rose hover:text-ivory-light shadow-sm"
          }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`w-4 h-4 ${wishlisted ? "fill-ivory-light" : ""}`}
          />
        </button>

        {/* Quick Add Overlay */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 transition-all duration-300 transform opacity-0 group-hover:opacity-100">
          {isSoldOut ? (
            <div className="w-full py-2 px-3 bg-ivory-light/95 text-burgundy/70 text-xs font-serif font-medium rounded-pill shadow-md flex items-center justify-center space-x-1.5 backdrop-blur-sm border border-blush select-none">
              <span>Sold Out</span>
            </div>
          ) : !showQuickSizes ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowQuickSizes(true);
              }}
              className="w-full py-2 px-3 bg-ivory-light/95 hover:bg-burgundy hover:text-ivory-light text-burgundy text-xs font-serif font-semibold rounded-pill shadow-md flex items-center justify-center space-x-1.5 backdrop-blur-sm transition-all active:scale-95 border border-blush group/btn"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-rose group-hover/btn:text-ivory-light transition-colors" />
              <span>+ Quick Add</span>
            </button>
          ) : (
            <div
              className="w-full p-2 bg-ivory-light/95 backdrop-blur-md rounded-2xl shadow-lg border border-blush flex flex-wrap items-center justify-center gap-1.5"
              onClick={(e) => e.preventDefault()}
            >
              <span className="w-full text-[10px] text-burgundy/85 text-center uppercase tracking-wider font-semibold">
                Select Size
              </span>
              {availableSizes.map((sz) => (
                <button
                  key={sz}
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart(product, sz, selectedColor);
                    setShowQuickSizes(false);
                  }}
                  className="px-2 py-1 min-w-[28px] text-[11px] font-semibold bg-blush-light hover:bg-burgundy hover:text-ivory-light rounded-md transition-colors text-burgundy border border-blush/40"
                >
                  {sz}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Details Area */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Rating Widget */}
          {product.rating && (
            <div className="flex items-center space-x-1 mb-1">
              <div className="flex text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
              </div>
              <span className="text-[11px] font-semibold text-burgundy">
                {product.rating}
              </span>
              <span className="text-[11px] text-burgundy/50">
                ({product.reviewsCount})
              </span>
            </div>
          )}

          {/* Title */}
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="font-serif text-sm font-semibold text-burgundy line-clamp-1 group-hover:text-rose transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Fabric Subtitle */}
          <p className="text-[11px] text-burgundy/85 mt-0.5 line-clamp-1">
            {product.fabric}
          </p>
        </div>

        {/* Price & Swatches row */}
        <div className="mt-2.5 pt-2 border-t border-blush/40">
          <div className="flex items-baseline space-x-2">
            <span className="font-serif text-sm sm:text-base font-bold text-rose">
              ₹{product.sellingPrice}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-burgundy/50 line-through">
                ₹{product.compareAtPrice}
              </span>
            )}
            {product.discountPercent && (
              <span className="text-[11px] font-semibold text-olive">
                ({product.discountPercent}% Off)
              </span>
            )}
          </div>

          {/* Circular Color Swatches (19px circles matching Jaipur Loom) */}
          {availableColors.length > 0 && (
            <div className="flex items-center space-x-1.5 mt-2">
              {availableColors.map((c) => {
                const isSelected = selectedColor === c.name;
                const isOutOfStock = c.stock <= 0;
                return (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    title={isOutOfStock ? `${c.name} (Sold Out)` : c.name}
                    className={`w-[19px] h-[19px] rounded-full transition-all relative p-0.5 border ${
                      isSelected
                        ? "border-burgundy scale-110 shadow-sm"
                        : isOutOfStock
                        ? "border-stone-300 opacity-40 hover:border-stone-400"
                        : "border-blush hover:border-rose"
                    }`}
                  >
                    <span
                      className="block w-full h-full rounded-full"
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
