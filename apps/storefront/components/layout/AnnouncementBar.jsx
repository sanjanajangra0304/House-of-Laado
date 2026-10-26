"use client";

import { useState, useEffect } from "react";
import { brand } from "@/config/brand";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const announcements = brand.announcements;

  useEffect(() => {
    if (!announcements.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [announcements.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  return (
    <div className="bg-burgundy text-ivory-light text-[12px] sm:text-[13px] py-2 px-4 transition-colors font-sans select-none border-b border-burgundy-dark">
      <div className="max-w-fluid mx-auto flex items-center justify-between">
        {/* Left: Welcome text + Social Links (Matching reference topbar) */}
        <div className="hidden lg:flex items-center space-x-3 text-ivory-light">
          <span className="font-normal text-ivory-light">Welcome you to {brand.name}</span>
          <div className="flex items-center space-x-2 pl-2 border-l border-blush/30">
            <a
              href={brand.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blush transition-colors"
              aria-label={`Follow ${brand.name} on Instagram`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </div>

        {/* Center: Sliding Promo Ticker with navigation arrows */}
        <div className="flex-1 flex items-center justify-center space-x-2.5 px-2">
          <button
            onClick={handlePrev}
            className="text-ivory-light hover:text-blush transition-colors p-0.5 cursor-pointer"
            aria-label="Previous announcement"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
          <div className="text-center font-medium min-h-[18px] flex items-center justify-center transition-all duration-300">
            <span className="tracking-wide text-ivory-light">{announcements[currentIndex]}</span>
          </div>
          <button
            onClick={handleNext}
            className="text-ivory-light hover:text-blush transition-colors p-0.5 cursor-pointer"
            aria-label="Next announcement"
          >
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Right: Country / Currency Selector (Matching reference: India (INR ₹)) */}
        <div className="hidden lg:flex items-center space-x-2 text-ivory-light text-[12px]">
          <span className="font-medium tracking-normal opacity-95">India (INR ₹)</span>
        </div>
      </div>
    </div>
  );
}
