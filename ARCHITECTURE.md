# House of Laado — Technical Architecture & System Design

**Platform:** House of Laado (Women's Ethnic Wear E-Commerce Platform)
**Version:** Production v1.0 (Pure Modern JavaScript Monorepo)
**Architecture Pattern:** Component-Based Next.js 14 Frontend + Model-View-Controller (MVC) Express API + MongoDB Atlas

---

## 1. High-Level Architectural Topology

```text
[ Shoppers / Mobile & Desktop Browsers ]
                 │
                 ▼
     [ Vercel Edge CDN Network ]
                 │
                 ├── Next.js 14 App Router (Storefront: Port 3000)
                 │   ├── SSR / Static / Dynamic Pages (43 Routes)
                 │   ├── Client Components (CartDrawer, ProductZoom, SearchModal)
                 │   ├── CartContext & AuthContext (LocalStorage `laado_*` + Cookies)
                 │   └── Single-Source Configuration (`config/brand.js`)
                 │
                 ▼ (REST API: /api/v1/* via HTTPS)
    [ Express MVC REST API (Port 5000) ]
                 │
                 ├── Security Pipeline: Helmet, CORS, RateLimiter, MongoSanitizer, HPP
                 ├── Request Routers (`src/routes/*`)
                 ├── Input Validators (`src/validators/*` with Joi)
                 ├── Controllers (`src/controllers/*` - HTTP parameter extraction & response)
                 ├── Services (`src/services/*` - Business logic, inventory, payments, emails)
                 ├── Models (`src/models/*` - 24 Mongoose Schemas with B-Tree indexes)
                 │
                 ▼ (Mongoose Connection Pool: min 5, max 100)
   [ MongoDB Atlas Cloud Cluster (aws / ap-south-1 Mumbai) ]
```

---

## 2. Backend MVC Structure (`apps/api/src/`)

The backend follows a strict **Model-View-Controller (MVC)** architectural design pattern where HTTP handling, input validation, core business logic, and database schemas are completely decoupled:

```text
apps/api/src/
├── config/
│   ├── database.js          # Mongoose connection manager with reconnection backoff & Atlas TLS
│   ├── environment.js       # Joi environment validation schema (halts boot if secrets missing)
│   └── env.js               # Backward-compatible environment export
├── controllers/
│   ├── authController.js    # Registration, login, logout, DPDP data export & erasure
│   ├── productController.js # Product CRUD, filtering, sorting, and category sync
│   ├── categoryController.js# Category management, hierarchy, and navigation tree
│   ├── orderController.js   # Checkout, COD, Razorpay verification, status updates, tracking
│   ├── reviewController.js  # Customer reviews submission, verified badge, owner replies
│   ├── adminController.js   # Executive dashboard KPIs, revenue analytics, audit logs
│   ├── uploadController.js  # Cloudinary authenticated image upload pipeline
│   ├── wishlistController.js# Guest and customer wishlist synchronization
│   ├── contentController.js # Journal/blog posts, dynamic pages, newsletter signups
│   ├── healthController.js  # System telemetry, database status, memory utilization
│   └── index.js             # Controllers barrel export
├── routes/
│   ├── authRoutes.js        # `/api/v1/auth/*`
│   ├── productRoutes.js     # `/api/v1/products/*`
│   ├── categoryRoutes.js    # `/api/v1/categories/*`
│   ├── orderRoutes.js       # `/api/v1/orders/*`
│   ├── reviewRoutes.js      # `/api/v1/reviews/*`
│   ├── adminRoutes.js       # `/api/v1/admin/*`
│   ├── uploadRoutes.js      # `/api/v1/uploads/*`
│   ├── wishlistRoutes.js    # `/api/v1/wishlist/*`
│   ├── contentRoutes.js     # `/api/v1/content/*`
│   ├── healthRoutes.js      # `/api/v1/health`
│   └── index.js             # Master API router mounting all modules on `/api/v1`
├── services/
│   ├── authService.js       # User lifecycle, password hashing (bcrypt), token issuance
│   ├── productService.js    # Catalog queries, stock decrement, pricing, auto-discounts
│   ├── orderService.js      # Dual-tier GST, coupon rules, COD validation, state transitions
│   ├── reviewService.js     # Review creation, average rating calculation
│   ├── adminService.js      # KPI aggregation pipelines (MongoDB aggregation framework)
│   ├── razorpayService.js   # Razorpay order generation & HMAC SHA-256 signature checks
│   ├── notificationService.js# Customer email and SMS/WhatsApp notification dispatch
│   ├── shiprocketService.js # Pincode serviceability check & automated courier manifestation
│   ├── uploadService.js     # Cloudinary image optimization & upload streams
│   └── index.js             # Services barrel export
├── models/
│   ├── User.js              # Customer, Staff, Admin, Owner schemas with bcrypt hooks
│   ├── Product.js           # Ethnic wear products, sizes (XS-XXL), colors, stock, discount
│   ├── Category.js          # Taxonomies (Suit Sets, Kurtas, Co-ords, Dresses, Bags)
│   ├── Order.js             # Order snapshots, item details, GST breakdown, shipment history
│   ├── Review.js            # Customer reviews, ratings (1-5), verified buyer flag
│   ├── Coupon.js            # Discount codes (percentage vs flat, min orders, expiry)
│   ├── InventoryReservation.js # 15-minute TTL stock hold for active checkouts
│   ├── Counter.js           # Atomic sequential order number generator (`ORD-10042`)
│   ├── AuditLog.js          # Administrative mutation audit log with IP and timestamp
│   ├── WebhookEvent.js      # Idempotent webhook tracking preventing duplicate executions
│   └── index.js             # 24 Mongoose models barrel export
├── middleware/
│   ├── authMiddleware.js    # JWT verification (`authenticateUser`), role checks (`authorizeRoles`)
│   ├── validateRequest.js   # Joi request schema validation (body, query, params)
│   ├── errorMiddleware.js   # Centralized error handler, operational vs programmer errors
│   ├── notFoundMiddleware.js# RFC 7807 404 response handler
│   ├── rateLimiting.js      # Granular IP rate limiters (auth, checkout, general)
│   └── security.js          # NoSQL operator sanitizer (`cleanMongoOperators`) & PII masker
├── validators/
│   ├── authValidator.js     # Registration, login, password change Joi schemas
│   ├── productValidator.js  # Product creation, update, and search query schemas
│   ├── orderValidator.js    # Checkout payload, shipping address, status update schemas
│   ├── reviewValidator.js   # Review submission schemas
│   └── index.js             # Validators barrel export
├── utils/
│   ├── apiResponse.js       # Standardized `{ success: true, data, meta }` response envelope
│   └── logger.js            # Structured JSON logger with `X-Request-Id` correlation
├── app.js                   # Express application configuration
└── server.js                # Server entry point with graceful shutdown hooks
```

---

## 3. Frontend Architecture (`apps/storefront/`)

The storefront is built using Next.js 14 App Router with React Server Components (RSC) for maximum SEO and performance, paired with optimized Client Components for high interactivity:

```text
apps/storefront/
├── app/
│   ├── layout.js            # Root HTML, Playfair Display & DM Sans fonts, OpenGraph metadata
│   ├── page.js              # High-conversion Homepage with Hero, Collections, and Testimonials
│   ├── (auth)/              # Login, register, and customer onboarding
│   ├── admin/               # Merchant dashboard, catalog table, order fulfillment
│   ├── cart/                # Full cart management, coupon engine, delivery calculator
│   ├── checkout/            # Checkout flow with shipping address and Razorpay/COD options
│   ├── collections/[slug]/  # Category product grid with live two-way query filter synchronization
│   ├── product/[slug]/      # PDP with dual-image zoom, size chart modal, stock chips, reviews
│   ├── track-order/         # Real-time order tracking by order number & phone
│   ├── sitemap.js           # Next.js dynamic XML sitemap
│   └── robots.js            # Next.js robots.txt directives
├── components/
│   ├── common/              # Buttons, Badges, Modals, Breadcrumbs, Accordions
│   ├── layout/              # AnnouncementBar, Header, MegaMenu, Footer, MobileNav
│   ├── product/             # ProductCard, ProductGrid, SizeChartModal, PincodeChecker
│   ├── home/                # HeroCarousel, CategoryShortcuts, TrendingCollections, Testimonials
│   ├── cart/                # CartDrawer, CartItemRow, CouponBox, FreeShippingProgressBar
│   └── admin/               # AdminHeader, AdminSidebar, ProductForm, OrderStatusDropdown
├── config/
│   └── brand.js             # Centralized brand identity, color tokens, and contact info
├── lib/
│   ├── cart-context.jsx     # Unified cart & wishlist state (with `laado_*` localStorage persistence)
│   ├── auth-context.jsx     # Customer & Admin authentication state
│   ├── api.js               # Robust HTTP client with error handling & base URL resolution
│   ├── razorpay.js          # Razorpay modal loader and verification client
│   └── seo.js               # OpenGraph, Twitter cards, and Schema.org JSON-LD generators
└── styles/
    └── globals.css          # Tailwind CSS utilities and custom design tokens
```

---

## 4. End-to-End Request Lifecycles & Data Flow

### 4.1 Customer Checkout & Inventory Reservation Flow

```text
[ Shopper ]
   │
   ├─► Enters Shipping Address & Pincode (e.g., 382424)
   │     │
   │     ▼ (GET /api/v1/orders/serviceability/382424)
   │     ShiprocketService validates serviceability & computes estimated delivery date
   │
   ├─► Clicks "Place Order" (Prepaid or COD)
   │     │
   │     ▼ (POST /api/v1/orders/checkout)
   │     1. Joi Schema validates address, phone, and items.
   │     2. OrderService fetches current product prices from database (never trusts client prices).
   │     3. Dual-tier GST is calculated: 5% for items ≤ ₹1,000, 12% for items > ₹1,000.
   │     4. InventoryReservation creates a 15-minute hold on requested variant sizes.
   │     5. If Razorpay: RazorpayService calls Razorpay API to generate `order_id`.
   │     6. Order record is created with status: "pending".
   │
   ├─► Online Payment Verification (Prepaid)
   │     │
   │     ▼ (POST /api/v1/orders/verify-payment)
   │     1. Cryptographic HMAC SHA-256 signature checked against `RAZORPAY_KEY_SECRET`.
   │     2. Order marked as "confirmed" and payment status marked as "captured".
   │     3. Permanent inventory stock decremented; reservation released.
   │     4. Order confirmation email/SMS queued for customer.
   │
   └─► Order Management & Tracking
         │
         ▼ (GET /api/v1/orders/track/:orderNumber)
         Public tracking displays 5-stage timeline: Placed ➔ Packed ➔ Dispatched ➔ In Transit ➔ Delivered.
```

---

## 5. Security & Privacy Architecture

The platform complies with **OWASP Top 10 API Security Risks (2023)** and **India's Digital Personal Data Protection Act, 2023 (DPDP Act)**:

1. **Password Security:** Salted hashing with `bcryptjs` using 12 salt rounds in Mongoose `pre("save")` hooks. Plaintext passwords are never stored or logged.
2. **Session Security:** Short-lived JWT access tokens stored in `HTTPOnly`, `Secure`, `SameSite=Lax` cookies to prevent Cross-Site Scripting (XSS) extraction.
3. **Brute-Force Account Protection:** 5 consecutive failed login attempts lock the account for 15 minutes. Generic error messages prevent username enumeration.
4. **Insecure Direct Object Reference (IDOR) Defense:** All order, profile, and address endpoints enforce ownership validation. Customer B is forbidden from accessing Customer A's order records (`403 FORBIDDEN`).
5. **NoSQL Injection Neutralization:** Express middleware recursively scans and strips all query and body keys starting with `$` or containing `.`.
6. **HTTP Parameter Pollution (HPP):** Duplicated query array parameters are flattened to prevent backend parameter pollution.
7. **PII Masking & Privacy:** Structured loggers automatically redact sensitive tokens, passwords, and credit card numbers, while masking emails (`cu***@domain.com`) and phone numbers (`******3332`).
8. **DPDP Act 2023 Compliance:**
   - **Data Portability:** `GET /api/v1/auth/me/export` provides a complete JSON archive of user profile and order history.
   - **Right to Erasure:** `DELETE /api/v1/auth/me` verifies the user password and permanently anonymizes personal identifiers while retaining necessary statutory GST audit records.
