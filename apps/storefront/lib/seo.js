import { brand } from "@/config/brand";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://houseoflaado.com";

/**
 * Generate Schema.org Organization structured data
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: brand.name,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: brand.shortDescription,
    telephone: brand.contact.phone,
    email: brand.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.contact.addressLine || brand.contact.address,
      addressLocality: brand.contact.city || "Jaipur",
      addressRegion: brand.contact.state || "Rajasthan",
      postalCode: brand.contact.pincode || "302001",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "26.9124",
      longitude: "75.7873",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "19:00",
    },
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, UPI, Net Banking",
  };
}

/**
 * Generate Schema.org WebSite with SearchAction
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate Schema.org Product structured data
 */
export function generateProductSchema(product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [product.primaryImage, product.secondaryImage].filter(Boolean),
    description: product.description,
    sku: product.slug,
    mpn: product.id,
    brand: {
      "@type": "Brand",
      name: brand.name,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "INR",
      price: product.sellingPrice,
      priceValidUntil: "2026-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: product.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: brand.name,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: product.sellingPrice >= 999 ? 0 : 99,
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating || 4.8,
      reviewCount: product.reviewsCount || 24,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

/**
 * Generate Schema.org BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ? `${SITE_URL}${item.url}` : undefined,
    })),
  };
}
