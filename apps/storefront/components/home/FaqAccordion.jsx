"use client";

import { useState } from "react";
import { faqs } from "@/data/faqs";
import { ChevronDown } from "lucide-react";

export function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx((prev) => (prev === idx ? -1 : idx));
  };

  return (
    <section className="py-12 sm:py-16 bg-ivory-light border-t border-blush">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Common Inquiries
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-burgundy tracking-[-0.034em]">
            FAQ
          </h2>
          <p className="text-xs sm:text-[15px] text-burgundy/85 mt-2 max-w-lg mx-auto font-sans leading-[1.714]">
            Everything you need to know about ethnic sizing, fabrics, shipping, and payments.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-blush overflow-hidden shadow-sm transition-shadow"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm sm:text-base font-serif font-semibold text-burgundy hover:text-rose transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-burgundy/60 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-rose" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-[14px] text-burgundy/85 font-sans leading-[1.714] border-t border-blush/40 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
