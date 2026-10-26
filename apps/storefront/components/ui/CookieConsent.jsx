"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { brand } from "@/config/brand";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("laado_cookie_consent") || localStorage.getItem("vastra_cookie_consent");
      if (!consent) {
        // Show after small delay so user doesn't get overwhelmed instantly
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Storage access blocked or restricted
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("laado_cookie_consent", "accepted");
    } catch (e) {}
    setIsVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("laado_cookie_consent", "essential_only");
    } catch (e) {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-16 lg:bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-ivory-light/95 backdrop-blur-md border border-blush shadow-2xl rounded-2xl p-4 sm:p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-burgundy font-serif font-semibold text-sm">
          <Cookie className="w-4 h-4 text-rose" />
          <span>We respect your privacy</span>
        </div>
        <button
          onClick={handleDecline}
          aria-label="Dismiss cookie notice"
          className="text-burgundy/70 hover:text-burgundy p-1 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-burgundy/85 leading-relaxed mb-4 font-sans">
        {brand.name} uses essential and analytics cookies to secure your shopping cart, remember your preferences, and offer you an authentic handloom experience in compliance with India&apos;s DPDP Act. Learn more in our{" "}
        <Link href="/privacy-policy" className="text-rose underline font-medium hover:text-burgundy">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={handleAccept}
          className="flex-1 bg-rose text-ivory text-xs font-medium py-2.5 px-4 rounded-pill hover:bg-burgundy transition-all shadow-sm active:scale-95 focus-visible:outline-2 focus-visible:outline-blush"
        >
          Accept All
        </button>
        <button
          onClick={handleDecline}
          className="bg-transparent border border-burgundy text-burgundy text-xs font-medium py-2.5 px-3 rounded-pill hover:bg-burgundy hover:text-ivory transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-blush"
        >
          Essential Only
        </button>
      </div>
    </div>
  );
}
