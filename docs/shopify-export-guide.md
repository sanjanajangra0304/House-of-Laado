# Shopify Export & Data Import Guide for Shop Owner

This guide outlines exactly how the store owner exports their products, categories/collections, customers, orders, and images from the Shopify Admin, and how to import them directly into MongoDB & Cloudinary using `apps/api/scripts/import-shopify.js`.

---

## 1. Exporting Files from Shopify Admin

### A. Export Products
1. Log in to your **Shopify Admin** (`https://admin.shopify.com/store/<your-store>`).
2. Go to **Products** in the left sidebar.
3. Click the **Export** button at the top right of the product list.
4. In the dialog modal:
   - Select **All products**.
   - Under **Export as**, choose **CSV for Excel, Numbers, or other spreadsheet programs**.
5. Click **Export products**. Shopify will generate and email/download `products_export.csv`.
6. Save this file to: `apps/api/data/shopify/products_export.csv`.

---

### B. Export Collections / Categories
1. In Shopify Admin, navigate to **Products > Collections**.
2. Click **Export** (if available on your Shopify plan/theme) or use an app like **Matrixify / Excelify** or export via CSV.
3. If no separate collection CSV is exported, don't worry: our importer **automatically categorizes products** based on the `Product Category` or `Type` and `Tags` in `products_export.csv`.
4. If exported, save as: `apps/api/data/shopify/collections_export.csv`.

---

### C. Export Customers
1. In Shopify Admin, navigate to **Customers**.
2. Click the **Export** button at the top right.
3. Choose **All customers** and **CSV for Excel, Numbers, or other spreadsheet programs**.
4. Click **Export customers**.
5. Save this file to: `apps/api/data/shopify/customers_export.csv`.

---

### D. Export Orders
1. In Shopify Admin, navigate to **Orders**.
2. Click the **Export** button at the top right.
3. Choose **All orders** and **CSV for Excel, Numbers, or other spreadsheet programs**.
4. Click **Export orders**.
5. Save this file to: `apps/api/data/shopify/orders_export.csv`.

---

### E. Product Images & Cloudinary
- The `products_export.csv` file automatically contains live Shopify CDN URLs in the `Image Src` column.
- The importer can stream and upload these images directly to your **Cloudinary** media library, or from a local folder `apps/api/data/shopify/images/`.
- Ensure your `.env` in `apps/api/.env` has:
  ```env
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```

---

## 2. Running the Importer

From the project root in Windows PowerShell:

### Test with Dry Run (no database changes):
```powershell
node apps/api/scripts/import-shopify.js --dry-run
```

### Full Import to MongoDB & Cloudinary:
```powershell
node apps/api/scripts/import-shopify.js
```

### Import with custom data folder:
```powershell
node apps/api/scripts/import-shopify.js --dir=./custom_folder
```

### Skip Image Uploads (faster catalog refresh):
```powershell
node apps/api/scripts/import-shopify.js --skip-images
```

---

## 3. Imported Data Mapping

| Shopify Field | House of Laado Field | Behavior |
| :--- | :--- | :--- |
| `Handle` | `slug` | Unique URL handle for the product |
| `Title` | `name` | Product display name |
| `Body (HTML)` | `description` | Cleaned product description without HTML artifacts |
| `Type` / `Category` | `category` | Auto-upserted category and assigned ObjectId |
| `Option1 / Option2 (Size)` | `sizes` | Unique sizes array (XS, S, M, L, XL, XXL) |
| `Option1 / Option2 (Color)`| `colors` | Color name and auto-mapped hex code |
| `Variant Price` | `sellingPrice` | Best active selling price |
| `Variant Compare At Price` | `compareAtPrice` | Original strike-through price |
| `Variant Inventory Qty` | `stock` | Sum of variant inventory stock |
| `Image Src` | `primaryImage`, `images` | Uploaded to Cloudinary or referenced |
| `Tags (New, Bestseller)` | `isNewArrival`, `isBestSeller` | Boolean catalog filter flags |
