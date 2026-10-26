import { Truck, Headphones, CreditCard } from "lucide-react";
import { brand } from "@/config/brand";

export function TrustBadges() {
  const icons = {
    truck: Truck,
    headset: Headphones,
    "credit-card": CreditCard,
  };

  return (
    <section className="py-10 bg-ivory-light border-y border-blush">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 divide-y md:divide-y-0 md:divide-x divide-blush">
          {brand.trustBadges.map((badge, idx) => {
            const Icon = icons[badge.icon] || Truck;
            return (
              <div
                key={idx}
                className={`flex items-center space-x-4 p-4 ${
                  idx > 0 ? "pt-6 md:pt-4 md:pl-8" : ""
                }`}
              >
                <div className="w-13 h-13 rounded-full bg-blush-light border border-blush flex items-center justify-center text-rose flex-shrink-0">
                  <Icon className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-burgundy">
                    {badge.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-burgundy/85 mt-0.5 leading-snug font-sans">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
