# Security & Compliance Checklist: House of Laado E-Commerce Platform

**Standard Reference:** OWASP Top 10 API Security Risks (2023) and India's Digital Personal Data Protection Act, 2023 (DPDP Act).
**Repository Version:** Production v1.0 (Pure JavaScript Monorepo)
**Date of Audit:** October 2026
**Overall Status:** **100% DONE — HARDENED & AUDITED**

---

## 1. Security Controls Verification Matrix

| # | Control Area | Specification | Implementation in Codebase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Password Security** | Bcrypt cost ≥ 12, salt generation, complex policy (≥ 8 chars, uppercase, lowercase, number, symbol), no plaintext storage. | [`apps/api/src/models/User.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/models/User.js): `bcrypt.genSalt(12)` in `pre("save")` hook. Joi validation in [`auth.validation.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/modules/auth/auth.validation.js). | **DONE** |
| **2** | **Session Security** | Short-lived JWT access tokens + HTTPOnly, Secure, SameSite cookies. Token revocation / logout everywhere. | [`apps/api/src/modules/auth/auth.controller.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/modules/auth/auth.controller.js): `COOKIE_OPTIONS` with `httpOnly: true`, `secure: production`, `sameSite: "lax"`. | **DONE** |
| **3** | **Account Safety & Lockout** | Brute-force lockout after 5 consecutive failed logins (15-min backoff), generic credential errors to prevent account enumeration. | [`apps/api/src/modules/auth/auth.service.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/modules/auth/auth.service.js): `user.loginAttempts >= 5` sets `lockUntil = 15m`. Identical `INVALID_CREDENTIALS` on wrong email vs password. | **DONE** |
| **4** | **Authorization & IDOR Defense** | Role checks (`customer`, `staff`, `admin`, `owner`) plus strict resource ownership checks on orders, addresses, and wishlist. | [`apps/api/src/modules/orders/order.controller.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/modules/orders/order.controller.js): IDOR check blocks Customer B from viewing Customer A's order (`403 FORBIDDEN`). | **DONE** |
| **5** | **Input Sanitization** | Joi validation on body, query, and params. MongoDB NoSQL injection defense (`$gt`, `$ne`, `$where`) and HTTP Parameter Pollution (`hpp`). | [`apps/api/src/middleware/security.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/middleware/security.js): `cleanMongoOperators` recursive sanitizer and `hpp` parameter flattener. | **DONE** |
| **6** | **Transport & Security Headers** | HTTPS in production, Helmet security headers, HSTS (`max-age=31536000`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, Permissions-Policy, CORS allowlist. | [`apps/api/src/app.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/app.js): Helmet configured with HSTS preload, CORS strictly bound to `env.clientUrl` and `localhost:3000`. | **DONE** |
| **7** | **Granular Rate Limiting** | Dedicated rate limits on credential endpoints, checkout, and contact inquiries to prevent flood attacks. | [`apps/api/src/middleware/rateLimiting.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/middleware/rateLimiting.js): `authLimiter` (10 req/15m), `checkoutLimiter` (30 req/15m), `contentLimiter` (15 req/10m). | **DONE** |
| **8** | **Media Uploads** | MIME allowlist (`image/jpeg`, `image/png`, `image/webp`), size limits (5MB), random file naming, Cloudinary authenticated upload pipeline. | [`apps/api/src/modules/uploads/upload.service.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/modules/uploads/upload.service.js): Multer memory storage with file type regex filter and size boundaries. | **DONE** |
| **9** | **Webhook Security** | Cryptographic HMAC SHA-256 signature verification and idempotent replay attack prevention. | [`apps/api/src/services/razorpay.service.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/services/razorpay.service.js): `crypto.createHmac("sha256")`. Duplicate event IDs rejected via `WebhookEvent` model. | **DONE** |
| **10** | **Secrets Management** | Zero plaintext secrets or API keys in Git repository. Strict startup validation via Joi env schema. `.env.example` templates provided. | [`apps/api/src/config/env.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/config/env.js): Halts server boot with clear error if `JWT_SECRET`, `MONGO_URI`, or `PORT` are missing. | **DONE** |
| **11** | **Structured Logging & PII Masking** | Request correlation ID (`X-Request-Id`) attached to all transactions. Automated PII masking for cards, CVVs, passwords, phone numbers, and emails. | [`apps/api/src/middleware/security.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/middleware/security.js): `sanitizePII()` redacts credentials, masks emails (`cu***@domain.com`) and phones (`******1234`). | **DONE** |
| **12** | **DPDP Act 2023 Readiness** | Customer Right to Access / Portability (`GET /api/v1/auth/me/export`) and Right to Erasure (`DELETE /api/v1/auth/me`) with statutory tax record retention. | [`apps/api/src/modules/auth/auth.service.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/modules/auth/auth.service.js): Full data export payload; password-verified account anonymization while retaining financial GST ledger records. | **DONE** |
| **13** | **COD & Financial Safeguards** | Maximum ceiling of ₹5,000 for Cash on Delivery (`COD_LIMIT_EXCEEDED`), flat ₹50 COD verification charge, and 15-minute inventory stock reservation. | [`apps/api/src/modules/orders/order.service.js`](file:///c:/Users/sanja/Clothing_website/apps/api/src/modules/orders/order.service.js): Enforces Indian e-commerce fraud prevention boundaries. | **DONE** |

---

## 2. Threat Model for Single-Brand Indian Fashion D2C Store

### 2.1 Assets Under Protection
1. **Customer Personal Identifiable Information (PII):** Full names, mobile phone numbers, physical residential delivery addresses, and PIN codes.
2. **Customer Accounts & Credentials:** Passwords, active JWT sessions, and saved address books.
3. **Financial & Order Records:** Payment transaction IDs, Razorpay order IDs, invoices, and GST tax breakdowns.
4. **Physical Inventory Stock:** SKU inventory levels, variant reservations, and warehouse availability.
5. **Administrative Controls:** Shop owner and staff dashboard access, price modification, and catalog publishing rights.

### 2.2 Threat Actors & Attack Scenarios

```
+-----------------------------------------------------------------------------------+
|                            THREAT ACTORS & ATTACK VECTORS                         |
+-----------------------------------------------------------------------------------+
|  1. Credential Stuffers    ---> Automated login dictionary attacks                |
|                                 Mitigation: 5-attempt lockout (15m) + authLimiter |
|                                                                                   |
|  2. Dishonest Shoppers     ---> IDOR: tampering with /orders/:id to view others   |
|                                 Mitigation: Strict user ownership verification    |
|                                                                                   |
|  3. Malicious Scrapers     ---> Heavy scraping of catalog and search endpoints    |
|                                 Mitigation: 300 req/15m generalLimiter + indexing |
|                                                                                   |
|  4. NoSQL Injectors        ---> Sending {$gt: ""} in login or query parameters    |
|                                 Mitigation: cleanMongoOperators middleware        |
|                                                                                   |
|  5. Webhook Replayers      ---> Resending processed payment webhooks              |
|                                 Mitigation: WebhookEvent unique ID deduplication  |
+-----------------------------------------------------------------------------------+
```

### 2.3 Residual Risk & Recommendations for Handover
- **Cloudflare / CDN Layer:** In production deployment, place Cloudflare Turnstile or WAF in front of the application to absorb DDoS traffic before reaching the Node.js server.
- **Database Backup Drill:** Run nightly MongoDB Atlas snapshots and test the restore script documented in [`docs/deployment-guide.md`](file:///c:/Users/sanja/Clothing_website/docs/deployment-guide.md).
- **Staff Principle of Least Privilege:** Assign store assistants the `staff` role (orders & shipments only) rather than `admin` or `owner` (revenue & coupon deletion).
