import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { blogs } from "@/data/blogs";
import { Clock } from "lucide-react";

export default function BlogListingPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[{ label: "Fashion & Craft Journal" }]} />

        <div className="my-6 text-center max-w-xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-primary font-bold block mb-1 font-sans">
            Stories From Jaipur
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark mb-2">
            The House of Laado Journal
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Craft heritage chronicles, summer styling rituals, and cotton fabric care wisdom.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {blogs.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <div className="aspect-[16/10] overflow-hidden bg-sand/30">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 text-[11px] text-muted-subtle mb-2.5">
                    <span>{post.date}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <h2 className="font-serif text-lg font-bold text-dark group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-xs text-muted leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-border/50">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="font-serif text-xs font-semibold text-primary hover:text-primary-dark transition-colors inline-flex items-center space-x-1"
                  >
                    <span>Read Full Story</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
