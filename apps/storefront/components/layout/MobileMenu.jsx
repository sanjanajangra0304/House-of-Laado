"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories } from "@/data/categories";
import { brand } from "@/config/brand";
import { X, ChevronDown, ChevronRight, Phone, Mail, User, Sparkles } from "lucide-react";
import { handleShopNowClick } from "@/lib/auth-helpers";

export function MobileMenu({ isOpen, onClose }) {
  const router = useRouter();
  const [expandedCats, setExpandedCats] = useState({});

  if (!isOpen) return null;

  const toggleExpand = (catId) => {
    setExpandedCats((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-burgundy/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Menu Drawer */}
      <div className="relative z-10 w-[85%] max-w-sm bg-ivory-light h-full shadow-2xl flex flex-col transform transition-transform duration-300 border-r border-blush">
        {/* Top Header */}
        <div className="p-4 border-b border-blush flex items-center justify-between bg-ivory">
          <Link href="/" onClick={onClose} className="flex items-center space-x-2.5">
            {brand.logo?.imageUrl && (
              <img
                src={brand.logo.imageUrl}
                alt={brand.name}
                className="w-9 h-9 object-contain rounded-full border border-blush/60 bg-ivory-light"
              />
            )}
            <span className="font-serif text-lg font-bold text-burgundy">
              {brand.name}
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-burgundy/70 hover:text-rose transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link
            href="/"
            onClick={onClose}
            className="block py-2.5 px-3 rounded-lg text-sm font-serif font-semibold text-burgundy hover:bg-blush-light hover:text-rose transition-colors"
          >
            Home
          </Link>

          <button
            type="button"
            onClick={() => {
              onClose();
              handleShopNowClick(router, "/shop");
            }}
            className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-serif font-semibold text-[#1F2A44] bg-[#FAF7F2] border border-[#C6A75E]/30 hover:bg-blush-light hover:text-rose transition-colors flex items-center justify-between shadow-xs"
          >
            <span className="flex items-center">
              <Sparkles className="w-4 h-4 text-[#C6A75E] mr-2" />
              Shop Now
            </span>
            <span className="text-xs text-rose font-sans font-bold">Catalog →</span>
          </button>

          {categories.map((cat) => {
            const hasSub = cat.subcategories && cat.subcategories.length > 0;
            const isExpanded = !!expandedCats[cat.id];

            return (
              <div key={cat.id} className="border-b border-blush/40 last:border-0">
                <div className="flex items-center justify-between py-2.5 px-3">
                  <Link
                    href={`/collections/${cat.slug}`}
                    onClick={onClose}
                    className={`font-serif text-sm font-semibold ${
                      cat.isSale ? "text-rose" : "text-burgundy hover:text-rose"
                    }`}
                  >
                    {cat.name}
                  </Link>

                  {hasSub && (
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="p-1 text-burgundy/70 hover:text-rose"
                      aria-label="Toggle category"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Subcategories Accordion */}
                {hasSub && isExpanded && (
                  <div className="pl-5 pr-2 py-2 space-y-3 bg-blush-light rounded-lg my-1 border border-blush/40">
                    {cat.subcategories.map((sub) => (
                      <div key={sub.id} className="space-y-1.5">
                        <Link
                          href={`/collections/${sub.slug}`}
                          onClick={onClose}
                          className="font-serif text-xs font-bold text-rose block"
                        >
                          {sub.name}
                        </Link>
                        <ul className="space-y-1 pl-2">
                          {sub.items.map((item) => (
                            <li key={item.slug}>
                              <Link
                                href={`/collections/${item.slug}`}
                                onClick={onClose}
                                className="text-xs text-burgundy/85 hover:text-rose block py-0.5"
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 border-t border-blush mt-4 space-y-2">
            <Link
              href="/account"
              onClick={onClose}
              className="flex items-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium text-burgundy hover:bg-blush-light hover:text-rose"
            >
              <User className="w-4 h-4 text-rose" />
              <span>Login / My Account</span>
            </Link>
          </div>
        </div>

        {/* Footer Support Info */}
        <div className="p-4 border-t border-blush bg-ivory text-xs space-y-1.5 text-burgundy/85">
          <div className="flex items-center space-x-2">
            <Phone className="w-3.5 h-3.5 text-rose" />
            <a href={`tel:${brand.contact.phone}`} className="hover:text-rose">{brand.contact.phone}</a>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="w-3.5 h-3.5 text-rose" />
            <a href={`mailto:${brand.contact.email}`} className="hover:text-rose">{brand.contact.email}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
