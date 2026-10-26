"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!show) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 w-11 h-11 rounded-full bg-ivory-light/95 border border-blush shadow-lg text-burgundy hover:bg-rose hover:text-ivory hover:border-rose focus-visible:outline-2 focus-visible:outline-blush transition-all duration-300 flex items-center justify-center group active:scale-95 backdrop-blur-sm"
    >
      <ArrowUp className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}
