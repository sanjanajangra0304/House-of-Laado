# House of Laado — Technical Operations Runbook

**Audience:** Full-Stack Developers, Site Reliability Engineers, and Technical Custodians.
**Version:** Production v1.0 (Pure JavaScript Monorepo)
**Last Updated:** October 2026

---

## 1. System Architecture & Component Topology

```
+-----------------------------------------------------------------------------------+
|                            HOUSE OF LAADO ARCHITECTURE                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Clients / Shoppers]                                                             |
|         │                                                                         |
|         ▼                                                                         |
|  [Vercel Global Edge CDN]                                                         |
|         │                                                                         |
|         ├── Next.js 14 App Router (Storefront: Port 3000)                         |
|         │   ├── /shop, /product/[slug], /cart, /checkout, /account, /admin        |
|         │   └── Static generation (SSG) + Incremental Static Regeneration (ISR)   |
|         │                                                                         |
|         ▼ (REST API: /api/v1/* via HTTPS)                                         |
|  [Render Web Service]                                                             |
|         │                                                                         |
|         ├── Express REST API (Port 5000)                                          |
|         │   ├── Helmet (HSTS, CSP, nosniff) + Security Middleware                 |
|         │   ├── NoSQL Query Sanitizer + HPP Parameter Pollution Defense           |
|         │   ├── OWASP Rate Limiters (Auth: 10/15m, Checkout: 30/15m)               |
|         │   └── Telemetry & Health Checks (/api/v1/health)                        |
|         │                                                                         |
|         ├── Third-Party Services                                                  |
|         │   ├── Razorpay Payment Gateway (UPI / Cards / Webhooks HMAC SHA-256)    |
|         │   ├── Shiprocket Logistics (6-Digit Indian PIN Code Serviceability)     |
|         │   └── Cloudinary CDN (Image Transformations & Uploads)                  |
|         │                                                                         |
|         ▼                                                                         |
|  [MongoDB Atlas (aws / ap-south-1 Mumbai)]                                        |
|         └── 24 Mongoose Models with B-tree Indexes & Atomic Counters              |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Standard Operational Commands (Windows PowerShell)

All operational scripts are managed via root `package.json` workspaces:

| Command | Action | Execution Frequency |
| :--- | :--- | :--- |
| `npm run dev:api` | Starts backend API dev server on port `5000` with hot reload (`--watch`). | Daily development |
| `npm run dev:storefront` | Starts Next.js storefront dev server on port `3000`. | Daily development |
| `npm run smoke` | Executes 15-point automated smoke test across live API & Storefront. | Post-deployment / daily |
| `npm run test:api` | Executes full 96-test automated API test suite across 8 modules. | Pre-commit / CI/CD |
| `npm run backup` | Dumps all 24 database collections into timestamped JSON snapshot. | Pre-deployment / daily |
| `npm run restore` | Restores the latest database snapshot from `backups/`. | Disaster recovery |
| `npm run drill` | Runs an automated sandbox disaster recovery drill with certificate. | Weekly / audit |
| `npm run benchmark` | Runs 25-worker HTTP load test against API endpoints. | Pre-campaign / scaling |
| `npm run seed:api` | Populates database with default admin, 8 products, and active coupons. | Initial provisioning |
| `npm run import:shopify`| Ingests Shopify CSV catalog export with automatic variant grouping. | Catalog migration |

---

## 3. Disaster Recovery & Snapshot Runbook

### 3.1 Taking a Manual Snapshot Before Major Updates
```powershell
npm run backup
```
- Snapshots are written to `backups/backup_<YYYY-MM-DDTHH-MM-SS-MSZ>/`.
- A `manifest.json` file records collection names, document counts, and timestamps.

### 3.2 Restoring from Disaster or Data Corruption
```powershell
# Restore to local development database:
npm run restore

# Restore to specific MongoDB Atlas cluster:
node scripts/restore-database.js "mongodb+srv://admin:pass@cluster.mongodb.net/house_of_laado"
```

### 3.3 Verifying Disaster Recovery Readiness
Run the automated sandbox drill:
```powershell
npm run drill
```
*Creates a temporary `house_of_laado_drill` database, hydrates all 24 collections, validates 100% document parity, tears down the drill database, and prints an official recovery certificate.*

---

## 4. Incident Response & Troubleshooting Playbook

### Incident A: High 5xx Error Rate / API Offline
1. **Check Telemetry:** Inspect `GET /api/v1/health`.
   - If `services.database !== "connected"`: Check MongoDB Atlas network access allowlist (`0.0.0.0/0` or Render outbound IPs).
   - If `system.heapUsedMb > 512MB`: Restart Render web service to clear Node.js memory leak.
2. **Review Correlation Logs:** Search Render logs for `X-Request-Id` associated with the failing transaction.
3. **Run Smoke Test:** Execute `npm run smoke` to identify which specific subsystem is throwing errors.

### Incident B: Razorpay Webhook Payment Not Reflecting on Order
1. Check Render logs for `[Razorpay Webhook Received]`.
2. Check `WebhookEvent` collection in MongoDB for event ID:
   ```javascript
   db.webhookevents.find({ eventId: "evt_..." });
   ```
3. If signature verification failed:
   - Ensure `RAZORPAY_WEBHOOK_SECRET` in Render environment matches the secret in Razorpay Dashboard $\rightarrow$ Webhooks.
4. If customer completed payment in modal but webhook was delayed:
   - The customer's browser automatically calls `POST /api/v1/orders/verify-payment` as a fallback, which verifies payment signature and updates order status to `placed` immediately.

### Incident C: Customer Account Lockout
1. If a legitimate customer locked themselves out after 5 consecutive password attempts:
   - The account automatically unlocks after 15 minutes.
   - For immediate admin unlock, connect to MongoDB and execute:
     ```javascript
     db.users.updateOne(
       { email: "customer@example.com" },
       { $set: { loginAttempts: 0, lockUntil: null } }
     );
     ```

### Incident D: Secret Rotation Protocol
When rotating `JWT_SECRET` or `RAZORPAY_KEY_SECRET`:
1. Generate new 32-character secret:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update the variable in Render Dashboard $\rightarrow$ Environment.
3. Trigger a manual redeploy. Active user sessions will be required to re-authenticate.

---

## 5. Peak Festive Season Scaling Guide

During major sales events (Diwali drop, Wedding season, flash sales):
1. **Compute Scaling:** Scale Render web service from *Starter* to *Standard* (2 GB RAM, 1 CPU).
2. **Database Scaling:** Scale MongoDB Atlas cluster from M0 to M10 for dedicated RAM and automatic daily point-in-time snapshots.
3. **Static Edge Caching:** Vercel automatically caches product pages at the edge; ensure `revalidate: 60` or ISR handles stock changes without loading backend servers.
4. **Load Benchmark Verification:** Run `npm run benchmark` before launching marketing campaigns to confirm ≥ 250 RPS throughput.
