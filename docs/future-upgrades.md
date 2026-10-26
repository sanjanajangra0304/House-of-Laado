# Future Upgrades & Scaling Architecture Guide

This document explains the advanced architectural components that were intentionally omitted from Version 1 (to keep the stack clean, reliable, and approachable) and provides beginner-friendly guidance on **what they are**, **why you might need them later**, and **how to introduce them step by step**.

---

## 1. Redis (In-Memory Caching & Session Storage)

### What is Redis?
Redis (Remote Dictionary Server) is a high-speed data store that keeps all information directly in your server's **RAM (Random Access Memory)** rather than writing and reading from a hard disk or solid-state drive like MongoDB. Because RAM access is instantaneous, Redis can read and write data in **less than 2 milliseconds**.

### Why would you need it later?
In Version 1, every time a shopper visits `/shop` or loads the homepage, your server queries MongoDB. With hundreds of shoppers, MongoDB handles this effortlessly. However, during a **festive sale (Diwali, Eid, Akshaya Tritiya)** with 5,000+ concurrent visitors looking at the same 50 suit sets:
1. MongoDB CPU usage spikes as thousands of identical queries are executed every second.
2. API response times slow down from 50ms to 800ms+.

With Redis:
- The first visitor's request fetches the suit sets from MongoDB and saves the JSON result in Redis for 10 minutes (`SETEX catalog:suit-sets 600 ...`).
- The next 4,999 visitors receive the cached data directly from Redis in **under 2ms**, completely shielding MongoDB from load.

### How to introduce Redis in Phase 8:
```javascript
// Step 1: Install ioredis in apps/api
// npm install ioredis

import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URI);

// Step 2: Cache Middleware for Express
export function cacheMiddleware(durationSeconds = 300) {
  return async (req, res, next) => {
    const cacheKey = `cache:${req.originalUrl}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Intercept res.json to store in Redis before returning
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (body?.success) {
        redis.setex(cacheKey, durationSeconds, JSON.stringify(body));
      }
      return originalJson(body);
    };

    next();
  };
}
```

---

## 2. Background Job Queues (BullMQ)

### What is BullMQ?
BullMQ is a background queue system built on top of Redis. It allows your web server to hand off time-consuming tasks to a separate "worker" process so the customer never waits.

### Why would you need it later?
When a customer clicks "Pay with Razorpay" and their payment is confirmed:
1. You want to generate a GST-compliant PDF invoice (takes ~1.5 seconds).
2. You want to send an SMS and WhatsApp notification via MSG91 / Twilio (takes ~1 second).
3. You want to send a formatted HTML confirmation email with tracking links (takes ~1 second).

If done inside the payment confirmation request, the customer's browser spins for 3.5 seconds. If the SMS provider is slow or temporarily down, the order request might timeout and fail!

With BullMQ:
- The order endpoint records the order, enqueues a background job: `orderQueue.add('sendOrderNotifications', { orderId })`, and returns HTTP 200 in **40 milliseconds**.
- A separate background worker picks up the job, generates the invoice, and sends the messages without slowing down the customer.
- If the SMS provider fails, BullMQ automatically retries the job 3 times with exponential backoff.

---

## 3. Docker & Containerization

### What is Docker?
Docker is a tool that bundles your Node.js application, its exact version of Node (v22), system libraries, and dependencies into an isolated virtual box called a **container**.

### Why would you need it later?
- **Zero Environment Mismatches:** Eliminates the classic problem: *"It worked perfectly on my Windows development laptop, but failed on the Linux production server."*
- **1-Command Local Spin-up:** Anyone joining your development team can clone the repository, run `docker-compose up`, and have the Storefront, API, and a local MongoDB instance running together instantly without installing Node, MongoDB, or tools individually.

### Sample `Dockerfile` for `apps/api`:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### Sample `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: ./apps/api
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGODB_URI=mongodb://mongo:27017/house_of_laado
      - JWT_SECRET=change_this_secret_in_production_123456
    depends_on:
      - mongo

  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

---

## 4. Multi-Vendor Marketplace Evolution

Currently, the store is cleanly built for **one shop owner** managing their own brand and inventory. If you ever choose to evolve into a multi-seller platform (like Etsy or Myntra Partner), here is the architectural path:

1. **Vendor Model:**
   - Create a `Vendor` schema storing seller brand name, GSTIN, pickup address (city/state/pincode), bank account details for payouts, and KYC status (`pending_verification`, `verified`, `suspended`).
2. **Product Ownership:**
   - Add a `vendor: { type: ObjectId, ref: 'Vendor' }` field to `Product.js`.
   - Add an approval workflow state: `approvalStatus: ['submitted', 'approved', 'rejected']`.
3. **Vendor Portal:**
   - Extend the `/admin` shell with a role gatekeeper:
     - `superadmin`: Access to all stores, commission settings, and global metrics.
     - `vendor`: Access strictly restricted to their own products and their portion of customer orders.
4. **Order Split Engine:**
   - If a customer buys a Kurta from Seller A in Jaipur and a Tote Bag from Seller B in Udaipur in one single cart, the checkout engine automatically splits the order into two fulfillment sub-orders with separate courier tracking numbers.
5. **Commission & Settlement Ledger:**
   - Create a `Payout` ledger tracking the platform commission percentage (e.g., 10%) deducted automatically before settling vendor balances.
