const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://houseoflaado.com";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/checkout/", "/order-success/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
