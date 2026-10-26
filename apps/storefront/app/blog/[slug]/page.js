import { blogs } from "@/data/blogs";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return blogs.map((b) => ({
    slug: b.slug
  }));
}

export default function BlogPostPage({ params }) {
  const slug = params?.slug || "";
  const post = blogs.find((b) => b.slug === slug) || blogs[0];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs
          items={[
            { label: "Journal", href: "/blog" },
            { label: post.title }
          ]}
        />

        <article className="mt-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-center space-x-3 text-xs text-muted-subtle mb-3">
              <span>{post.date}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.readTime}</span>
              </div>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-dark leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-sm text-muted leading-relaxed font-sans">
              {post.excerpt}
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden aspect-[16/10] mb-8 border border-border shadow-md">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="prose prose-sm sm:prose max-w-none text-muted leading-relaxed font-sans space-y-4">
            <p>
              In the heart of Rajasthan, the rhythmic thud-thud of wooden blocks striking stretched cotton yardage has echoed for over four centuries. Every print begins not with machine code, but with master woodcarvers hand-shaping seasoned sheesham wood into delicate paisleys, marigold butis, and intricate lattice jaals.
            </p>
            <p>
              When wearing an authentic Jaipur hand-block printed kurta or Anarkali set, you wear a living testament to human dexterity. Minor imperfections in dye alignment are proof that a human hand placed every impression with mindful devotion.
            </p>
            <blockquote className="p-4 rounded-2xl bg-sand/30 border-l-4 border-primary font-serif italic text-dark my-6">
              &ldquo;True ethnic fashion is not mass manufactured on automated synthetic assembly lines; it is cultivated with patient craft and pure organic fibers.&rdquo;
            </blockquote>
            <p>
              Pair these breathable cottons with antique silver jhumkas, comfortable mojris, and light linen dupattas to transition effortlessly from morning poojas to festive dinner soirees.
            </p>
          </div>

          <div className="pt-8 mt-8 border-t border-border flex items-center justify-between">
            <Link
              href="/blog"
              className="text-xs font-serif font-bold text-dark hover:text-primary transition-colors flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Stories</span>
            </Link>

            <Link
              href="/shop"
              className="btn-primary text-xs py-2.5 px-6"
            >
              Shop Hand-Block Styles
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
