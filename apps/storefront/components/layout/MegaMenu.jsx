"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories } from "@/data/categories";
import { ChevronDown } from "lucide-react";
import { handleShopNowClick } from "@/lib/auth-helpers";

export function MegaMenu() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <nav className="hidden lg:block bg-ivory-light border-b border-blush sticky top-0 z-30 transition-shadow">
      <div className="max-w-fluid mx-auto px-6">
        <ul className="flex items-center justify-center space-x-8 text-sm font-serif">
          <li>
            <Link
              href="/"
              className="inline-block py-3.5 font-medium text-burgundy hover:text-rose transition-colors border-b-2 border-transparent hover:border-rose"
            >
              Home
            </Link>
          </li>

          <li>
            <button
              type="button"
              onClick={() => handleShopNowClick(router, "/shop")}
              className="inline-block py-3.5 font-medium text-burgundy hover:text-rose transition-colors border-b-2 border-transparent hover:border-rose cursor-pointer"
            >
              Shop Now
            </button>
          </li>

          {categories.map((cat) => {
            const hasSub = cat.subcategories && cat.subcategories.length > 0;
            const isSale = cat.isSale;
            const isFeatured = cat.isFeatured;

            return (
              <li
                key={cat.id}
                className="relative"
                onMouseEnter={() => hasSub && setActiveMenu(cat.id)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <Link
                  href={`/collections/${cat.slug}`}
                  className={`inline-flex items-center py-3.5 font-medium transition-colors border-b-2 border-transparent ${
                    isSale
                      ? "text-rose hover:text-burgundy font-semibold hover:border-rose"
                      : isFeatured
                      ? "text-rose hover:text-burgundy font-semibold hover:border-rose"
                      : "text-burgundy hover:text-rose hover:border-rose"
                  }`}
                >
                  <span>{cat.name}</span>
                  {hasSub && (
                    <ChevronDown className="w-3.5 h-3.5 ml-1 transition-transform duration-200 group-hover:rotate-180" />
                  )}
                </Link>

                {/* Dropdown Mega Menu for Categories with subcategories */}
                {hasSub && activeMenu === cat.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[850px] bg-ivory-light border border-blush shadow-2xl rounded-b-xl p-8 z-40 transition-all duration-200">
                    <div className="grid grid-cols-4 gap-6">
                      {/* Subcategory columns */}
                      <div className="col-span-3 grid grid-cols-3 gap-6">
                        {cat.subcategories.map((sub) => (
                          <div key={sub.id} className="space-y-2.5">
                            <Link
                              href={`/collections/${sub.slug}`}
                              className="font-semibold text-burgundy text-sm block hover:text-rose transition-colors border-b border-blush/60 pb-1"
                            >
                              {sub.name}
                            </Link>
                            <ul className="space-y-1.5 font-sans text-xs">
                              {sub.items.map((item) => (
                                <li key={item.slug}>
                                  <Link
                                    href={`/collections/${item.slug}`}
                                    className="text-burgundy/85 hover:text-rose hover:translate-x-1 inline-block transition-transform duration-150"
                                  >
                                    {item.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Featured image promo in dropdown */}
                      {cat.image && (
                        <div className="col-span-1 rounded-lg overflow-hidden border border-blush group">
                          <div className="aspect-[3/4] relative overflow-hidden bg-sand/30">
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(62,10,20,0.85)] via-[rgba(62,10,20,0.4)] to-transparent flex flex-col justify-end p-4 text-ivory-light">
                              <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-blush">
                                Explore Collection
                              </span>
                              <span className="font-serif font-semibold text-sm text-ivory-light">
                                {cat.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
