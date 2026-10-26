import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryShortcuts } from "@/components/home/CategoryShortcuts";
import { MarqueeTicker } from "@/components/home/MarqueeTicker";
import { ProductGrid } from "@/components/product/ProductGrid";
import { TrendingCollections } from "@/components/home/TrendingCollections";
import { FeaturedEditorial } from "@/components/home/FeaturedEditorial";
import { Testimonials } from "@/components/home/Testimonials";
import { StoryBlock } from "@/components/home/StoryBlock";
import { BlogTeasers } from "@/components/home/BlogTeasers";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { PromoBanner } from "@/components/home/PromoBanner";
import { TrustBadges } from "@/components/home/TrustBadges";

async function getCatalogProducts(query) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${apiUrl}/products?${query}&limit=4`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map((p) => ({
      ...p,
      id: p._id || p.id,
      isNew: p.isNewArrival ?? p.isNew,
    }));
  } catch (err) {
    return [];
  }
}

export default async function HomePage() {
  const [apiBestSellers, apiTrending, apiFeatured] = await Promise.all([
    getCatalogProducts("isBestSeller=true"),
    getCatalogProducts("isNewArrival=true"),
    getCatalogProducts("isFeatured=true"),
  ]);

  const bestSellers = apiBestSellers;
  const newArrivals = apiTrending;
  const featured = apiFeatured;

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* 1. Hero Carousel (Full-width banners) */}
      <HeroCarousel />

      {/* 2. Collection List / Shortcuts (Suit Sets, Dresses, Bags, Kurtas, Co-ords, Kids) */}
      <CategoryShortcuts />

      {/* 3. Scrolling Craft Value Marquee Ticker */}
      <MarqueeTicker />

      {/* 4. Best Selling Section (Matching reference products_carousel_AdKeFt) */}
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <ProductGrid
          products={bestSellers}
          title="Best Selling"
          subtitle="Customer Favorites"
          actionText="View All"
          actionHref="/collections/suit-sets"
        />
      </div>

      {/* 5. Top Trending Collection Banners */}
      <TrendingCollections />

      {/* 6. Top Trending Collection Products (Matching reference products_carousel_j6GRxh) */}
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <ProductGrid
          products={newArrivals}
          title="Top Trending Collection"
          subtitle="Seasonal Highlights"
          actionText="View All"
          actionHref="/collections/lounge-co-ord-sets"
        />
      </div>

      {/* 7. Featured Collection Products (Matching reference products_carousel_zTH3kQ) */}
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <ProductGrid
          products={featured}
          title="Featured Collection"
          subtitle="Jaipur Atelier Special"
          actionText="View All"
          actionHref="/collections/festive-edit"
        />
      </div>

      {/* 8. Featured Split Editorial Banners */}
      <FeaturedEditorial />

      {/* 9. Happy Customers Testimonials */}
      <Testimonials />

      {/* 10. Indian Ethnic Wear for Women Story & SEO Editorial Block */}
      <StoryBlock />

      {/* 11. Latest updates Blog Posts */}
      <BlogTeasers />

      {/* 12. FAQ Accordion */}
      <FaqAccordion />

      {/* 13. Full-width Promo Banner with Overlay */}
      <PromoBanner />

      {/* 14. Trust Badges Strip (Free Shipping, Support Online, Flexible Payment) */}
      <TrustBadges />
    </div>
  );
}
