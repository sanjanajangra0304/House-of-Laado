"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { handleShopNowClick } from "@/lib/auth-helpers";

export function HeroCarousel() {
  const router = useRouter();
  const slides = [
    {
      id: 1,
      badge: "Handcrafted in Jaipur",
      title: "Authentic Jaipuri Handblock Prints & Suit Sets",
      subtitle: "Pure breathable mulmul cottons, intricate hand-block florals & effortless festive silhouettes.",
      cta: "Shop Now — Suit Sets",
      href: "/collections/suit-sets",
      image: "https://thejaipurloom.com/cdn/shop/files/WhatsApp_Image_2026-10-01_at_16.23.18.jpg",
      align: "left",
    },
    {
      id: 2,
      badge: "Indigo Edition '26",
      title: "Timeless Indigo Patches & Block-Print Co-ords",
      subtitle: "Hand-dyed artisanal cotton co-ord sets designed for all-day comfort and royal elegance.",
      cta: "Shop Now — Co-ord Sets",
      href: "/collections/lounge-co-ord-sets",
      image: "https://thejaipurloom.com/cdn/shop/files/INDIGO_PATCH_-_1.png",
      align: "center",
    },
    {
      id: 3,
      badge: "Festive Edit",
      title: "Regal Elegance in Pure Mulmul & Chanderi",
      subtitle: "Exquisite Anarkali suit sets, flared shararas and festive celebratory wear crafted by master artisans.",
      cta: "Shop Now — Festive Edit",
      href: "/collections/festive-edit",
      image: "https://thejaipurloom.com/cdn/shop/files/festiv8.jpg",
      align: "left",
    },
  ];


  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrent((prev) => (prev + 1) % slides.length);
    } else if (isRightSwipe) {
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div
      className="relative w-full h-[460px] sm:h-[560px] lg:h-[640px] overflow-hidden bg-sand/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Background Image with Gentle Soft Burgundy Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(62,10,20,0.75)] via-[rgba(62,10,20,0.45)] to-transparent z-10" />
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-7000 ease-out"
          />

          {/* Slide Text Content */}
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="max-w-container mx-auto px-6 sm:px-12 w-full">
              <div
                className={`max-w-2xl text-ivory-light ${
                  slide.align === "center" ? "mx-auto text-center" : "text-left"
                }`}
              >
                <span className="inline-block px-3.5 py-1 rounded-pill bg-ivory-light/20 backdrop-blur-md text-ivory-light text-xs font-semibold uppercase tracking-widest mb-3 sm:mb-4 border border-blush/30">
                  {slide.badge}
                </span>

                <h1
                  className="font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.15] mb-3 sm:mb-4 drop-shadow-md text-ivory-light tracking-[-0.034em]"
                  style={{ color: "#FBF5E4" }}
                >
                  {slide.title}
                </h1>

                <p className="font-sans text-sm sm:text-base lg:text-lg text-ivory-light/95 mb-6 sm:mb-8 font-normal drop-shadow leading-relaxed">
                  {slide.subtitle}
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => handleShopNowClick(router, slide.href)}
                    className="btn-primary px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base shadow-xl inline-flex items-center cursor-pointer transition-transform hover:scale-[1.02]"
                  >
                    <span>{slide.cta}</span>
                    <span className="ml-2">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Prev / Next Slide Arrows */}
      <button
        onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-ivory-light/85 hover:bg-ivory-light text-burgundy shadow-md transition-all duration-200 cursor-pointer border border-blush/40"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-ivory-light/85 hover:bg-ivory-light text-burgundy shadow-md transition-all duration-200 cursor-pointer border border-blush/40"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === current ? "w-8 bg-ivory-light" : "w-2 bg-ivory-light/50 hover:bg-ivory-light/80"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
