# Store Customization & Brand White-Labeling Guide

Every single brand-specific text, contact number, Jaipur address, promotional announcement, and return policy is completely isolated in one central configuration file:
👉 **[`apps/storefront/config/brand.js`](file:///c:/Users/sanja/Clothing_website/apps/storefront/config/brand.js)**

You can rebrand this entire store for another boutique, artisan cluster, or clothing label in **under 5 minutes** without editing React components or template code.

---

## 1. Brand Identity & Taglines

In `apps/storefront/config/brand.js`:
```javascript
export const brand = {
  // Brand Name & Taglines
  name: process.env.NEXT_PUBLIC_STORE_NAME || "House of Laado",
  tagline: "Inspired by Mom. Crafted for Every Woman.",
  shortDescription: "Inspired by Mom. Crafted for Every Woman. Authentic handcrafted ethnic wear, artisanal silhouettes, pure cotton kurtas, and timeless festive luxury.",

  // Free Shipping Threshold (in INR)
  freeShippingThreshold: 1000, // Orders above this amount get automatic free shipping
```

---

## 2. Contact Information & WhatsApp

Update these fields to route customer calls, emails, and 1-click WhatsApp inquiries directly to your team:
```javascript
  contact: {
    address: "108, Heritage Crafts Lane, C-Scheme, Jaipur, Rajasthan 302001, India",
    phone: "+91 98765 43210",
    whatsapp: "+91 98765 43210", // Formats international WhatsApp chat links
    email: "support@houseoflaado.com",
    supportHours: "Monday to Saturday: 10:00 AM – 7:00 PM IST"
  },
```

---

## 3. Rotating Announcement Bar & Homepage Marquee

To launch festive promotions or update discount notices, simply edit these message arrays:
```javascript
  // Rotating announcements in the top header banner
  announcements: [
    "✨ Free Express Shipping across India on orders above ₹999",
    "🏷️ Extra 5% Instant Discount on all Prepaid Orders | Code: PREPAID5",
    "🌿 Handcrafted with 100% Breathable Pure Cotton & Natural Dyes",
    "💫 Festive Edit 2026 Live Now | Discover Exclusive Arrivals"
  ],

  // Scrolling marquee ticker on the homepage
  marqueeItems: [
    "Handcrafted in Jaipur",
    "100% Pure Breathable Cotton",
    "Artisanal Hand-Block Prints",
    "Pan-India Fast Delivery",
    "7-Day Easy Exchange",
    "Ethically Sourced & Made in India",
    "Premium Tailored Fits"
  ],
```

---

## 4. Theme Colors & Aesthetic Tokens

The store uses an authentic Rajasthani luxury color palette modeled on the live Jaipur Loom website:

| Token Name | Hex Code | Visual Purpose |
|---|---|---|
| **Primary (Burgundy)** | `#5f0d24` | Primary brand color, header accents, CTA buttons, active states |
| **Secondary (Terracotta)** | `#d0473e` | Sale badges, discount highlights, urgency banners |
| **Sand (Warm Sandstone)** | `#f2e4d8` | Background card sections, editorial editorial backgrounds, hover tints |
| **Dark (Charcoal)** | `#111111` | Heading typography, high-contrast dark badges, admin sidebar |
| **Border** | `#ebebeb` | Clean card outlines and subtle dividers |

To customize these colors across the store:
1. Open `apps/storefront/tailwind.config.js`:
   ```javascript
   theme: {
     extend: {
       colors: {
         primary: "#5f0d24", // Change your primary color here
         secondary: "#d0473e",
         sand: "#f2e4d8",
         dark: "#111111",
       }
     }
   }
   ```
2. Open `apps/storefront/app/globals.css` and adjust the CSS color tokens if needed.
