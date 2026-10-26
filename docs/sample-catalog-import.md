# House of Laado — 100-Product Sample Catalog Guide

This guide explains how to preview, validate, safely import, and clean up the 100-product sample fashion catalog for **House of Laado**.

---

## 1. Catalog Overview & Distribution

The catalog contains exactly **100 unique sample fashion products** tailored for Jaipur hand-block printed apparel, artisanal bags, and festive Indian wear.

| Major Category | Requested Count | Subcategories & Breakdown |
| :--- | :--- | :--- |
| **Women's Wear** | **35 Products** | **Kurtas (12)**: A-line (4), Straight (4), Under 699 (4)<br>**Suit Sets (8)**: 2-Piece Sets (4), 3-Piece Sets (4)<br>**Lounge/Co-ord Sets (5)**: Lounge Sets (2), Co-ord Sets (3)<br>**Tops/Short Kurtis (4)**: Casual Kurtis (2), Printed Tops (2)<br>**Dresses (4)**: Ethnic (2), Fusion (1), Others (1)<br>**Bottoms & Jackets (2)**: Bottoms (1), Reversible Quilted Jackets (1) |
| **Bags** | **15 Products** | **Artisanal Bags**: Tote Bags (4), Vanity Bags (4), Toiletry Bags (4), Laptop Sleeves (3) |
| **Special Prices** | **15 Products** | **Sale Categories**: Dresses - Sale (3), Kurtas - Sale (3), Lounge/Co-ord Sets - Sale (3), Suit Sets - Sale (3), Tops/Short Kurtis - Sale (3) *(All with verified compareAtPrice > sellingPrice)* |
| **Festive Edit** | **15 Products** | Luxury Chanderi silks, Banarasi brocades, Anarkalis, and zari booti sets (`isFeatured: true`) |
| **Kids Collection** | **10 Products** | **Girls (5)**: Anarkali frocks, sharara sets, tiered dresses<br>**Boys (5)**: Kurta pyjamas, bandhani kurtas, dhoti sets, Nehru jacket sets |
| **Menswear** | **10 Products** | **Short Kurtas (4)** *(Proposed)*<br>**Long Kurtas (3)** *(Proposed)*<br>**Nehru Jackets (3)** *(Proposed)* |
| **TOTAL** | **100 Products** | **Exactly 100 Unique Products** |

---

## 2. Safety Architecture

The importer was engineered with multi-layer safeguards:

1. **Default Dry Run**: Running the script without flags performs pure schema validation and preview. **Zero database writes occur**.
2. **Explicit `--apply` Flag Required**: Database writes are strictly locked behind the `--apply` flag.
3. **Production Guard**: If `NODE_ENV === "production"`, the importer aborts execution immediately.
4. **Zero Overwrite of Real Products**: If a product slug matches an existing non-demo item, the importer skips it to prevent overwriting genuine store items.
5. **Safe Demo Identification**: All 100 demo products have `tags: ["DEMO_DATA"]`, `sku: "HOL-DEMO-XXX"`, and `slug: "laado-demo-..."`.
6. **No Secret Exposure**: Database passwords, connection tokens, and raw URIs are never printed to terminal logs.

---

## 3. Step-by-Step Instructions

### Step 1: Preview with Dry Run (Zero DB Writes)

Run the import script in dry-run mode:

```bash
node apps/api/scripts/import-house-of-laado-sample-products.js
```

**Expected output:**
- Validates all 100 records against the Mongoose schema.
- Displays Category document resolutions.
- Shows total items that *would* be inserted.
- Confirms `0 Database Writes Made`.

---

### Step 2: Apply Import to Development Database

> [!IMPORTANT]
> Execute this step ONLY after verifying the preview and when you are ready to write the sample catalog to your development database.

```bash
node apps/api/scripts/import-house-of-laado-sample-products.js --apply --confirm-dev-db=house_of_laado
```

**What this does:**
- Verifies that the connected database target matches `house_of_laado` and contains no production indicators.
- Resolves / creates the necessary Category documents.
- Upserts the 100 sample products into MongoDB.
- Prints confirmation of inserted/updated items.
- Automatically links products to their category ObjectIds.

---

### Step 3: Verify on Storefront

Start both backend and storefront (if not already running):

```bash
npm run dev:api
npm run dev:storefront
```

Open your browser to:
- **All Products**: `http://localhost:3000/shop`
- **Women's Wear / Kurtas**: `http://localhost:3000/collections/kurtas`
- **A-line Subcategory**: `http://localhost:3000/collections/a-line`
- **Under 699**: `http://localhost:3000/collections/under-700`
- **Bags**: `http://localhost:3000/collections/bags`
- **Special Prices / Sale**: `http://localhost:3000/collections/special-prices`
- **Festive Edit**: `http://localhost:3000/collections/festive-edit`
- **Kids**: `http://localhost:3000/collections/kids-wear`
- **Menswear**: `http://localhost:3000/collections/menswear`

---

### Step 4: Safe Cleanup / Rollback

If you ever wish to remove all demo products without touching your authentic products, orders, or users:

#### Preview cleanup (Dry run):
```bash
node apps/api/scripts/import-house-of-laado-sample-products.js --cleanup
```

#### Execute cleanup:
```bash
node apps/api/scripts/import-house-of-laado-sample-products.js --cleanup --apply --confirm-dev-db=house_of_laado
```

---

## 4. Price Band Reference

| Category | Allowed Band | Generated Catalog Price Range |
| :--- | :--- | :--- |
| Basic tops | ₹399–₹999 | ₹479–₹699 |
| Kurtas | ₹499–₹1,499 | ₹499–₹1,299 |
| Suit sets | ₹899–₹2,499 | ₹1,149–₹2,499 |
| Dresses & Co-ord sets | ₹799–₹2,999 | ₹899–₹1,849 |
| Bags | ₹399–₹1,999 | ₹599–₹1,199 |
| Festive outfits | ₹1,299–₹4,999 | ₹1,899–₹4,699 |
| Kids' outfits | ₹399–₹1,499 | ₹599–₹1,399 |
| Men's outfits | ₹799–₹2,499 | ₹849–₹1,999 |
| **Under 699 Rule** | **< ₹699** | **₹499, ₹549, ₹599, ₹649** |

---

## 5. Media Verification & Licensing

- **Images**: 65 unique high-resolution fashion photographs sourced from the verified Unsplash commercial-use pool. All URLs returned `HTTP 200 OK` on automated verification.
- **Videos**: None attached (no dedicated video Mongoose model exists; optional per Phase 5 to avoid schema pollution).
- **Stock Flag**: Stock level is defaulted to 20 units per product as clearly identified demo data.
