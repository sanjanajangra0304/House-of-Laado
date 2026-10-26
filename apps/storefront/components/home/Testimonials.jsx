import { testimonials } from "@/data/testimonials";
import { Star, CheckCircle, Quote } from "lucide-react";

export function Testimonials() {
  return (
    <section className="py-12 sm:py-16 bg-ivory-light border-y border-blush">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Real Experiences
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-burgundy tracking-[-0.034em]">
            Happy Customers
          </h2>
          <p className="text-xs sm:text-sm text-burgundy/85 mt-2 max-w-lg mx-auto">
            Read verified reviews from patrons across India who love our handcrafted cottons.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="bg-blush-light rounded-2xl p-6 border border-blush shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Rating stars & Quote Icon */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-amber-500">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-rose opacity-40" />
                </div>

                <h3 className="font-serif font-bold text-sm text-burgundy mb-2">
                  &ldquo;{item.title}&rdquo;
                </h3>

                <p className="text-xs text-burgundy/85 leading-relaxed mb-4">
                  {item.comment}
                </p>
              </div>

              <div className="pt-4 border-t border-blush/60">
                {/* Product thumbnail tagged in review */}
                <div className="flex items-center space-x-2.5 mb-3 bg-ivory-light p-1.5 rounded-lg border border-blush/40">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-9 h-11 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-burgundy/70 block truncate">
                      Purchased:
                    </span>
                    <span className="text-[11px] font-semibold text-burgundy block truncate font-serif">
                      {item.productName}
                    </span>
                  </div>
                </div>

                {/* Reviewer name & Verified tag */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-burgundy block">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-burgundy/70">
                      {item.location}
                    </span>
                  </div>

                  {item.verifiedBuyer && (
                    <div className="flex items-center space-x-1 text-olive text-[11px] font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verified Buyer</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
