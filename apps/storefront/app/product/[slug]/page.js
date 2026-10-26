import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function getProductBySlug(slug) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${apiUrl}/products/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.data) return null;
    const p = json.data;
    return {
      ...p,
      id: p._id || p.id,
      category: p.category?.name || p.categorySlug,
      categorySlug: p.categorySlug || p.category?.slug,
      primaryImage: p.primaryImage || p.images?.[0] || "",
      secondaryImage: p.secondaryImage || p.images?.[1] || "",
      images: p.images?.length ? p.images : [p.primaryImage].filter(Boolean),
    };
  } catch (err) {
    return null;
  }
}

async function getSimilarProducts(categorySlug, currentId) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${apiUrl}/products?category=${encodeURIComponent(categorySlug)}&limit=5`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || [])
      .filter((p) => (p._id || p.id) !== currentId)
      .slice(0, 4)
      .map((p) => ({
        ...p,
        id: p._id || p.id,
        category: p.category?.name || p.categorySlug,
        categorySlug: p.categorySlug || p.category?.slug,
        primaryImage: p.primaryImage || p.images?.[0] || "",
      }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const slug = params?.slug || "";
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: `Product Not Found | ${brand.name}`,
    };
  }

  return {
    title: `${product.name} | ${brand.name}`,
    description: product.description,
    keywords: [
      product.name,
      product.category,
      product.fabric,
      "House of Laado ethnic clothing",
      "handcrafted cotton wear",
    ],
    openGraph: {
      title: `${product.name} — ₹${product.sellingPrice}`,
      description: product.description,
      url: `https://houseoflaado.com/product/${product.slug}`,
      type: "article",
      images: [
        {
          url: product.primaryImage,
          width: 800,
          height: 1067,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ₹${product.sellingPrice}`,
      description: product.description,
      images: [product.primaryImage],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const slug = params?.slug || "";
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const similarProducts = await getSimilarProducts(product.categorySlug, product.id);

  // Generate Schema.org JSON-LD structured data
  const productJsonLd = generateProductSchema(product);
  const breadcrumbJsonLd = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: product.category, url: `/collections/${product.categorySlug}` },
    { name: product.name, url: `/product/${product.slug}` },
  ]);

  return (
    <div className="bg-ivory-light min-h-screen">
      {/* Schema.org Product Microdata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Schema.org BreadcrumbList Microdata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-fluid mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Breadcrumbs
          items={[
            { label: product.category, href: `/collections/${product.categorySlug}` },
            { label: product.name },
          ]}
        />

        {/* Client Product Interactive View */}
        <ProductDetailClient product={product} />

        {/* Similar Recommendations Section */}
        <div className="mt-16 pt-12 border-t border-blush">
          <ProductGrid
            products={similarProducts}
            title="Complete Your Ethnic Look"
            subtitle="Curated Recommendations"
            actionText="Explore More Suit Sets"
            actionHref="/collections/suit-sets"
          />
        </div>
      </div>
    </div>
  );
}
