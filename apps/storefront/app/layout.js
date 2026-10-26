import "./globals.css";
import { brand } from "@/config/brand";
import { CartProvider } from "@/lib/cart-context";
import { ToastProvider } from "@/lib/toast-context";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seo";

export const metadata = {
  title: {
    default: `${brand.name} | ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.shortDescription,
  keywords: [
    "Jaipur kurtas",
    "ethnic suit sets",
    "anarkali suit sets",
    "pure cotton coords",
    "block print tote bags",
    "Indian ethnic fashion",
    "Chanderi silk sets",
    "festive clothing online",
  ],
  authors: [{ name: brand.name }],
  creator: brand.name,
  publisher: brand.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://houseoflaado.com"),
  openGraph: {
    title: `${brand.name} | ${brand.tagline}`,
    description: brand.shortDescription,
    url: "https://houseoflaado.com",
    siteName: brand.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: `${brand.name} Indian Ethnic Wear`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} | ${brand.tagline}`,
    description: brand.shortDescription,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&h=630&q=80",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inject Schema.org Organization Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Inject Schema.org WebSite Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-ivory-light text-burgundy antialiased">
        <CartProvider>
          <ToastProvider>
            <StorefrontLayoutShell>{children}</StorefrontLayoutShell>
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
