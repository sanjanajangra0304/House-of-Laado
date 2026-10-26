import Link from "next/link";
import { blogs } from "@/data/blogs";
import { Clock } from "lucide-react";

export function BlogTeasers() {
  return (
    <section className="py-12 sm:py-16 bg-ivory-light">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-blush">
          <div>
            <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
              Editorial Journal
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-burgundy tracking-[-0.034em]">
              Latest updates
            </h2>
          </div>

          <Link
            href="/blog"
            className="text-xs font-serif font-semibold text-burgundy hover:text-rose transition-colors underline underline-offset-4 mt-2 sm:mt-0"
          >
            Read All Articles →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {blogs.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col rounded-2xl overflow-hidden border border-blush shadow-sm hover:shadow-md transition-shadow bg-blush-light"
            >
              <div className="aspect-[16/10] overflow-hidden bg-sand/30">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 text-[11px] text-burgundy/60 mb-2">
                    <span>{post.date}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <h3 className="font-serif text-base font-bold text-burgundy group-hover:text-rose transition-colors line-clamp-2 mb-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-burgundy/85 leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-blush/40">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="font-serif text-xs font-semibold text-rose hover:text-burgundy transition-colors inline-flex items-center space-x-1"
                  >
                    <span>Read Story</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
