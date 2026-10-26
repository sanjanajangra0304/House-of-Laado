/**
 * Central Brand Configuration
 * All brand-specific text, contact info, logos, promo notices, and policies are configured here.
 * The shop owner can customize all values in this single file without editing components.
 */
export const brand = {
  // Brand Identity
  name: process.env.NEXT_PUBLIC_STORE_NAME || "House of Laado",
  tagline: "Inspired by Mom. Crafted for Every Woman.",
  shortDescription: "Inspired by Mom. Crafted for Every Woman. Authentic handcrafted ethnic wear, artisanal silhouettes, pure cotton kurtas, and timeless festive luxury.",

  // Brand Visual Identity
  logo: {
    text: "HOUSE OF LAADO",
    subtext: "Inspired by Mom. Crafted for Every Woman.",
    imageUrl: "/logo.png",
    alt: "House of Laado Logo",
  },

  // Brand Palette & Typography Tokens (Navy, Warm Beige, Soft Gold)
  colors: {
    navy: "#1F2A44",         // Luxury Midnight Navy
    warmBeige: "#E8DCC8",    // Elegant Warm Beige
    softGold: "#C6A75E",     // Luminous Soft Gold
    beigeLight: "#FAF7F2",   // Soft light ivory/beige page background
    beigeCard: "#F5ECE0",    // Warm card background
    goldDark: "#A6883F",     // Deeper antique gold for high-contrast text
    goldLight: "#E2CA8E",    // Luminous gold highlight
    primary: "#1F2A44",      // Navy primary brand
    primaryDark: "#151D30",  // Darker navy
    secondary: "#C6A75E",    // Soft Gold secondary
    accent: "#C6A75E",       // Soft Gold
    announcement: "#1F2A44", // Navy announcement bar
    announcementText: "#E8DCC8", // Warm Beige announcement text
    sand: "#E8DCC8",         // Warm Beige
    dark: "#1F2A44",         // Midnight Navy instead of pure black
    muted: "rgba(31, 42, 68, 0.85)", // Navy at 85% opacity
    border: "#E8DCC8",       // Warm Beige borders
    burgundy: "#1F2A44",     // Aliased to Navy
    rose: "#C6A75E",         // Aliased to Soft Gold
    blush: "#E8DCC8",        // Aliased to Warm Beige
    olive: "#C6A75E",        // Aliased to Soft Gold
    ivory: "#E8DCC8",        // Aliased to Warm Beige
    ivoryLight: "#FAF7F2",   // Aliased to Soft Cream
  },

  fonts: {
    heading: "Playfair Display, serif",
    body: "DM Sans, sans-serif",
  },

  // Imagery & Banners
  images: {
    heroSlides: [
      {
        id: 1,
        title: "Gulabi Festive Edit '26",
        subtitle: "Handcrafted Pure Cotton Suit Sets",
        desktopImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=85",
        mobileImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=768&q=85",
        link: "/collections/suit-sets",
        ctaText: "Shop Collection",
      },
      {
        id: 2,
        title: "Artisanal Sanganeri Kurtas",
        subtitle: "Pure Cambric Cottons from ₹799",
        desktopImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1920&q=85",
        mobileImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=768&q=85",
        link: "/collections/kurtas",
        ctaText: "Explore Kurtas",
      },
    ],
    placeholderProduct: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
  },

  // Announcement Bar Messages (Matching The Jaipur Loom reference)
  announcements: [
    "Free shipping on orders above ₹1000",
    "Get additional 5% off on all prepaid orders above ₹1000",
    "100% Pure Jaipur Handblock Cottons & Artisanal Silhouettes",
    "Festive Edit '26 Live Now | Discover Exclusive Arrivals"
  ],

  // Promotional Marquee (Scrolling ticker on homepage)
  marqueeItems: [
    "Get additional 5% off on all prepaid orders above ₹1000",
    "100% Pure Jaipuri Handblock Cottons",
    "Free Express Shipping on orders above ₹1000",
    "Handcrafted in Jaipur Atelier",
    "Authentic Sanganeri Prints & Zari Embroideries",
    "7-Day Easy Doorstep Exchange"
  ],

  // Business Contact Information (Configurable centralized details)
  contact: {
    brandName: "House of Laado",
    addressLine: "108, Heritage Crafts Lane, C-Scheme",
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302001",
    country: "India",
    address: "108, Heritage Crafts Lane, C-Scheme, Jaipur, Rajasthan 302001, India",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("108 Heritage Crafts Lane C-Scheme Jaipur Rajasthan 302001 India"),
    phone: "+91 98765 43210",
    whatsapp: "+91 98765 43210",
    whatsappNumber: "919876543210",
    email: "support@houseoflaado.com",
    supportHours: "Monday to Saturday: 10:00 AM – 7:00 PM IST"
  },

  // Trust Badges (Matching reference icon box: Free Shipping, Support Online, Flexible Payment)
  trustBadges: [
    {
      title: "Free Shipping",
      description: "For orders above 1000",
      icon: "truck"
    },
    {
      title: "Support Online",
      description: "24 hours a day, 7 days a week",
      icon: "headset"
    },
    {
      title: "Flexible Payment",
      description: "Pay with Multiple Credit Cards, Netbanking & UPI",
      icon: "credit-card"
    }
  ],

  // Social Links
  socials: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/house.of.laado/",
    whatsapp: "https://wa.me/919876543210"
  },

  // E-Commerce Rules
  freeShippingThreshold: 1000,
  defaultShippingFee: 99,
  prepaidDiscountPercent: 5,
  currency: {
    symbol: "₹",
    code: "INR"
  }
};
