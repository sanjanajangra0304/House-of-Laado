import { brand } from "@/config/brand";
import { Sparkles } from "lucide-react";

export function MarqueeTicker() {
  const items = brand.marqueeItems || [];

  return (
    <div className="bg-burgundy text-ivory-light py-3 overflow-hidden border-y border-burgundy-dark shadow-inner">
      <div className="flex animate-marquee whitespace-nowrap">
        {/* Double the list to enable continuous looping */}
        {[...items, ...items, ...items].map((text, idx) => (
          <div key={idx} className="flex items-center space-x-6 mx-6">
            <span
              className="font-serif text-xs sm:text-sm tracking-wider uppercase font-semibold text-ivory-light"
              style={{ color: "#FBF5E4" }}
            >
              {text}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-blush flex-shrink-0" style={{ color: "#E8B9B8" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
