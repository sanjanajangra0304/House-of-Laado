"use client";

import Image from "next/image";
import Link from "next/link";

export function PromoBanner() {
  return (
    <section
      className="relative w-full overflow-hidden my-8 sm:my-14 bg-[#FAF7F2] border-y border-[#E8DCC8]/60"
      aria-label="House of Laado Short Kurtis Collection"
    >
      <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:h-[540px] flex items-center">
        {/* Responsive Background Banner Image */}
        <Image
          src="/banners/short-kurtis-banner.png"
          alt="House of Laado Handcrafted Short Kurtis Collection — Effortless Style"
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1920px"
          className="object-cover object-[78%_center] sm:object-[68%_center] md:object-center pointer-events-none"
        />

        {/* Soft Cream & Antique Gold Gradient Overlay for Crystal Clear Legibility */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/95 via-[#FAF7F2]/85 via-50% to-[#FAF7F2]/10 sm:from-[#FAF7F2]/95 sm:via-[#FAF7F2]/75 sm:via-45% sm:to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Mobile Extra Soft Backdrop Filter for Compact Screens */}
        <div
          className="absolute inset-0 bg-[#FAF7F2]/40 sm:hidden pointer-events-none"
          aria-hidden="true"
        />

        {/* Content Container (Real Responsive Elements) */}
        <div className="relative z-10 max-w-container mx-auto px-6 sm:px-12 w-full py-8 sm:py-12">
          <div className="max-w-xl">
            {/* Antique-Gold Brand Crest & Label */}
            <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
              <span className="h-px w-6 sm:w-10 bg-[#C5A059]" />
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A059]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C12.5 5 14.5 7.5 17 8.5C14 9.5 12.5 12 12 15C11.5 12 10 9.5 7 8.5C9.5 7.5 11.5 5 12 2Z" />
                <circle cx="12" cy="18" r="1.5" />
                <circle cx="8.5" cy="12.5" r="1.2" />
                <circle cx="15.5" cy="12.5" r="1.2" />
              </svg>
              <span className="h-px w-6 sm:w-10 bg-[#C5A059]" />
            </div>

            <span className="block font-sans text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#C5A059] uppercase mb-2">
              House of Laado
            </span>

            {/* Main Headline */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[46px] font-bold leading-[1.12] mb-3 sm:mb-4 tracking-[-0.034em]">
              <span className="block text-[#1B2A4A]">Short Kurtis</span>
              <span className="block text-[#7B1123] font-serif">
                Effortless Style
              </span>
            </h2>

            {/* Description Subtitle */}
            <p className="font-sans text-xs sm:text-sm md:text-base text-[#1B2A4A]/85 max-w-md mb-6 sm:mb-7 leading-relaxed font-normal">
              Light, breezy and beautifully crafted — perfect for your everyday moments.
            </p>

            {/* Responsive Shop Now CTA Button linking to product listing route */}
            <div className="mb-7 sm:mb-8">
              <Link
                href="/collections/tops-short-kurtis"
                id="hero-short-kurtis-cta"
                className="inline-flex items-center justify-center font-serif font-semibold text-xs sm:text-sm px-7 sm:px-8 py-3 sm:py-3.5 rounded-pill shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer bg-[#C5A059] hover:bg-[#B38C44] text-[#1B2A4A] group border border-[#B38C44]/30"
                aria-label="Shop Short Kurtis Collection"
              >
                <span>Shop Now</span>
                <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>

            {/* Feature Badges: Premium Cotton | Comfort All Day | Stylish & Versatile */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 pt-3 border-t border-[#C5A059]/30 max-w-lg">
              {/* Feature 1 */}
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FAF7F2] border border-[#C5A059]/50 flex items-center justify-center text-[#7B1123] shrink-0 shadow-xs">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5-2 .5-3.5 2.2-3.5 4.5 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.3-1.5-4-3.5-4.5 1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z" />
                  </svg>
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#1B2A4A] font-sans">
                  Premium Cotton
                </span>
              </div>

              <span className="hidden sm:inline-block w-px h-5 bg-[#C5A059]/35" aria-hidden="true" />

              {/* Feature 2 */}
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FAF7F2] border border-[#C5A059]/50 flex items-center justify-center text-[#7B1123] shrink-0 shadow-xs">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#1B2A4A] font-sans">
                  Comfort All Day
                </span>
              </div>

              <span className="hidden sm:inline-block w-px h-5 bg-[#C5A059]/35" aria-hidden="true" />

              {/* Feature 3 */}
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FAF7F2] border border-[#C5A059]/50 flex items-center justify-center text-[#7B1123] shrink-0 shadow-xs">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#1B2A4A] font-sans">
                  Stylish &amp; Versatile
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
