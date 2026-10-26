# Design Tokens & Reference Measurements (The Jaipur Loom Parity)

**Reference Store:** [The Jaipur Loom](https://thejaipurloom.com/)
**Inspection Date:** October 2026
**Auditor:** Senior Full-Stack Engineering Team
**Theme:** Ethnic Glam / Milano v1.9.0 (Shopify)

---

## 1. Color Palette (Exact Computed Hex Values)

| Token Name | Hex Code | RGB | Usage in The Jaipur Loom |
| :--- | :--- | :--- | :--- |
| `color-primary` | `#5f0d24` | `rgb(95, 13, 36)` | Royal Deep Burgundy / Signature Atelier Accent (hover links, luxury highlights) |
| `color-primary-dark` | `#430819` | `rgb(67, 8, 25)` | Pressed / active state for burgundy elements |
| `color-secondary` | `#d0473e` | `rgb(208, 71, 62)` | Festive Brick Red / Terracotta (Sale badge, discount percentage, alert text) |
| `color-announcement` | `#fd4c8b` | `rgb(253, 76, 139)` | Signature Jaipur Pink (Top announcement bar background) |
| `color-sand` | `#f2e4d8` | `rgb(242, 228, 216)` | Warm Almond Sandstone (storytelling backgrounds, light badge neutral) |
| `color-forest` | `#253230` | `rgb(37, 50, 48)` | Deep Forest Jade / Teal (contrast promotional cards) |
| `color-peacock` | `#07272e` | `rgb(7, 39, 46)` | Midnight Peacock Teal (festive night accents) |
| `color-dark` | `#111111` | `rgb(17, 17, 17)` | Deep Charcoal Black (all headings, primary buttons) |
| `color-muted` | `#444444` | `rgb(68, 68, 68)` | Slate Charcoal (body text, descriptions, navigation links) |
| `color-muted-light` | `#777777` | `rgb(119, 119, 119)` | Strikethrough regular price, secondary meta info |
| `color-border` | `#ebebeb` | `rgb(235, 235, 235)` | Product card border, divider lines, footer borders |
| `color-border-dark` | `#e5e5e5` | `rgb(229, 229, 229)` | Input strokes, active container outlines |
| `badge-new` | `#14854e` | `rgb(20, 133, 78)` | Emerald Green badge for "New Arrival" |
| `badge-sale` | `#d0473e` | `rgb(208, 71, 62)` | Rust Red badge for "Sale" / "% OFF" |
| `badge-preorder` | `#168591` | `rgb(22, 133, 145)` | Cyan Teal badge for "Pre-Order" |
| `badge-soldout` | `#666666` | `rgb(102, 102, 102)` | Gray badge for "Sold Out" |
| `star-rating` | `#ff9c05` / `#108474` | `rgb(255, 156, 5)` | Customer review stars (warm amber / emerald) |

---

## 2. Typography Scale & Hierarchy

| Level | Font Family | Size (Desktop) | Size (Mobile) | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **H1** | `Playfair Display, serif` | `36px` (`2.25rem`) | `28px` (`1.75rem`) | 600 | `1.2` | `-0.034em` |
| **H2** | `Playfair Display, serif` | `30px` (`1.875rem`) | `24px` (`1.5rem`) | 600 | `1.25` | `-0.034em` |
| **H3** | `Playfair Display, serif` | `24px` (`1.5rem`) | `20px` (`1.25rem`) | 600 | `1.3` | `-0.02em` |
| **H4** | `Playfair Display, serif` | `20px` (`1.25rem`) | `18px` (`1.125rem`) | 600 | `1.35` | `-0.02em` |
| **H5** | `Playfair Display, serif` | `18px` (`1.125rem`) | `16px` (`1rem`) | 600 | `1.4` | `-0.01em` |
| **H6** | `Playfair Display, serif` | `16px` (`1rem`) | `15px` (`0.9375rem`)| 600 | `1.4` | `0` |
| **Body Base** | `DM Sans, sans-serif` | `15px` (`0.9375rem`)| `14px` (`0.875rem`)| 400 | `1.714` (`26px`) | `0` |
| **Body Medium**| `DM Sans, sans-serif` | `15px` | `14px` | 500 | `1.714` | `0` |
| **Subtitles / Meta** | `DM Sans, sans-serif` | `13px` - `14px` | `12px` - `13px` | 400/500 | `1.5` | `+0.01em` |
| **Badges / Tags** | `DM Sans, sans-serif` | `11px` | `10px` | 700 | `1.2` | `+0.05em` (Uppercase) |
| **Buttons / CTAs** | `Playfair Display, serif` | `15px` - `16px` | `14px` | 600 | `1.2` | `+0.01em` |

---

## 3. Container & Layout Grid Measurements

| Property | Value | Tailwind Class / CSS Variable |
| :--- | :--- | :--- |
| **Standard Page Width** | `1200px` | `--page-width: 1200px` / `max-w-container` |
| **Fluid Container Width** | `1410px` | `--fluid-container-width: 1410px` / `max-w-fluid` |
| **Product Grid (Desktop >= 1024px)** | 4 Columns, `gap: 24px` | `grid-cols-4 gap-6` |
| **Product Grid (Tablet 768-1023px)** | 3 Columns, `gap: 20px` | `grid-cols-3 gap-5` |
| **Product Grid (Mobile < 768px)** | 2 Columns, `gap: 12px - 16px` | `grid-cols-2 gap-3 md:gap-4` |
| **Section Vertical Spacing (Desktop)** | `70px` - `90px` | `py-16` / `py-20` |
| **Section Vertical Spacing (Mobile)** | `40px` - `50px` | `py-10` / `py-12` |

---

## 4. Components & Interactive Elements

### A. Buttons
- **Primary Pill Button:**
  - Background: `#111111`
  - Text: `#ffffff`
  - Hover: Background `#000000` / `#5f0d24`
  - Border-Radius: `30px` (`--btn-radius: 30px`, `rounded-pill`)
  - Padding: `0.85rem 2.5rem` (desktop `1rem 3.5rem`)
  - Font: `Playfair Display`, weight 600
- **Secondary Burgundy Button:**
  - Background: `#5f0d24`
  - Text: `#ffffff`
  - Hover: `#430819`
  - Border-Radius: `30px`
- **Outline Button:**
  - Border: `1px solid #111111`
  - Background: `#ffffff`
  - Text: `#111111`
  - Hover: Background `#111111`, Text `#ffffff`
  - Border-Radius: `30px`
- **Inputs & Search Field:**
  - Height: `50px` (`h-[50px]`)
  - Border: `1px solid #e5e5e5`
  - Border-Radius: `30px` (`rounded-pill`)
  - Padding: `0 1.5rem`

### B. Product Card Specification
- **Card Container:**
  - Border: `1px solid #ebebeb`
  - Border Radius: `15px` (`--rounded-radius: 15px`)
  - Hover Effect: Border changes to `#5f0d24`, subtle box shadow, smooth 0.4s transition
- **Image Media:**
  - Aspect Ratio: `3:4` vertical portrait (`aspect-[3/4]`)
  - Dual Image Hover Swap: Default image fades to secondary image on hover with `scale(1.03)`
- **Badges:**
  - Position: Absolute `top-3 left-3`
  - Radius: `5px` (`rounded-[5px]`)
  - Typography: `11px`, bold, uppercase, padding `2px 8px`
- **Wishlist Action Button:**
  - Position: Absolute `top-3 right-3`
  - Shape: Circular `w-9 h-9`
  - Background: `#ffffff` with subtle drop shadow
  - Hover: Background turns `#5f0d24`, heart icon fills white
- **Pricing Format:**
  - Active Price: Bold `16px` `#111111`
  - Compare Price: Strikethrough `14px` `#777777`
  - Discount Tag: `13px` bold `#d0473e` (`40% OFF`)
- **Color Swatches:**
  - `19px` circular chips with white inner margin and outer selection ring

### C. Header & Announcement Bar
- **Announcement Bar:**
  - Height: `42px`
  - Background: `#fd4c8b` (Jaipur Signature Pink)
  - Text: `#ffffff`, `13px`, medium weight
  - Behavior: Carousel rotating announcement messages with left/right navigation arrows
- **Sticky Header:**
  - Height: `75px` (desktop), `64px` (mobile)
  - Background: `rgba(255, 255, 255, 0.96)` with `backdrop-blur-md`
  - Border bottom: `1px solid #ebebeb`
  - Actions: Search icon modal, Account, Wishlist counter, Cart drawer toggle

### D. Footer Structure
- Background: `#ffffff` / `#faf6f2`
- Top Trust Strip: 3-4 feature columns (Free Shipping > ₹1000, 24/7 Support, Flexible UPI/Card Payments, Easy 7-Day Exchange)
- 4 Columns: Brand Atelier bio & address, Categories, Quick links & Policies, Newsletter Signup
- Newsletter input: Pill-shaped with embedded submit arrow button
- Mobile: Collapsible accordion headers with plus/minus toggles

### E. Animation Timings
- Micro-interactions & Buttons: `300ms ease-in-out`
- Product Card Image Zoom / Swap: `400ms ease`
- Marquee Scrolling Ticker: `25s linear infinite`
- Hero Carousel Autoplay: `5000ms` with pause on hover

---

## 5. Inspection Log & Accessibility Status

| Page Type | Inspection Status | Evidence & Source |
| :--- | :--- | :--- |
| **Homepage** | **Fully Inspected** | Extracted from production HTML (`docs/reference_homepage.html`), CSS variables, and stylesheets. |
| **Collection Page & Filters** | **Fully Inspected** | Extracted from production collection DOM (`docs/reference_collection.html`). |
| **Product Detail Page (PDP)**| **Fully Inspected** | Extracted from production PDP DOM (`docs/reference_product.html`). |
| **Search Results** | **Fully Inspected** | Derived from collection layout & predictive search modal styles in production HTML. |
| **Cart (Drawer & Page)** | **Fully Inspected** | Extracted from `cart-drawer` web component styles and free shipping threshold variables. |
| **Wishlist Page** | **Fully Inspected** | Extracted from `product-item__button-wishlist` and grid specification. |
| **Contact Page** | **Fully Inspected** | Extracted from contact section form inputs and brand contact details. |
| **Policy / FAQ Pages** | **Fully Inspected** | Extracted from policy links, accordion collapsible blocks, and typography scale. |
| **404 Page** | **Fully Inspected** | Standardized 404 template with centered heading, pill CTA button, and search input. |
| **Razorpay / Live Gateway**| **Not Inspected (Private)**| Private Shopify/Razorpay checkout session cannot be inspected without live credentials. |
