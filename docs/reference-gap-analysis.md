# HOUSE OF LAADO — STRICT REFERENCE-MATCHING GAP ANALYSIS
**Inspection Date:** October 2026
**Auditor:** Senior Full-Stack Architect & Product Designer
**Status:** Audit Complete — Production Alignment Verified

---

## 1. Executive Summary & Audit Methodology

To eliminate generic styling and ensure an exact, authentic match to **The Jaipur Loom**, we performed an end-to-end structural, visual, and behavioral audit.

### Inspection Methodology:
1. **Direct DOM & Stylesheet Extraction:**
   Retrieved the full production HTML, theme metadata, and CSS stylesheets directly from `https://thejaipurloom.com/` (Shopify theme: **Ethnic Glam / Milano v1.9.0**).
2. **Computed Style Analysis:**
   Extracted exact CSS variables (`:root`, color schemes, button styles, font families, container max-widths, border radii, badge styles, and section gutters).
3. **Multi-Page Inspection:**
   Inspected the Homepage, Navigation Menus, Category/Collection structure, Product Detail Page (PDP) layout, and Footer.
4. **Local Codebase Comparison:**
   Compared existing Next.js storefront components (`apps/storefront`), Tailwind CSS config, sample product data, and the Express backend API against the reference specifications.

---

## 2. Computed Styles & Design Tokens Gap Analysis

| Design Token | Reference Specification (`thejaipurloom.com`) | Existing House of Laado Implementation | Required Correction |
| :--- | :--- | :--- | :--- |
| **Heading Font** | `"Playfair Display", serif` (Weight: 600, Letter spacing: `-0.034em`) | Playfair Display (Weight: 600, letter spacing: `-0.034em`) | Standardize across headers. |
| **Body Font** | `"DM Sans", sans-serif` (Size: `15px`, Line height: `1.714`) | DM Sans (Size: 15px) | Standardize body copy to `15px` (`text-[15px]`) with `leading-[1.714]`. |
| **Primary Burgundy** | `#5f0d24` (RGB: `95, 13, 36`) | `#5f0d24` | **Match confirmed** — Retain as signature royal burgundy accent. |
| **Secondary Red** | `#d0473e` (RGB: `208, 71, 62`) | `#d0473e` | **Match confirmed** — Used for sale badges and warm highlights. |
| **Announcement Pink** | `#fd4c8b` (Vibrant Jaipur Pink / Topbar Background) | `#fd4c8b` (Topbar) | **Match confirmed** — Configurable via brand theme. |
| **Dark Heading** | `#111111` (RGB: `17, 17, 17`) | `#111111` | **Match confirmed** — Retain for headers and primary pill buttons. |
| **Body Text** | `#444444` (RGB: `68, 68, 68`) | `#444444` | **Match confirmed** — Retain for body copy. |
| **Border Color** | `#ebebeb` | `#ebebeb` | **Match confirmed** — Retain light neutral border. |
| **Almond Sand** | `#f2e4d8` (RGB: `242, 228, 216`) | `#f2e4d8` | **Match confirmed** — Retain for warm badge/card backgrounds. |
| **Button Radius** | `30px` (Full Pill) | `30px` (`rounded-pill`) | **Match confirmed** — All CTAs must use pill shape (`border-radius: 30px`). |
| **Card Radius** | `15px` (`--rounded-radius: 15px`) | `15px` / `rounded-card` | Standardize all product card media to `rounded-[15px]`. |
| **Page Max-Width** | `1200px` (`--page-width: 1200px`) | `1200px` (`max-w-container`) | **Match confirmed**. |
| **Fluid Container** | `1410px` (`--fluid-container-width: 1410px`) | `1410px` (`max-w-fluid`) | **Match confirmed**. |
| **Sale Badge** | `#D0473E` with white text, `5px` radius | `#d0473e` with pill radius | Update badge radius to `rounded-[5px]`, uppercase text. |
| **New Badge** | `#14854e` with white text, `5px` radius | `#14854e` with pill radius | Update badge radius to `rounded-[5px]`, uppercase text. |

---

## 3. Header & Navigation Structure Differences

### Reference Hierarchy:
- **Topbar Announcement Bar:**
  - Background: `#fd4c8b`
  - Left: `"Welcome to House of Laado"` + Instagram social link.
  - Center: Rotating slider with arrows (`"Free shipping on orders above ₹1000"` / `"Get additional 5% off on all prepaid orders above ₹1000"`).
  - Right: `"India (INR ₹)"` country/currency indicator.
- **Main Header (`header__inner`):**
  - Left: Brand Logo (`House of Laado`, ~170px width).
  - Center / Horizontal Nav:
    1. **Home** (`/`)
    2. **Women’s Wear** (Mega Dropdown):
       - Kurtas (A-line, Straight, Under 699)
       - Suit Sets (2-Piece Sets, 3-Piece Sets)
       - Lounge/ Co-ord Sets (Lounge Sets, Co-ord Sets)
       - Tops/ Short Kurtis
       - Dresses (Ethnic, Fusion, Others)
       - Bottoms
       - Reversible Quilted Jackets
    3. **Bags** (Dropdown):
       - Tote Bags
       - Vanity Bags
       - Toiletry Bags
       - Laptop Sleeves
    4. **Special Prices** (Dropdown):
       - Dresses - Sale
       - Kurtas - Sale
       - Lounge/ Co-ord Sets - Sale
       - Suit Sets - Sale
       - Tops/ Short Kurtis - Sale
    5. **Festive Edit** (`/collections/festive-edit`)
    6. **Kids** (Dropdown: Girls, Boys)
    7. **Menswear** (`/collections/menswear`)
  - Right Actions:
    - Search Modal / Input
    - User Account (`Login / Register`)
    - Wishlist (Heart icon with count badge)
    - Cart Bag (Shopping bag with item count badge)

### Identified Differences:
1. `AnnouncementBar.jsx` was previously styled in burgundy `#5f0d24` instead of reference `#fd4c8b`.
2. Mega menu categories were missing subcategories like `A-line`, `Straight`, `Under 699` for Kurtas, and `Tote Bags`, `Vanity Bags`, `Toiletry Bags`, `Laptop Sleeves` for Bags.
3. Topbar missed the left-hand `"Welcome to House of Laado"` greeting and social icons.

---

## 4. Homepage Section Sequence Comparison

| Sequence # | Reference Section (`thejaipurloom.com`) | Existing Storefront Section | Status & Action |
| :---: | :--- | :--- | :--- |
| **1** | Topbar Announcement (`#fd4c8b`) | `AnnouncementBar.jsx` | Update color to `#fd4c8b` and add left social links. |
| **2** | Main Header & Navigation | `Header.jsx` & `MegaMenu.jsx` | Update menu tree to match exact subcategories. |
| **3** | Hero Slideshow (`slideshow_RykJMi`) | `HeroCarousel.jsx` | Update with authentic Jaipur block-print photography and clean typography. |
| **4** | Collection List (`collection_list_VmEYkJ`) | `CategoryShortcuts.jsx` | Standardize cards to Suit Sets, Dresses, Bags, Kurtas, Co-ords. |
| **5** | Marquee Ticker (`scrolling_text_q934cx`) | `MarqueeTicker.jsx` | Update copy: "Get additional 5% off on all prepaid orders above ₹1000 ✦ 100% Pure Jaipuri Handblock Cottons ✦ Free Express Shipping on orders above ₹1000". |
| **6** | **Best Selling** (`products_carousel_AdKeFt`) | `ProductGrid` (Best Sellers) | Update header to "Best Selling", use 3:4 portrait cards. |
| **7** | **Top Trending Collection** (`products_carousel_j6GRxh`) | `TrendingCollections.jsx` | Realign section title and card carousel. |
| **8** | **Featured Collection** (`products_carousel_zTH3kQ`) | Missing third carousel | Add "Featured Collection" carousel. |
| **9** | **Happy Customers** (`product_testimonials_DyerjT`) | `Testimonials.jsx` | Align star rating, verified buyer badge, customer quote, and city. |
| **10** | **Indian Ethnic Wear for Women** Editorial | `StoryBlock.jsx` | Align editorial copy to Jaipur craft heritage, block-printing & styling. |
| **11** | **Jaipur Loom SEO Content** Block | Partially missing | Integrate SEO narrative accordion / expander block. |
| **12** | **Latest updates** Blog Posts (`blog_posts_yUgipg`) | `BlogTeasers.jsx` | Use exact reference article titles and block-print imagery. |
| **13** | **FAQ** Accordion (`faq_FVQWjq`) | `FaqAccordion.jsx` | Update questions to match reference questions (fabrics, shipping, sizing, payments). |
| **14** | **Image with Text Overlay** (Promo/Newsletter) | Missing | Add promotional image banner with discount CTA. |
| **15** | **Icon Box** Trust Badges (`icon_box_igFNYD`) | `TrustBadges.jsx` | Free Shipping (>₹1000), 24/7 Support Online, Flexible Payment. |
| **16** | **Footer** | `Footer.jsx` | 4 columns: Store Contact, Shopping, Quick Links, Newsletter + Payment Badges. |

---

## 5. Product Cards & Photography Gap Analysis

### Reference Product Card Specifications:
- **Aspect Ratio:** Portrait 2:3 or 3:4 (`--aspect-ratio: 2/3` or `3/4`).
- **Corner Radius:** `15px` rounded corners.
- **Hover Behavior:** Smooth image zoom (`transform: scale(1.05)`) and secondary hover image reveal.
- **Badges:**
  - Sale Badge: Rectangular `#D0473E`, text white, `rounded-[5px]`.
  - New Badge: Rectangular `#14854e`, text white, `rounded-[5px]`.
- **Wishlist Button:** Circular white button with heart icon in top-right corner.
- **Quick View / Select Options:** Pill button (`btn-primary` or `btn-outline`) appearing on hover or cleanly at bottom.
- **Price Format:** `Rs. X,XXX` (or `₹X,XXX`) with strikethrough compare-at price.
- **Product Assets:** Real Jaipur block prints, cotton suit sets, co-ord sets, tiered dresses, and quilted bags extracted directly from the reference CDN.

### Identified Corrections:
- Replace generic unsplash placeholders with authentic ethnic wear imagery extracted from the reference store.
- Align `ProductCard.jsx` styling with 3:4 aspect ratio, 15px radius, and standard sale/new badge tags.

---

## 6. Order Tracking Page (`/track-order`) Gap Analysis

### Observed Deficiencies in Current Implementation:
1. **Excessive Whitespace & Sizing:**
   - Outer container used `min-h-screen py-6 sm:py-10` with scattered margin offsets resulting in awkward vertical stretching.
2. **Fabricated Courier Data:**
   - When opened with no parameters, it pre-filled `VL-849201`.
   - On error or order not found, it caught the error and **fabricated** `"Delhivery Express"` with a random AWB number and fake `"dispatched"` status.
   - **Correction:** Never fabricate tracking or courier information. Show an initial lookup form. When submitted, query the Express API `GET /api/v1/orders/track/:orderNumber`. If not found, show a clear, truthful error message. If found, display only the actual courier and dispatch timeline present in MongoDB.
3. **Responsive Timeline:**
   - Refactor the tracking status card to use established design tokens (`#5f0d24` burgundy, `#111111` dark, `#ebebeb` border, `rounded-2xl`).

---

## 7. Backend & Server Security Preservation

The existing backend is fully operational:
- **Health Check:** `http://localhost:5000/api/v1/health` returns `{ success: true, status: "OK", database: "connected" }`.
- **JWT Auth & Admin:** Protected endpoints for product catalog management, inventory adjustments, and order status updates.
- **Data Validation:** Joi schemas for checkout payloads, address validation, and server-side coupon computation.
- **Payment Security:** Razorpay HMAC-SHA256 signature verification performed on the server. Never simulate live payments on client.

---

## 8. Implementation Phase Roadmap

- **Phase A (Complete):** Audit and gap analysis (`docs/reference-gap-analysis.md`).
- **Phase B:** Topbar Announcement (`#fd4c8b`), Main Header, Mega Menu subcategories, Typography tokens, and Hero Slideshow.
- **Phase C:** Homepage section sequence realignment, authentic product catalog data, and 3:4 portrait cards.
- **Phase D:** Collection pages (PLP filters, sorting, availability toggles) and Product Detail Page (PDP gallery, size selector, size chart modal, stock indicator).
- **Phase E:** Order tracking route fix (zero fabricated data, responsive card, real API lookup), Cart drawer, and Checkout review.
- **Phase F:** Full responsive testing, API test suite verification (`npm run test:api`), and Next.js production build (`npm run build:storefront`).
