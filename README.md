# House of Laado — Production Indian Ethnic E-Commerce Platform

A production-grade, full-stack MERN e-commerce platform engineered specifically for **House of Laado** (inspired by mom, crafted for every woman). Handcrafted in pure modern JavaScript (ES modules, React, Next.js 14 App Router, Express, and MongoDB Atlas).

---

## Architecture Overview

The repository is organized as a clean monorepo separating customer-facing storefront presentations from the enterprise REST API and database engine:

```text
Clothing_website/
├── apps/
│   ├── storefront/                 # Next.js 14 App Router (React, Tailwind CSS, Lucide Icons)
│   │   ├── app/                    # 43 Static, Dynamic, and ISR Pages (Catalog, PDP, Cart, Checkout, Admin, SEO)
│   │   │   ├── (auth)/             # Customer Login, Register, Password Recovery
│   │   │   ├── admin/              # Merchant Operations Portal (Dashboard, Catalog, Orders, Settings)
│   │   │   ├── cart/               # Dedicated Cart Experience with Coupons & Delivery Estimates
│   │   │   ├── checkout/           # Multi-step Indian Checkout (COD & Razorpay UPI/Cards)
│   │   │   ├── collections/        # Category Listings with Two-Way Query Filters & Sorting
│   │   │   ├── product/            # High-conversion PDP with Zoom, Swatches, Size Charts, Reviews
│   │   │   ├── track-order/        # Public 5-stage Courier Tracking (Shiprocket/Delhivery)
│   │   │   ├── sitemap.js          # Dynamic XML Sitemap Generator
│   │   │   └── robots.js           # Search Engine Crawler Directives
│   │   ├── components/             # Component-driven architecture (common, layout, product, home, cart, admin)
│   │   ├── config/brand.js         # Single-source Brand Configuration Layer (Palette, Contact, Announcements)
│   │   ├── data/                   # Initial Catalog, Categories, Blogs, and Testimonials
│   │   └── lib/                    # Cart Context, Auth Context, Razorpay & API Clients
│   │
│   └── api/                        # Express 4.x + Mongoose 8.x MVC REST API
│       ├── src/
│       │   ├── config/             # Database connection manager (Atlas replica set) & environment validation
│       │   ├── controllers/        # HTTP Request Handlers (Auth, Products, Orders, Reviews, Admin, Uploads)
│       │   ├── middleware/         # JWT Auth, Role-based Access Control, Centralized Errors, Rate Limiting, Helmet
│       │   ├── models/             # 24 Mongoose Schemas (User, Product, Category, Order, Review, AuditLog)
│       │   ├── routes/             # REST API Endpoint Routers (`/api/v1/*`)
│       │   ├── services/           # Business Logic Layer (Razorpay checkout, inventory reservation, email, notifications)
│       │   ├── utils/              # Standardized API response formatters & structured loggers
│       │   ├── validators/         # Request Body & Query Parameter Schemas (Joi)
│       │   ├── app.js              # Express Application Setup & Security Pipeline
│       │   └── server.js           # HTTP Server Initialization & Graceful Shutdown
│       ├── scripts/seed.js         # Cloud Database Seed Script
│       └── tests/                  # Automated Test Suites (113 passing tests across 29 test suites)
│
├── docs/                           # Technical Manuals & Operational Runbooks
│   ├── owner-manual.md             # Non-technical Store Owner Operations Guide
│   ├── runbook.md                  # Technical Incident Response & Operations Runbook
│   ├── deployment-guide.md         # Production Deployment on Vercel, Render & MongoDB Atlas
│   ├── security-checklist.md       # OWASP Top 10 & India DPDP Act 2023 Compliance Matrix
│   ├── load-testing.md             # Throughput & Latency Benchmarks (270+ RPS)
│   └── handover-checklist.md       # Sign-off & Account Transfer Checklist
│
├── scripts/                        # Database Backup, Disaster Recovery & Benchmark Utilities
│   ├── backup-database.js          # Exports all collections to timestamped JSON snapshots
│   ├── restore-database.js         # Restores snapshots to target MongoDB databases
│   ├── run-restore-drill.js        # Automated zero-loss disaster recovery drill
│   └── test-product-sync.js        # End-to-end admin product creation & customer storefront sync
│
├── ARCHITECTURE.md                 # Detailed Architectural Blueprint & Data Flow
├── REFACTOR_AUDIT.md               # Codebase Audit & Legacy References Assessment
├── REFACTOR_REPORT.md              # Detailed Refactoring Execution Log
└── package.json                    # Monorepo Scripts & Root Tooling
```

---

## Prerequisites

- **Node.js:** v18.17.0 or later (LTS recommended)
- **npm:** v9.0.0 or later
- **MongoDB:** MongoDB Atlas replica set or local MongoDB Community Server (v6.0+)
- **Operating System:** Windows, macOS, or Linux (PowerShell and Bash scripts supported)

---

## Quick Start (Local Development)

### 1. Install Dependencies
Run from the repository root:
```powershell
npm install
```

### 2. Configure Environment Variables
Copy the example environment files in both applications:

```powershell
# Backend API configuration
cp apps/api/.env.example apps/api/.env

# Storefront configuration
cp apps/storefront/.env.example apps/storefront/.env.local
```

Ensure `apps/api/.env` has a valid `MONGODB_URI` pointing to your MongoDB Atlas cluster or local MongoDB instance.

### 3. Start Development Servers

Open two terminal windows:

**Terminal 1 — Express REST API (Port 5000):**
```powershell
npm run dev:api
# Running at: http://localhost:5000
# Telemetry Health Check: http://localhost:5000/api/v1/health
```

**Terminal 2 — Next.js Storefront (Port 3000):**
```powershell
npm run dev:storefront
# Running at: http://localhost:3000
# Admin Portal: http://localhost:3000/admin
```

---

## Verification & Automated Test Suites

### 1. Product Synchronization Test Suite
Validates that administrative product creation, edits, and deletions instantly synchronize with the customer storefront and database:
```powershell
node scripts/test-product-sync.js
```
*Validates 5 test phases: Admin product creation, discount auto-calculation, storefront listing, editing, soft deletion/archiving, checkout purchase prevention for archived items, and RBAC enforcement.*

### 2. Full API & Security Test Suite
Runs the comprehensive native test suite across 9 test files:
```powershell
npm run test:api
```
*Executes 113 automated tests across 29 test suites validating authentication, JWT cookies, brute-force lockout, dual-tier GST calculation, inventory reservation, Razorpay webhooks HMAC SHA-256, IDOR protection, and DPDP Act 2023 compliance.*

### 3. Storefront Production Build
Verifies that all 43 static, dynamic, and ISR routes compile cleanly without warnings:
```powershell
npm run build:storefront
```

### 4. Disaster Recovery & Zero-Loss Drill
Verifies point-in-time database snapshots and automated recovery readiness:
```powershell
npm run drill
```
*Creates an isolated sandbox database, hydrates all collections, validates 100% document parity, tears down the drill database, and prints a recovery certificate.*

---

## Store Owner Admin Credentials

- **Admin Portal URL:** `http://localhost:3000/admin`
- **Admin Login:** `http://localhost:3000/admin/login`
- **Default Admin Email:** `admin@store.com`
- **Default Admin Password:** `AdminSecure2026!`

*(Alternative configured admin: `admin@houseoflaado.com` / `AdminSecurePassword123!`)*

---

## Key Business & Technical Features

1. **Luxury Indian Ethnic Wear Design System:**
   - Tailored palette: Royal Burgundy (`#3E0A14`), Rose (`#7D1F2E`), Soft Blush (`#E8B9B8`), Olive (`#5C6B2E`), and Warm Ivory (`#F6E8B8`).
   - Playfair Display serif headings and DM Sans body typography.
   - Dual-image hover swap, 19px swatches, multi-size quick add, and cursor zoom magnifying lens on product details.

2. **Indian E-Commerce Engine:**
   - 6-digit Indian PIN code delivery serviceability checker with live estimated delivery dates.
   - Dual-tier GST calculation (5% for garments $\le$ ₹1,000, 12% for garments $>$ ₹1,000).
   - Dynamic coupon engine (`WELCOME10`, `PREPAID5`, `FESTIVE20`).
   - Automatic 5% instant discount calculation on prepaid orders.
   - Free shipping progress bar (Free delivery over ₹1,000).

3. **Payments & Order Fulfillment:**
   - Razorpay standard checkout integration with fallback developer simulation sandbox.
   - Cash on Delivery (COD) flow with instant stock inventory reservation (15-minute hold).
   - 5-stage shipment timeline tracker (`/track-order`) with courier partner and AWB number.

4. **Merchant Admin Operations Portal:**
   - Real-time KPI sales metrics (Revenue, Orders, Active Items, Low Stock Warnings).
   - Product manager with stock editing, status toggle (`Active` / `Archived`), and Cloudinary image uploads.
   - Order fulfillment manager with courier tracking assignment.

5. **Security, Privacy & DPDP Act 2023:**
   - OWASP Top 10 compliant: Helmet HTTP headers, NoSQL query sanitization, and HTTP Parameter Pollution protection.
   - Account brute-force lockout (5 failed attempts trigger 15-minute backoff).
   - Customer Data Portability (`GET /api/v1/auth/me/export`) and Right to Erasure (`DELETE /api/v1/auth/me`).

---

## Documentation & Operational Runbooks

For in-depth operational procedures, consult the files in `docs/`:
- [`docs/owner-manual.md`](file:///c:/Users/sanja/Clothing_website/docs/owner-manual.md) — Non-technical manual for the shop owner.
- [`docs/runbook.md`](file:///c:/Users/sanja/Clothing_website/docs/runbook.md) — Technical operations and incident response.
- [`docs/deployment-guide.md`](file:///c:/Users/sanja/Clothing_website/docs/deployment-guide.md) — Cloud deployment guide (Vercel, Render, Atlas).
- [`docs/security-checklist.md`](file:///c:/Users/sanja/Clothing_website/docs/security-checklist.md) — Security controls and compliance verification.
- [`docs/handover-checklist.md`](file:///c:/Users/sanja/Clothing_website/docs/handover-checklist.md) — Formal handover and acceptance checklist.
