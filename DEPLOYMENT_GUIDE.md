# House of Laado — Production Deployment Guide

This guide provides step-by-step instructions for deploying the **House of Laado** e-commerce platform to production using standard cloud hosting providers.

---

## 1. Recommended Hosting Architecture

```
                       [ Customer & Shop Owner ]
                                  │
                                  ▼
                ┌───────────────────────────────────┐
                │  Next.js 14 Storefront (Vercel)   │
                │  https://houseoflaado.com         │
                └─────────────────┬─────────────────┘
                                  │ HTTPS API Requests
                                  ▼
                ┌───────────────────────────────────┐
                │  Express REST API (Render / Node) │
                │  https://api.houseoflaado.com     │
                └───────┬───────────────┬───────────┘
                        │               │
        ┌───────────────┴────┐   ┌──────┴───────────────┐
        ▼                    ▼   ▼                      ▼
  [MongoDB Atlas]       [Cloudinary]   [Razorpay Gateway]  [SMTP Email]
 (Database Cluster)      (Product CDN)  (Payment Processor) (Notifications)
```

---

## 2. Pre-Deployment Checklist

Before deploying, ensure you have access to:
1. **GitHub Repository** with the latest project code.
2. **MongoDB Atlas Account** with a provisioned M0 (Free) or dedicated cluster.
3. **Render Account** (or Railway/AWS) for the Express backend API.
4. **Vercel Account** for the Next.js storefront.
5. **Cloudinary Account** for product image hosting.
6. **Razorpay Account** (for online payments in INR).

---

## 3. Database Deployment (MongoDB Atlas)

1. **Sign in to MongoDB Atlas:** [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. **Network Access (IP Whitelist):**
   - In Atlas, go to **Security &rarr; Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) so that cloud hosting platforms (Render, Vercel) can reach the database.
3. **Database User:**
   - In Atlas, go to **Security &rarr; Database Access**.
   - Create a database user with `readWriteAnyDatabase` permissions.
4. **Get Connection String:**
   - In Atlas, click **Connect &rarr; Drivers &rarr; Node.js**.
   - Copy the SRV URI:
     ```
     mongodb+srv://<username>:<password>@cluster0.nyjuqgm.mongodb.net/house_of_laado?retryWrites=true&w=majority
     ```

---

## 4. Backend Deployment (Render)

The repository includes a ready-to-use [`render.yaml`](file:///c:/Users/sanja/Clothing_website/render.yaml) blueprint.

### Option A: Deploy via Blueprint (Fastest)
1. Sign in to [Render](https://render.com).
2. Click **New &rarr; Blueprint**.
3. Select your GitHub repository. Render will automatically detect `render.yaml`.
4. Fill in the required environment variables when prompted.

### Option B: Deploy Manually
1. In Render, click **New &rarr; Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `house-of-laado-api`
   - **Root Directory:** `apps/api`
   - **Runtime:** `Node`
   - **Region:** `Singapore` (lowest latency for India)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/v1/health`
4. Set the Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `CLIENT_URL`: `https://your-storefront.vercel.app` (or custom domain `https://houseoflaado.com`)
   - `MONGODB_URI`: `mongodb+srv://.../house_of_laado?retryWrites=true&w=majority`
   - `MONGODB_DB_NAME`: `house_of_laado`
   - `JWT_SECRET`: *(A random 32+ character hex string)*
   - `JWT_EXPIRES_IN`: `7d`
   - `ADMIN_EMAIL`: *(The shop owner's admin login email)*
   - `ADMIN_PASSWORD`: *(A secure password for the shop owner)*
   - `RAZORPAY_KEY_ID`: *(Your Razorpay Key ID)*
   - `RAZORPAY_KEY_SECRET`: *(Your Razorpay Secret Key)*
   - `RAZORPAY_WEBHOOK_SECRET`: *(Your Razorpay Webhook Secret)*
   - `CLOUDINARY_CLOUD_NAME`: *(Your Cloudinary Cloud Name)*
   - `CLOUDINARY_API_KEY`: *(Your Cloudinary API Key)*
   - `CLOUDINARY_API_SECRET`: *(Your Cloudinary API Secret)*
   - `SMTP_HOST`: `smtp.sendgrid.net` *(or your SMTP host)*
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: *(SMTP Username or API Key)*
   - `SMTP_PASS`: *(SMTP Password)*
   - `EMAIL_FROM`: `orders@houseoflaado.com`
5. Click **Deploy Web Service**.
6. Once deployed, note down your backend URL:
   `https://house-of-laado-api.onrender.com`

---

## 5. Frontend Deployment (Vercel)

The storefront is built on Next.js 14 and deploys to Vercel.

1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New &rarr; Project**.
3. Import your GitHub repository.
4. Configure project settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click Edit and select `apps/storefront`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. Configure Environment Variables in Vercel:
   - `NEXT_PUBLIC_STORE_NAME`: `House of Laado`
   - `NEXT_PUBLIC_SITE_URL`: `https://houseoflaado.com` (or your Vercel URL)
   - `NEXT_PUBLIC_API_URL`: `https://house-of-laado-api.onrender.com/api/v1`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: *(Your Razorpay Public Key ID)*
   - `NEXT_PUBLIC_INSTAGRAM_URL`: `https://www.instagram.com/house.of.laado/`
6. Click **Deploy**.
7. Once deployed, test the live URL.

---

## 6. Post-Deployment Verification (Smoke Testing)

Once both the backend and frontend are live, run the automated smoke test suite to verify all endpoints:

```bash
# Set your production URLs in environment
export API_BASE="https://house-of-laado-api.onrender.com"
export STOREFRONT_BASE="https://houseoflaado.com"

# Run smoke test
npm run smoke
```

### Manual Verification Checklist
- [ ] Visit `https://houseoflaado.com` — verify branding, hero, categories, and products.
- [ ] Browse `/shop` and test size, fabric, and price filters.
- [ ] Add an item to cart and proceed to `/checkout`.
- [ ] Place a Cash on Delivery (COD) order.
- [ ] Track the order using the generated `HOL-` order number at `/track-order`.
- [ ] Sign in to the Admin Dashboard at `/admin/login` using your configured admin credentials.
- [ ] Verify the newly placed order appears in the Admin Orders panel.
- [ ] Update the order status to `Confirmed` and assign a tracking number.
- [ ] Verify the tracking update reflects on the customer's tracking page.

---

## 7. Database Backup & Disaster Recovery

### Creating a Snapshot
Run the automated snapshot script locally or on a scheduled cron runner:
```bash
npm run backup
```
Snapshots are saved as JSON files in the `backups/backup_<timestamp>/` directory with a verification `manifest.json`.

### Restoring from a Snapshot
To restore a snapshot in case of emergency:
```bash
npm run restore
```

---

## 8. Rollback Procedure

If a deployed update contains an unexpected regression:

1. **Frontend Rollback (Vercel):**
   - Go to your Vercel Project &rarr; **Deployments**.
   - Find the previous working deployment.
   - Click the three dots (`...`) &rarr; **Promote to Production**. Vercel will instantly switch traffic with zero downtime.

2. **Backend Rollback (Render):**
   - Go to your Render Dashboard &rarr; `house-of-laado-api`.
   - Go to **Events &rarr; Deploys**.
   - Click **Rollback** on the previous stable deploy.
