# Design Inspection Notes: Reference Store (The Jaipur Loom)

**Source URL:** `https://thejaipurloom.com/`
**Inspection Date:** October 2026
**Inspection Method:** Live HTTP analysis of HTML DOM, `critical.css`, `product-card.css`, theme settings, and Shopify Liquid asset bundles.
*(Note: Headless browser subagent interaction encountered a 503 API capacity limit during dynamic session recording, so all findings below are extracted directly from the live production DOM and linked stylesheets rather than synthesized.)*

---

## 1. Color Palette (Exact Computed Hex Values)

| Role | Hex Code | Usage & Context |
|---|---|---|
| **Primary Accent** | `#5f0d24` | Royal Deep Burgundy / Wine (RGB: `95, 13, 36`). Used for brand emphasis, hover states on links, product card border hover, and rich accent banners. |
| **Secondary Accent / Sale** | `#d0473e` | Terracotta / Festive Brick Red (RGB: `208, 71, 62`). Used for "Sale" badges, discount banners, and promotional alerts. |
| **Background (Default)** | `#ffffff` | Pure crisp white for homepage, category, and product cards. |
| **Warm Section Neutral** | `#f2e4d8` | Soft Almond / Sandstone Beige. Used for alternate section backgrounds and ethnic storytelling blocks. |
| **Dark Contrast Section** | `#253230` | Deep Forest Jade / Teal (RGB: `37, 50, 48`). Used for rich promotional blocks and contrast cards. |
| **Night Teal Accent** | `#07272e` | Deep Peacock / Midnight Teal for dark festive banners. |
| **Headings & Bold Text** | `#111111` | Deep Charcoal Black (RGB: `17, 17, 17`). High contrast for luxury feel. |
| **Body & Meta Text** | `#444444` | Muted Charcoal (RGB: `68, 68, 68`). High legibility, gentle on eyes. |
| **Border Neutral** | `#ebebeb` / `#e5e5e5` | Subtle gray dividing lines, card borders, and input strokes. |
| **Badge: New** | `#14854e` | Emerald green with `#ffffff` text. |
| **Badge: Sale** | `#d0473e` | Rust red with `#ffffff` text. |
| **Badge: Sold Out** | `#666666` | Neutral gray with `#ffffff` text. |
| **Badge: Pre-Order** | `#168591` | Cyan teal with `#ffffff` text. |
| **Review Stars** | `#108474` / `#fbcd0a` | Jade emerald (Judge.me widget) / Gold star filter. |

---

## 2. Typography

| Element | Font Family | Fallback | Weights Observed | Notes |
|---|---|---|---|---|
| **Headings (H1–H6)** | `Playfair Display` | `serif` | 400, 500, 600, 700, 800, 900 | Elegant high-contrast serif suitable for Indian ethnic luxury. Letter-spacing: `-0.034em`. |
| **Navigation & Menus** | `Playfair Display` | `serif` | 500, 600 | Refined luxury presentation in top navigation and mega menu. |
| **Body & Descriptions** | `DM Sans` | `sans-serif` | 400, 500, 700 | Highly legible geometric sans-serif. Line-height: `1.714`. Base size: `15px` (`1.4rem` to `1.5rem`). |
| **Buttons & Action CTAs** | `Playfair Display` | `serif` | 600 | Capitalized or title-case text with slight letter spacing (`+0.01em`). |

---

## 3. Component & Button Styles

- **Primary Buttons:**
  - Background: `#111111`
  - Text Color: `#ffffff`
  - Hover: Background `#000000` or `#5f0d24`, Text `#ffffff`
  - Border Radius: `30px` (pill-shaped)
  - Padding: `1rem 3rem` (mobile) to `1.5rem 5.5rem` (desktop)
  - Text Transform: Capitalize
- **Outline Buttons:**
  - Background: `#ffffff` (or transparent)
  - Text Color: `#111111`
  - Border: `1px solid #111111`
  - Border Radius: `30px`
- **Input Fields & Search:**
  - Height: `5rem` (`50px`)
  - Padding: `1rem 2rem`
  - Border Radius: `30px` (pill-shaped) or matching button radius
  - Border: `1px solid #e5e5e5`
  - Placeholder: `rgba(17, 17, 17, 0.6)`

---

## 4. Product Card Anatomy

1. **Card Container:**
   - Border: `1px solid #ebebeb`
   - Border Radius: `15px`
   - Overflow: `hidden`
   - Transition: `all 0.4s ease`
   - Hover Effect: Border changes to `#5f0d24` (Royal Burgundy); subtle scale on image (`scale(1.05)`).
   - Padding around info: `1rem` on mobile, `2rem` on desktop (`@media (min-width: 768px)`).
2. **Media / Images:**
   - Aspect Ratio: `3:4` vertical portrait (`aspect-[3/4]`).
   - Dual Image Swap: Front lifestyle photo on initial load, smooth cross-fade to back/detail photo on hover.
3. **Badges:**
   - Placed at top-left or top-right of image.
   - Border radius: `5px`.
   - Badges observed: `Sale`, `New Arrival`, `Pre-Order`.
4. **Information Area:**
   - Category / Fabric subtitle (e.g. "Pure Cotton Suit Set").
   - Product Title in `Playfair Display` (font weight 600).
   - Star Rating Widget (stars + count).
   - Price Display: Current selling price in bold `#111111` + strike-through regular price in `#777777` + discount percentage in `#d0473e`.
   - Circular Color Swatches: `19px` circles with inner and outer rings indicating available colors.
   - Wishlist Heart Icon: Positioned top-right of image, active fill in burgundy.

---

## 5. Layout, Breakpoints & Structure

- **Breakpoints Observed:**
  - Mobile: `< 768px`
  - Tablet: `768px - 1024px`
  - Desktop: `1025px - 1199px`
  - Large Desktop: `>= 1200px` (`max-width: 1200px`, fluid container: `1410px`).
- **Section Spacing:**
  - Mobile: `50px`
  - Desktop: `90px`

---

## 6. Homepage Sections in Flow Order

1. **Announcement Bar:**
   - Rotating promotional messages (e.g., "Extra 5% off on Prepaid Orders", "Free Shipping on Orders above ₹999").
   - Country / Currency Selector (INR active).
2. **Sticky Header:**
   - Left: Brand Logo (`Playfair Display` serif branding).
   - Center/Right: Live Predictive Search, Account / Login, Wishlist, Cart Drawer with quantity badge.
3. **Mega Menu Navigation:**
   - Home
   - Women's Wear:
     - Kurtas (A-line, Straight, Under ₹699)
     - Suit Sets (2-piece, 3-piece, Anarkali)
     - Lounge / Co-ord Sets
     - Tops / Short Kurtis
     - Dresses (Ethnic, Fusion)
     - Others (Bottoms, Reversible Quilted Jackets)
   - Bags (Tote, Vanity, Toiletry, Laptop Sleeves)
   - Special Prices (Sale collection)
   - Festive Edit
   - Kids (Girls, Boys)
   - Menswear (Kurta Sets, Nehru Jackets)
4. **Hero Banner Carousel:**
   - Full-width lifestyle photography with serif overlay headings and pill-shaped "Shop Now" CTA.
5. **Circular Category Shortcuts:**
   - Circular image tiles (Suit Sets, Dresses, Bags, Special Prices, Festive Edit, Kids, Menswear) with label underneath.
6. **Promotional Marquee Ticker:**
   - Auto-scrolling horizontal text ticker highlighting craft values (Handcrafted, 100% Breathable Cotton, Fast Delivery).
7. **Best Sellers Grid:**
   - 4 columns on desktop, 2 columns on mobile.
8. **Top Trending Collections:**
   - Visual collection cards leading to curated categories.
9. **Featured Highlights / Split Lifestyle Cards:**
   - 2-column editorial feature banners with CTAs.
10. **Happy Customers Testimonials:**
    - Verified buyer badge, star rating, customer photo, and quote.
11. **SEO Story Block:**
    - Clean serif typography explaining the brand's block print craft, fabric quality, and Jaipuri heritage.
12. **Latest Blog / Styling Cards:**
    - 3-column articles with cover photos, reading time, and excerpts.
13. **FAQ Accordion:**
    - Expandable questions on shipping times, wash care, return policy, and sizing.
14. **Trust Badges Strip:**
    - 4 icon features: Free Shipping in India, Easy Returns within 7 days, 100% Safe Payments (UPI/Cards), Dedicated Customer Support.
15. **Footer:**
    - Newsletter signup form with pill button.
    - Contact info: Jaipur address, phone, email, WhatsApp.
    - Quick links: About Us, Contact, Blogs, Exchange & Return Policy, Privacy Policy, Shipping Policy, Terms of Service.
    - Copyright and payment method badges.

---

## 7. Mobile UX

- **Sticky Mobile Bottom Navigation Bar:**
  - Icons: Home, Shop/Categories, Wishlist, Account, Cart (with counter).
- **Mobile Drawer Menu:**
  - Hamburger menu opens slide-out drawer with accordion expansion for multi-level categories.
- **Product Listing on Mobile:**
  - 2-column grid (`grid-cols-2 gap-3`) with touch-friendly cards and quick add buttons.

---

## 8. What Could NOT Be Inspected Live

- Dynamic browser subagent automated clicks/recordings failed due to a temporary Gemini API capacity error (503).
- Live checkout payment gateway steps (Razorpay modal) and private Shopify admin cannot be accessed externally.
- We will design cart drawer, checkout, and admin dashboard according to modern Indian e-commerce conventions matching these exact visual tokens.
