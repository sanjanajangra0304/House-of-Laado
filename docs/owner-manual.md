# House of Laado — Non-Technical Store Owner Operations Manual

Welcome to your new online boutique platform! This guide is written in plain, beginner-friendly language to help you manage your daily store operations—adding new ethnic wear collections, fulfilling customer orders, running festive discount sales, and answering customer inquiries—without writing a single line of code.

---

## 1. Accessing the Admin Operations Portal

1. Open your web browser and go to your store URL:
   - **Local Development:** `http://localhost:3000/admin`
   - **Live Production:** `https://your-storefront.vercel.app/admin` (or your custom domain)
2. Log in with your store owner credentials:
   - **Email:** `admin@store.com` (or your configured email)
   - **Password:** Your secure password
3. **The Overview Dashboard:** Upon logging in, you will see your store's live pulse:
   - **Total Orders & Revenue:** Total sales volume across Prepaid (Razorpay UPI/Cards) and Cash on Delivery (COD).
   - **Inventory Status:** Products currently in stock and items running low (<5 units).
   - **Recent Activity:** Incoming customer orders awaiting packing and fulfillment.

---

## 2. Managing Your Clothing Catalogue

### 2.1 Adding a New Ethnic Fashion Product
1. Navigate to **Catalogue $\rightarrow$ Products** in the left navigation sidebar.
2. Click the burgundy **"+ Add Product"** button at the top right.
3. Fill in the product details:
   - **Title / Name:** (e.g., *"Gulabi Anarkali Pure Cotton Suit Set"*).
   - **Category:** Choose from *Suit Sets*, *Kurtas*, *Co-ord Sets*, *Dresses*, *Tops*, *Bags*, or *Festive*.
   - **Fabric & Craft Story:** (e.g., Fabric: *"100% Chanderi Silk"*, Craft: *"Hand Block Print"*).
   - **Description & Wash Care:** Mention styling tips and care instructions (e.g., *"Dry clean only for initial washes"*).
   - **Pricing:**
     - **Selling Price (₹):** The price customer pays (e.g., `2999`).
     - **MRP / Strike-through Price (₹):** Higher compare price (e.g., `3999`) to display a discount badge.
   - **Images:** Click the upload box to upload high-resolution images from your phone or laptop. The system automatically optimizes images for mobile loading.
   - **Sizes & Stock:** Enter available inventory for each size:
     - `XS`, `S`, `M`, `L`, `XL`, `XXL`.
4. Click **"Publish Product"**. The product immediately appears live in your storefront!

### 2.2 Updating Stock Levels or Archiving
- When a new batch arrives from Jaipur artisans, find the item in the list and click **Edit**.
- Update the stock numbers.
- If a seasonal piece is discontinued, toggle **Status** from *Active* to *Archived* to hide it from shoppers without deleting historical sales records.

---

## 3. Order Processing & Fulfillment Workflow

When a customer places an order, follow this 4-step workflow:

```
[1. Placed] --------> [2. Packed] --------> [3. Dispatched] --------> [4. Delivered]
Customer orders       You pack parcel       Courier picks up          Customer receives
& pays / COD          & print invoice       & AWB generated           & confirms receipt
```

### Step 1: Reviewing New Orders
1. Go to **Orders** in the sidebar.
2. Orders marked with a yellow **Placed** badge are awaiting your action.
3. Click an order number (e.g., `ORD-10042`) to review:
   - Customer name, mobile phone number, and delivery address.
   - Ordered items, selected sizes, and quantities.
   - Payment method (Prepaid UPI vs Cash on Delivery).
   - B2B GSTIN number or special delivery instructions (if provided).

### Step 2: Packing & Generating Invoice
1. Package the garments with tissue paper and packaging box.
2. Click **"Print Invoice"** in the order details to generate a GST-compliant tax invoice. Place a copy inside the shipment.
3. In the status dropdown, change status from **Placed** to **Packed**.

### Step 3: Courier Dispatch & AWB Tracking
1. Hand the package to your courier partner (Shiprocket / Delhivery / Bluedart).
2. Enter the **Courier Name** and **AWB Tracking Number** provided by the courier.
3. Update the status to **Dispatched**.
4. The system automatically creates a public tracking link for the customer at `/track-order`.

### Step 4: Completing Delivery
- Once the courier confirms delivery, update the status to **Delivered**.
- If a COD order was collected, the courier will remit the cash to your bank account.

---

## 4. Creating Festive Coupons & Discount Codes

Run promotional sales during Diwali, Eid, Rakhi, or wedding seasons:

1. Go to **Promotions $\rightarrow$ Coupons**.
2. Click **"+ Create Coupon"**.
3. Choose discount rules:
   - **Coupon Code:** (e.g., `FESTIVE20` or `JAIPUR15`).
   - **Discount Type:**
     - *Percentage:* e.g., `20%` off.
     - *Flat Rupee Amount:* e.g., `₹500` off.
   - **Minimum Purchase Threshold:** (e.g., Valid only on orders above `₹2,500`).
   - **Expiry Date:** Set when the promotion ends.
4. Click **"Save Coupon"**. Shoppers can immediately apply this code in their cart drawer or checkout page.

---

## 5. Customer Engagement & Support

### 5.1 Moderating Product Reviews
1. Go to **Customers $\rightarrow$ Reviews**.
2. Customers who purchased items receive a verified buyer badge.
3. Read the review. If you wish to thank the customer or clarify sizing, click **"Reply as Atelier"** to publish an official store owner note beneath the review.

### 5.2 Contact Inquiries & WhatsApp Orders
- **Inquiries:** Messages submitted through the Contact Us form appear under **Inquiries** in your dashboard with customer email and phone.
- **WhatsApp Floating Button:** Customers can tap the green WhatsApp button on any screen to start a live chat with your sales assistant for personalized sizing consultations.

---

## 6. Store Owner Emergency Quick-Help

| Issue | Quick Fix |
| :--- | :--- |
| **Customer entered incorrect shipping address** | Open the order in `/admin/orders`, click *Edit Customer Address*, and update the PIN code/street before dispatching. |
| **Customer wants to cancel before dispatch** | Open the order and change status to *Cancelled*. The platform automatically returns reserved garment stock back to your active inventory. |
| **High COD return refusal rate** | The system automatically caps COD at ₹5,000 and applies a ₹50 verification fee. For suspicious COD orders, call the customer's phone number to confirm before packing. |
| **Need to export customer list** | Under Settings $\rightarrow$ Data Export, download a CSV export of customer emails and phone numbers for SMS/WhatsApp marketing. |
