# House of Laado — Shop Owner Operating Guide & Handover

Welcome to your **House of Laado** e-commerce portal! This guide is written in plain, non-technical language to help you manage your online boutique, products, customer orders, inventory, and promotions every day.

---

## 1. Accessing Your Admin Portal

1. Open your web browser (Chrome, Safari, Edge, etc.).
2. Go to: **[https://houseoflaado.com/admin/login](https://houseoflaado.com/admin/login)**
   *(Or on your local preview computer: `http://localhost:3000/admin/login`)*
3. Enter your administrator email and password:
   - **Email:** The email configured in your settings (e.g. `admin@store.com` or `admin@houseoflaado.com`)
   - **Password:** Your administrator password
4. Click **Sign In to Dashboard**.

---

## 2. Managing Your Products & Clothing Catalog

You can add, edit, or remove products without writing code or editing files.

### How to Add a New Clothing Product
1. In the Admin sidebar, click **Products & Stock**.
2. Click the **+ Add New Product** button in the top-right corner.
3. Fill in the product details:
   - **Product Name:** (e.g., *Jaipuri Hand-Block Cotton Suit Set*)
   - **Category:** Select from the dropdown (e.g., *Suit Sets*, *Kurtas*, *Festive Edit*).
   - **Fabric:** (e.g., *100% Pure Cotton Mulmul*, *Chanderi Silk*).
   - **Regular Price (MRP):** The higher display price (e.g., *₹3,499*).
   - **Selling Price:** The actual price the customer pays (e.g., *₹2,499*).
   - **Stock Quantity:** Total units available across all sizes.
   - **Product Description:** Mention fit, wash care instructions, styling advice, and craftsmanship details.
   - **Sizes Available:** Check the boxes for `XS`, `S`, `M`, `L`, `XL`, `XXL`.
   - **Colors:** Add color name (e.g., *Maroon*, *Sage Green*) and hex code.
   - **Product Photo:** Upload your high-resolution product photography (JPEG, PNG, or WebP).
4. Click **Save & Publish Product**. The product will immediately appear on the storefront.

### How to Edit an Existing Product
1. Go to **Products & Stock**.
2. Find the product using the search box or category filter.
3. Click the **Edit (Pencil)** icon next to the product.
4. Modify prices, adjust stock quantities, or update photos.
5. Click **Update Product** to save changes.

### How to Temporarily Hide or Remove a Product
- To temporarily hide an item that is out of season without deleting historical sales records, set its status to **Inactive** or click **Archive**.
- Archiving ensures that past orders containing this product remain complete and viewable in customer order history.

---

## 3. Order Management & Shipping

When a customer places an order, it appears instantly in your admin portal.

### Understanding Order Statuses
Every order follows a clear journey:

| Status | What It Means | What Action to Take |
| :--- | :--- | :--- |
| **Placed** | The customer completed checkout (COD or Paid Online). | Review order items, size, and delivery address. |
| **Confirmed** | You verified the order is in stock and ready to pack. | Move to atelier packaging. |
| **Packed** | The garment has been pressed, checked, and boxed. | Generate shipping manifest and label. |
| **Dispatched** | Courier picked up the parcel. | Enter the **Courier Tracking Number (AWB)** so the customer can track it live. |
| **Delivered** | The parcel was delivered to the customer. | Order complete! Customer is eligible to write a verified review. |
| **Cancelled** | Order was cancelled before shipment. | Product stock is automatically returned to inventory. |
| **Return Requested** | Customer requested a size exchange or return. | Review customer reason and schedule pickup. |
| **Returned** | Returned garment received and inspected. | Process refund or dispatch replacement size. |

### How to Update an Order Status & Add a Tracking Number
1. Click **Orders** in the admin sidebar.
2. Click on the order you want to update (e.g. `HOL-046116-TAB`).
3. Select the new status from the dropdown (e.g. change from *Placed* to *Dispatched*).
4. Enter the **Courier Name** (e.g. *Delhivery Express*, *Blue Dart*) and the **Tracking Number** (AWB).
5. Click **Save Updates**. The customer can immediately see the update on their **Track Order** page.

---

## 4. Managing Returns & Exchanges

1. When a customer requests a size exchange or return from their account, the order status changes to **Return Requested**.
2. Go to **Orders** and filter by **Return Requested**.
3. Review the customer's stated reason (e.g., *“Size M fits slightly tight on shoulders, requesting exchange for size L”*).
4. If approved, arrange reverse pickup with your courier.
5. Once the original garment is received in good condition, mark the status as **Returned** or dispatch the replacement size.

---

## 5. Discount Coupons & Special Offers

1. In the admin sidebar, click **Coupons**.
2. Click **Create Coupon**:
   - **Code:** (e.g., `FESTIVE15`, `WELCOME10`).
   - **Discount Type:** Percentage (e.g., *15%*) or Flat Amount (e.g., *₹500*).
   - **Minimum Order Value:** (e.g., *₹1,999*).
   - **Expiry Date:** Set when the promotion ends.
3. Click **Activate Coupon**. Customers can now apply this coupon on the checkout page.

---

## 6. Identifying Low Stock & Reordering

- Your **Admin Dashboard** displays an alert whenever a product's stock drops to **10 units or fewer**.
- Check the **Low Stock Table** regularly to reorder popular fabrics and silhouettes from your Jaipuri master artisans before they run out.

---

## 7. Customer Reviews & Ratings

- Only customers who have placed and received an order can submit verified reviews.
- Reviews appear on the product page along with the aggregate star rating.
- If a review contains offensive language or spam, administrators can moderate or remove it from the Reviews panel.

---

## 8. What to Do if an Issue Occurs

| Symptom | Likely Cause | Solution |
| :--- | :--- | :--- |
| **Cannot log in to admin** | Incorrect password or 5 failed attempts locked the account for 15 mins. | Wait 15 minutes, or verify the credentials in your backend configuration. |
| **Photos not displaying** | Free image CDN quota exceeded or image link broken. | Check your Cloudinary storage dashboard. |
| **Customer says payment failed** | Bank OTP failed or card limits reached. | Advise the customer to try UPI or select Cash on Delivery (COD). |
| **Tracking not updating** | Tracking number entered with typos. | Open the order in the Admin Orders panel and re-enter the correct AWB number. |

---

## 9. Official Shop Owner Handover Checklist

Ensure the technical developer has transferred ownership of the following accounts directly to you:

- [ ] **Custom Domain Name:** Registered in your name on GoDaddy/Namecheap with DNS pointed to Vercel.
- [ ] **Vercel Account:** Created with your business email (`sanjanajangra0304@gmail.com`) for hosting the storefront.
- [ ] **Render/Node Host Account:** Created with your business email for running the backend API.
- [ ] **MongoDB Atlas Account:** Created with your business email, hosting the `house_of_laado` database cluster.
- [ ] **Razorpay Account:** Registered with your business bank account, GSTIN, and KYC for receiving customer payments.
- [ ] **Cloudinary Account:** For hosting your high-resolution product photos.
- [ ] **Email/SMS Provider (Optional):** SendGrid, Brevo, or Fast2SMS for customer notifications.
- [ ] **Administrator Credentials:** Handed over through a secure channel (never in plain email or public repos).
- [ ] **Disaster Recovery Backup:** Verified that `npm run backup` creates a local snapshot of your catalog and customer orders.
