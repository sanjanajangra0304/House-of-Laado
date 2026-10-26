# House of Laado — Production Deployment & Disaster Recovery Guide

This guide provides end-to-end instructions for deploying the **Next.js Storefront** and the **Express REST API** to production, establishing health telemetry monitoring, executing automated smoke tests, and performing disaster recovery backup/restore drills.

**Architecture:**
- **Storefront Frontend:** Next.js 14 App Router deployed to [Vercel](https://vercel.com) with edge CDN caching.
- **Backend REST API:** Node.js Express API deployed to [Render.com](https://render.com) (or Railway) in Singapore region.
- **Database:** MongoDB Atlas M0/M10 Cluster in `aws / ap-south-1` (Mumbai).
- **Logistics & Payments:** Razorpay Webhooks (HMAC SHA-256) and Shiprocket fulfillment.

---

## 1. MongoDB Atlas Setup (Cloud Database)

1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a new project named `HouseOfLaado`.
3. Deploy a cluster in **aws / ap-south-1 (Mumbai)** for lowest latency to Indian shoppers (<30ms).
4. Under **Database Access**:
   - Create a database user (e.g., `laado_admin`).
   - Generate a secure 32-character password.
5. Under **Network Access**:
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere (`0.0.0.0/0`)** so your Render/Railway backend server can connect dynamically.
6. Under **Clusters $\rightarrow$ Connect $\rightarrow$ Drivers**:
   - Copy connection string:
     ```
     mongodb+srv://laado_admin:<PASSWORD>@cluster0.abcde.mongodb.net/house_of_laado?retryWrites=true&w=majority
     ```

---

## 2. Backend Express API Deployment (Render Blueprint)

The repository provides an Infrastructure-as-Code blueprint in [`render.yaml`](file:///c:/Users/sanja/Clothing_website/render.yaml):

### 1-Click Blueprint Deployment:
1. Log in to [Render.com](https://render.com).
2. Click **New +** $\rightarrow$ **Blueprint**.
3. Select your GitHub repository (`Clothing_website`).
4. Render will parse [`render.yaml`](file:///c:/Users/sanja/Clothing_website/render.yaml) and automatically configure the `laado-api` web service.
5. Provide your production environment secrets:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `CLIENT_URL`: `https://houseoflaado.com` (or your Vercel deployment URL).
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Live Razorpay API keys.
   - `RAZORPAY_WEBHOOK_SECRET`: Live Razorpay webhook secret.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Live Cloudinary credentials.
   - `SHIPROCKET_EMAIL` & `SHIPROCKET_PASSWORD`: Shiprocket credentials.
6. Click **Apply**.
7. Once deployed, verify the health telemetry endpoint:
   ```
   https://api.houseoflaado.com/api/v1/health
   ```

---

## 3. Next.js Storefront Deployment (Vercel)

The storefront is configured via [`apps/storefront/vercel.json`](file:///c:/Users/sanja/Clothing_website/apps/storefront/vercel.json) with security headers and asset caching:

1. Log in to [Vercel](https://vercel.com) and click **Add New...** $\rightarrow$ **Project**.
2. Import your GitHub repository.
3. Configure the build settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `apps/storefront`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Configure Environment Variables:
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_STORE_NAME` | `House of Laado` | Configurable brand title |
   | `NEXT_PUBLIC_SITE_URL` | `https://houseoflaado.com` | Production canonical URL |
   | `NEXT_PUBLIC_API_URL` | `https://api.houseoflaado.com/api/v1` | Production backend API |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_...` | Live Razorpay key ID |
5. Click **Deploy**. Vercel will prerender all static and ISR routes to its global Edge network.

---

## 4. Disaster Recovery, Backups & Restore Runbook

The platform includes automated tools to take point-in-time database snapshots and verify zero-loss restore capability.

### 4.1 Creating a Database Snapshot

```powershell
npm run backup
```
*Exports all 24 Mongoose collections to timestamped JSON files in `backups/backup_<timestamp>/` with an integrity manifest.*

### 4.2 Restoring from Backup

```powershell
# Restore latest backup to active database:
npm run restore

# Or restore to a custom database target:
node scripts/restore-database.js "mongodb+srv://user:pass@cluster.mongodb.net/house_of_laado"
```

### 4.3 Running an Automated Restore Drill

To prove disaster recovery readiness without risking production data, the drill script dumps the database, restores it to an isolated sandbox (`house_of_laado_drill`), validates 100% collection parity, and cleans up:

```powershell
npm run drill
```

#### Official Restore Drill Certificate (Recorded October 2026):
```
==================================================================
             OFFICIAL RESTORE DRILL CERTIFICATE
==================================================================
Drill Status         : 100% SUCCESSFUL (PASSED)
Collections Verified : 24 collections
Total Records Tested : 167 documents
Data Loss Detected   : 0 bytes (0.0% data loss)
Recovery Time (RTO)  : 0.69 seconds
Recovery Point (RPO) : Zero loss, exact point-in-time snapshot
Executed At          : 2026-10-14T21:25:41.454Z
==================================================================
```

---

## 5. Post-Deployment Smoke Tests

Run the automated smoke test suite to verify that all 15 critical API and storefront routes are responding with `200 OK`:

```powershell
npm run smoke
```

### Verified Smoke Test Matrix:
1. `GET /api/v1/health` — 200 OK (Telemetry, memory, and database status)
2. `GET /api/v1/categories` — 200 OK (Category hierarchy)
3. `GET /api/v1/products?limit=4` — 200 OK (Catalogue pagination)
4. `GET /api/v1/orders/serviceability/302001` — 200 OK (Pincode serviceability)
5. `GET /api/v1/content/blog` — 200 OK (Editorial journal posts)
6. `GET /api/v1/content/pages/shipping-policy` — 200 OK (Policy pages)
7. `GET http://localhost:3000/` — 200 OK (Storefront Homepage)
8. `GET http://localhost:3000/shop` — 200 OK (Storefront Shop)
9. `GET http://localhost:3000/cart` — 200 OK (Cart Experience)
10. `GET http://localhost:3000/checkout` — 200 OK (Checkout Flow)
11. `GET http://localhost:3000/track-order` — 200 OK (Order Tracking)
12. `GET http://localhost:3000/account` — 200 OK (Customer Portal)
13. `GET http://localhost:3000/admin` — 200 OK (Admin Dashboard)
14. `GET http://localhost:3000/robots.txt` — 200 OK (Crawler Directives)
15. `GET http://localhost:3000/sitemap.xml` — 200 OK (Dynamic XML Sitemap)

---

## 6. Uptime Telemetry & Monitoring

- **Uptime Monitoring:** Configure [UptimeRobot](https://uptimerobot.com) or [Better Stack](https://betterstack.com) to ping `https://api.houseoflaado.com/api/v1/health` every 5 minutes.
- **Alerting Threshold:** Configure alerting if HTTP status !== 200 or `services.database !== "connected"`.
- **Log Management:** Render provides live log streaming; audit correlation IDs (`X-Request-Id`) allow tracing customer requests across the entire application stack.
