import { blogs } from "@/data/blogs";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://houseoflaado.com";

async function getProducts() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${apiUrl}/products?limit=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const currentDate = new Date().toISOString();
  const products = await getProducts();

  // Core Static Routes
  const staticRoutes = [
    { url: `${BASE_URL}/`, lastModified: currentDate, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/shop`, lastModified: currentDate, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/track-order`, lastModified: currentDate, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/shipping-policy`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/exchange-policy`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms-of-service`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/blog`, lastModified: currentDate, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Collection Routes
  const collections = [
    "suit-sets",
    "kurtas",
    "coord-sets",
    "dresses",
    "bags",
    "festive-edit",
    "special-prices",
    "kids",
    "menswear",
  ];

  const collectionRoutes = collections.map((slug) => ({
    url: `${BASE_URL}/collections/${slug}`,
    lastModified: currentDate,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Product Routes
  const productRoutes = products.map((p) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Blog Routes
  const blogRoutes = blogs.map((b) => ({
    url: `${BASE_URL}/blog/${b.slug}`,
    lastModified: currentDate,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...collectionRoutes, ...productRoutes, ...blogRoutes];
}
