"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { Heart, ShoppingBag } from "lucide-react";

export default function WishlistPage() {
  const { wishlist } = useCart();

  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-fluid mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[{ label: "My Wishlist" }]} />

        <div className="my-6 pb-4 border-b border-blush flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy">
              My Saved Styles
            </h1>
            <p className="text-xs sm:text-sm text-burgundy/85 mt-1">
              You have {wishlist.length} item{wishlist.length === 1 ? "" : "s"} saved in your personal wishlist.
            </p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-blush-light border border-blush rounded-2xl p-12 sm:p-16 text-center my-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-ivory-light border border-blush flex items-center justify-center mx-auto mb-4 text-rose shadow-sm">
              <Heart className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-burgundy mb-2">
              Your wishlist is currently empty
            </h3>
            <p className="text-xs sm:text-sm text-burgundy/85 mb-6 leading-relaxed">
              Explore our handcrafted Jaipur kurtas, suit sets, and festive styles, and tap the heart icon on any product to save your favorites here.
            </p>
            <Link href="/shop" className="btn-primary text-xs">
              Explore Best Sellers
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
