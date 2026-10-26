import { Suspense } from "react";
import { categories } from "@/data/categories";
import { brand } from "@/config/brand";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CollectionClient } from "@/components/collection/CollectionClient";
import { generateBreadcrumbSchema } from "@/lib/seo";

export function generateStaticParams() {
  return [
    { slug: "suit-sets" },
    { slug: "kurtas" },
    { slug: "tops-short-kurtis" },
    { slug: "short-kurtis" },
    { slug: "coord-sets" },
    { slug: "lounge-co-ord-sets" },
    { slug: "dresses" },
    { slug: "bags" },
    { slug: "festive-edit" },
    { slug: "special-prices" },
    { slug: "kids" },
    { slug: "kids-wear" },
    { slug: "menswear" },
    { slug: "womens-wear" },
    { slug: "bottoms" },
  ];
}

function resolveCategoryName(slug) {
  let cat = categories.find((c) => c.slug === slug);
  if (!cat) {
    for (const c of categories) {
      if (c.subcategories) {
        for (const sub of c.subcategories) {
          if (sub.slug === slug) return sub.name;
        }
      }
    }
  }
  return cat
    ? cat.name
    : slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export function generateMetadata({ params }) {
  const slug = params?.slug || "";
  const categoryName = resolveCategoryName(slug);

  return {
    title: `${categoryName} — Handcrafted Indian Fashion | ${brand.name}`,
    description: `Shop artisanal ${categoryName} in pure breathable cotton and authentic Jaipur hand-block prints. Explore latest designs and exclusive offers.`,
    openGraph: {
      title: `${categoryName} | ${brand.name}`,
      description: `Shop authentic ${categoryName} online with pan-India express shipping.`,
      url: `https://houseoflaado.com/collections/${slug}`,
    },
  };
}

async function getCollectionProducts(slug) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    let url = `${apiUrl}/products?limit=100`;
    if (slug !== "all" && slug !== "shop" && slug !== "special-prices" && slug !== "sale") {
      url = `${apiUrl}/products?category=${encodeURIComponent(slug)}&limit=100`;
    }
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    let prods = (json.data || []).map((p) => ({
      ...p,
      id: p._id || p.id,
      categorySlug: p.categorySlug || p.category?.slug,
      primaryImage: p.primaryImage || p.images?.[0] || "",
      isNew: p.isNewArrival ?? p.isNew,
    }));

    // If tops-short-kurtis or short-kurtis returns no products under that exact slug,
    // fallback to kurti/kurta products so the collection page displays matching styles
    if ((slug === "tops-short-kurtis" || slug === "short-kurtis") && prods.length === 0) {
      const fallbackRes = await fetch(`${apiUrl}/products?category=kurtas&limit=100`, { cache: "no-store" });
      if (fallbackRes.ok) {
        const fallbackJson = await fallbackRes.json();
        const fallbackProds = (fallbackJson.data || []).map((p) => ({
          ...p,
          id: p._id || p.id,
          categorySlug: p.categorySlug || p.category?.slug,
          primaryImage: p.primaryImage || p.images?.[0] || "",
          isNew: p.isNewArrival ?? p.isNew,
        }));
        if (fallbackProds.length > 0) {
          prods = fallbackProds;
        }
      }
    }

    if (slug === "special-prices" || slug === "sale") {
      prods = prods.filter((p) => p.compareAtPrice > p.sellingPrice);
    } else if (slug === "festive-edit") {
      prods = prods.filter((p) => p.categorySlug === "festive-edit" || p.sellingPrice > 2000);
    }
    return prods;
  } catch (err) {
    return [];
  }
}

export default async function CollectionPage({ params }) {
  const slug = params?.slug || "";
  const categoryName = resolveCategoryName(slug);
  const categoryInfo = { name: categoryName, slug };

  // Fetch live collection products from MongoDB Atlas
  const collectionProducts = await getCollectionProducts(slug);

  const breadcrumbJsonLd = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Collections", url: "/shop" },
    { name: categoryName, url: `/collections/${slug}` },
  ]);

  return (
    <div className="bg-ivory-light min-h-screen">
      {/* Schema.org BreadcrumbList Microdata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-fluid mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Breadcrumbs
          items={[
            { label: "Collections", href: "/shop" },
            { label: categoryInfo.name },
          ]}
        />

        {/* Collection Header Banner */}
        <div className="my-4 sm:my-6 p-6 sm:p-10 rounded-2xl bg-blush-light border border-blush flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <span className="text-xs font-sans uppercase tracking-widest text-rose font-bold block mb-1">
              House of Laado Collection
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-burgundy mb-2">
              {categoryInfo.name}
            </h1>
            <p className="text-xs sm:text-sm text-burgundy/85 leading-relaxed">
              Explore authentic hand-block prints, pure breathable cotton weaves, and tailored silhouettes crafted by traditional artisans in Rajasthan.
            </p>
          </div>

          <div className="flex space-x-3 text-xs">
            <div className="bg-ivory-light/90 backdrop-blur-sm px-4 py-2 rounded-pill border border-blush font-medium text-burgundy shadow-xs">
              ✨ 100% Cotton Mulmul
            </div>
            <div className="bg-ivory-light/90 backdrop-blur-sm px-4 py-2 rounded-pill border border-blush font-medium text-burgundy shadow-xs">
              🚚 Pan-India Shipping
            </div>
          </div>
        </div>

        {/* Interactive Client Component for Filtering & Sorting wrapped in Suspense for static prerendering */}
        <Suspense
          fallback={
            <div className="py-20 text-center text-sm text-muted">
              Loading collection products...
            </div>
          }
        >
          <CollectionClient
            slug={slug}
            categoryInfo={categoryInfo}
            collectionProducts={collectionProducts}
            categories={categories}
          />
        </Suspense>
      </div>
    </div>
  );
}
