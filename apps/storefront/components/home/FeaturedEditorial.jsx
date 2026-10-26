"use client";

import { useRouter } from "next/navigation";
import { handleShopNowClick } from "@/lib/auth-helpers";

export function FeaturedEditorial() {
  const router = useRouter();
  const editorialCards = [
    {
      title: "The Heritage Anarkali & Suit Sets",
      subtitle: "3-Piece Festive Ensembles",
      description:
        "Crafted with hand-block floral bootis, fine gota patti accents, and whisper-soft kota doria dupattas for timeless elegance.",
      cta: "Shop Suit Sets",
      href: "/collections/suit-sets",
      image: "https://thejaipurloom.com/cdn/shop/files/Banner_600_x_480_px.png",
    },
    {
      title: "Artisanal Quilted Bags & Totes",
      subtitle: "Handcrafted in Jaipur Atelier",
      description:
        "Functional everyday companions featuring double-layered cotton batting, zipper security, and padded laptop compartments.",
      cta: "Explore Bags",
      href: "/collections/bags",
      image: "https://thejaipurloom.com/cdn/shop/files/Bags_banner.png",
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-ivory-light">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {editorialCards.map((card, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl overflow-hidden border border-blush shadow-md bg-blush-light flex flex-col sm:flex-row h-full"
            >
              <div className="sm:w-1/2 relative aspect-[3/4] sm:aspect-auto overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              <div className="sm:w-1/2 p-6 sm:p-8 flex flex-col justify-center bg-blush-light">
                <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
                  {card.subtitle}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-burgundy mb-2.5 leading-snug tracking-[-0.034em]">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-[14px] text-burgundy/85 mb-6 leading-[1.714] font-sans">
                  {card.description}
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => handleShopNowClick(router, card.href)}
                    className="btn-primary text-xs py-2.5 px-6 cursor-pointer transition-transform hover:scale-105"
                  >
                    {card.cta} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
