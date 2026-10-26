/**
 * Shopify Data Importer for MongoDB & Cloudinary
 *
 * Usage:
 *   node scripts/import-shopify.js [--dir=./data/shopify] [--dry-run] [--skip-images]
 *
 * Supported Exports:
 *   - products_export.csv
 *   - collections_export.csv (optional; auto-derived from product types if absent)
 *   - customers_export.csv
 *   - orders_export.csv
 *   - Downloaded images in ./data/shopify/images/ (optional)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import slugify from "slugify";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { Category } from "../src/models/Category.js";
import { Product } from "../src/models/Product.js";
import { User } from "../src/models/User.js";
import { Order } from "../src/models/Order.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------------------
// CLI Argument Parsing
// -----------------------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (flag, defaultValue = null) => {
  const match = args.find((a) => a.startsWith(`--${flag}=`));
  if (match) return match.split("=")[1];
  if (args.includes(`--${flag}`)) return true;
  return defaultValue;
};

const DATA_DIR = path.resolve(
  __dirname,
  getArg("dir", path.join(__dirname, "../data/shopify"))
);
const IS_DRY_RUN = Boolean(getArg("dry-run", false));
const SKIP_IMAGES = Boolean(getArg("skip-images", false));

// -----------------------------------------------------------------------------
// Robust RFC 4180 Compliant CSV Parser
// Handles escaped quotes, commas inside quotes, multiline values
// -----------------------------------------------------------------------------
function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentVal = "";
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++; // handle CRLF
      currentRow.push(currentVal.trim());
      if (currentRow.some((val) => val.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((val) => val.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim()); // Strip BOM
  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] !== undefined ? row[idx] : "";
    });
    return obj;
  });
}

function readCSVFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return parseCSV(content);
}

// -----------------------------------------------------------------------------
// Cloudinary Upload Utility (Uses Native Fetch or Cloudinary REST API)
// -----------------------------------------------------------------------------
async function uploadToCloudinary(filePathOrUrl) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return filePathOrUrl; // Return as-is if Cloudinary credentials are not configured
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "the_jaipur_loom/products";
    const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    const formData = new FormData();
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    if (filePathOrUrl.startsWith("http://") || filePathOrUrl.startsWith("https://")) {
      formData.append("file", filePathOrUrl);
    } else if (fs.existsSync(filePathOrUrl)) {
      const fileBuffer = fs.readFileSync(filePathOrUrl);
      const blob = new Blob([fileBuffer]);
      formData.append("file", blob, path.basename(filePathOrUrl));
    } else {
      return filePathOrUrl;
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.warn(`[Cloudinary Warning] Upload failed: ${data.error?.message || "Unknown error"}`);
      return filePathOrUrl;
    }
  } catch (err) {
    console.warn(`[Cloudinary Warning] Error uploading ${filePathOrUrl}: ${err.message}`);
    return filePathOrUrl;
  }
}

// -----------------------------------------------------------------------------
// Color Hex Mapping for Indian Ethnic Apparels
// -----------------------------------------------------------------------------
const COLOR_MAP = {
  red: "#d0473e",
  burgundy: "#5f0d24",
  maroon: "#800000",
  pink: "#fd4c8b",
  gulabi: "#fd4c8b",
  peach: "#f8b195",
  blue: "#2b4c7e",
  navy: "#1d2a44",
  indigo: "#1a2a6c",
  green: "#14854e",
  sage: "#9caf88",
  olive: "#556b2f",
  yellow: "#e6af2e",
  mustard: "#e1ad01",
  haldi: "#ffae19",
  orange: "#e67e22",
  rust: "#b7410e",
  white: "#ffffff",
  ivory: "#fffff0",
  offwhite: "#f9f8f6",
  cream: "#fdfbf7",
  beige: "#f5f5dc",
  black: "#111111",
  grey: "#808080",
  gray: "#808080",
  purple: "#6a0dad",
  lavender: "#e6e6fa",
  teal: "#008080",
  peacock: "#07272e",
};

function resolveColor(colorName) {
  if (!colorName) return { name: "Multicolor", hex: "#5f0d24" };
  const clean = colorName.trim();
  const lower = clean.toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) {
      return { name: clean, hex };
    }
  }
  return { name: clean, hex: "#5f0d24" };
}

// -----------------------------------------------------------------------------
// Main Importer Execution
// -----------------------------------------------------------------------------
async function runImporter() {
  console.log("==================================================================");
  console.log("       SHOPIFY DATA IMPORTER (VASTRA LOOM / THE JAIPUR LOOM)      ");
  console.log("==================================================================");
  console.log(`Directory:   ${DATA_DIR}`);
  console.log(`Dry Run:     ${IS_DRY_RUN}`);
  console.log(`Skip Images: ${SKIP_IMAGES}`);
  console.log("------------------------------------------------------------------");

  if (!fs.existsSync(DATA_DIR)) {
    console.log(`Creating import data directory at: ${DATA_DIR}`);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(path.join(DATA_DIR, "images"), { recursive: true });
  }

  await connectDB();

  // 1. IMPORT CATEGORIES
  console.log("\n[1/4] Processing Categories & Collections...");
  const categoriesFile = path.join(DATA_DIR, "collections_export.csv");
  const productsFile = path.join(DATA_DIR, "products_export.csv");

  const categoryMap = new Map(); // slug -> Category doc

  // Check if collections_export exists
  const rawCollections = readCSVFile(categoriesFile);
  if (rawCollections && rawCollections.length > 0) {
    console.log(`Found collections_export.csv with ${rawCollections.length} rows.`);
    for (const row of rawCollections) {
      const name = row.Title || row.Name || row.Handle;
      if (!name) continue;
      const slug = slugify(row.Handle || name, { lower: true, strict: true });
      const description = row.Description || row["Body (HTML)"] || "";
      const image = row.Image || row["Image Src"] || "";

      let cat = await Category.findOne({ slug });
      if (!cat && !IS_DRY_RUN) {
        cat = await Category.create({
          name,
          slug,
          description: description.replace(/<[^>]*>/g, "").trim(),
          image,
          isActive: true,
        });
      }
      if (cat) categoryMap.set(slug, cat);
    }
  }

  // 2. IMPORT PRODUCTS
  console.log("\n[2/4] Processing Products & Variants...");
  const rawProducts = readCSVFile(productsFile);
  if (!rawProducts || rawProducts.length === 0) {
    console.warn(`No products_export.csv found in ${DATA_DIR}.`);
    console.log("Please export products from Shopify admin and place in this directory.");
  } else {
    console.log(`Found products_export.csv with ${rawProducts.length} rows.`);

    // Group rows by Handle
    const productGroups = new Map();
    for (const row of rawProducts) {
      const handle = row.Handle;
      if (!handle) continue;
      if (!productGroups.has(handle)) {
        productGroups.set(handle, []);
      }
      productGroups.get(handle).push(row);
    }

    console.log(`Grouped into ${productGroups.size} unique products.`);

    let importedCount = 0;

    for (const [handle, rows] of productGroups.entries()) {
      const first = rows[0];
      const title = first.Title || handle;
      const bodyHtml = first["Body (HTML)"] || "";
      const cleanDesc = bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const productType = first["Type"] || first["Product Category"] || "Suit Sets";
      const tags = (first.Tags || "")
        .split(",")
        .map((t) => t.trim().toLowerCase());

      // Ensure Category exists
      const catSlug = slugify(productType, { lower: true, strict: true }) || "suit-sets";
      let cat = categoryMap.get(catSlug);
      if (!cat) {
        cat = await Category.findOne({ slug: catSlug });
        if (!cat && !IS_DRY_RUN) {
          cat = await Category.create({
            name: productType,
            slug: catSlug,
            description: `${productType} handcrafted collection.`,
            isActive: true,
          });
        }
        if (cat) categoryMap.set(catSlug, cat);
      }

      // Collect Variants & Options
      const sizesSet = new Set();
      const colorsMap = new Map();
      let totalStock = 0;
      let lowestPrice = Infinity;
      let highestCompareAt = 0;

      for (const row of rows) {
        // Options detection
        for (let i = 1; i <= 3; i++) {
          const optName = (row[`Option${i} Name`] || "").toLowerCase();
          const optVal = row[`Option${i} Value`];
          if (!optVal || optVal.toLowerCase() === "default title") continue;

          if (optName.includes("size")) {
            sizesSet.add(optVal.trim().toUpperCase());
          } else if (optName.includes("color") || optName.includes("colour")) {
            const colorObj = resolveColor(optVal);
            colorsMap.set(colorObj.name, colorObj);
          }
        }

        const price = parseFloat(row["Variant Price"]);
        if (!isNaN(price) && price > 0 && price < lowestPrice) {
          lowestPrice = price;
        }

        const compareAt = parseFloat(row["Variant Compare At Price"]);
        if (!isNaN(compareAt) && compareAt > highestCompareAt) {
          highestCompareAt = compareAt;
        }

        const qty = parseInt(row["Variant Inventory Qty"], 10);
        if (!isNaN(qty) && qty > 0) {
          totalStock += qty;
        }
      }

      // Collect Images
      const imageList = [];
      for (const row of rows) {
        const src = row["Image Src"];
        if (src && !imageList.includes(src)) {
          imageList.push(src);
        }
      }

      let primaryImage = imageList[0] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c";
      let secondaryImage = imageList[1] || "";
      let processedImages = imageList;

      // Upload to Cloudinary if enabled
      if (!SKIP_IMAGES && process.env.CLOUDINARY_CLOUD_NAME) {
        primaryImage = await uploadToCloudinary(primaryImage);
        if (secondaryImage) {
          secondaryImage = await uploadToCloudinary(secondaryImage);
        }
        processedImages = await Promise.all(
          imageList.slice(0, 6).map((img) => uploadToCloudinary(img))
        );
      }

      const finalSellingPrice = lowestPrice === Infinity ? 1499 : lowestPrice;
      const finalCompareAt = highestCompareAt > finalSellingPrice ? highestCompareAt : Math.round(finalSellingPrice * 1.5);
      const discountPercent = Math.round(
        ((finalCompareAt - finalSellingPrice) / finalCompareAt) * 100
      );

      // Fabric detection from tags or title
      let fabric = "100% Pure Jaipur Cotton";
      const fabricTag = tags.find((t) =>
        ["cotton", "chanderi", "mulmul", "silk", "cambric", "modal", "rayon", "organza", "linen"].some(
          (f) => t.includes(f)
        )
      );
      if (fabricTag) {
        fabric = fabricTag.charAt(0).toUpperCase() + fabricTag.slice(1);
      }

      const sizes = sizesSet.size > 0 ? Array.from(sizesSet) : ["XS", "S", "M", "L", "XL", "XXL"];
      const colors = colorsMap.size > 0 ? Array.from(colorsMap.values()) : [{ name: "Jaipur Loom", hex: "#5f0d24" }];

      const isPublished = (first.Published || "true").toLowerCase() === "true";
      const status = isPublished ? "active" : "draft";

      const productPayload = {
        name: title,
        slug: handle,
        category: cat ? cat._id : null,
        categorySlug: catSlug,
        fabric,
        description: cleanDesc || `${title} handcrafted in artisanal silhouette.`,
        sellingPrice: finalSellingPrice,
        compareAtPrice: finalCompareAt,
        discountPercent,
        sizes,
        colors,
        primaryImage,
        secondaryImage,
        images: processedImages,
        stock: totalStock > 0 ? totalStock : 25,
        isNewArrival: tags.some((t) => t.includes("new")),
        isBestSeller: tags.some((t) => t.includes("bestseller") || t.includes("best seller")),
        isFeatured: tags.some((t) => t.includes("featured") || t.includes("trending")),
        status,
      };

      if (!IS_DRY_RUN && cat) {
        await Product.findOneAndUpdate({ slug: handle }, productPayload, {
          upsert: true,
          new: true,
        });
      }

      importedCount++;
    }

    console.log(`Successfully processed ${importedCount} products.`);
  }

  // 3. IMPORT CUSTOMERS
  console.log("\n[3/4] Processing Customers...");
  const customersFile = path.join(DATA_DIR, "customers_export.csv");
  const rawCustomers = readCSVFile(customersFile);
  if (!rawCustomers || rawCustomers.length === 0) {
    console.warn(`No customers_export.csv found in ${DATA_DIR}. Skipping.`);
  } else {
    console.log(`Found customers_export.csv with ${rawCustomers.length} rows.`);
    let userCount = 0;
    for (const row of rawCustomers) {
      const email = (row.Email || "").toLowerCase().trim();
      if (!email || !email.includes("@")) continue;

      const firstName = row["First Name"] || "";
      const lastName = row["Last Name"] || "";
      const name = `${firstName} ${lastName}`.trim() || email.split("@")[0];
      const phone = row.Phone || row["Default Address Phone"] || "";

      const address = {
        fullName: name,
        phone: phone || "9876543210",
        streetAddress: row["Address1"] || row["Default Address Address1"] || "Shopify Customer Address",
        city: row["City"] || row["Default Address City"] || "Jaipur",
        state: row["Province"] || row["Default Address Province"] || "Rajasthan",
        pincode: row["Zip"] || row["Default Address Zip"] || "302001",
        isDefault: true,
      };

      if (!IS_DRY_RUN) {
        const existing = await User.findOne({ email });
        if (!existing) {
          await User.create({
            name,
            email,
            password: "CustomerPassword2026!", // Customer can reset via email
            role: "customer",
            phone,
            addresses: [address],
          });
        }
      }
      userCount++;
    }
    console.log(`Processed ${userCount} customer accounts.`);
  }

  // 4. IMPORT ORDERS
  console.log("\n[4/4] Processing Orders...");
  const ordersFile = path.join(DATA_DIR, "orders_export.csv");
  const rawOrders = readCSVFile(ordersFile);
  if (!rawOrders || rawOrders.length === 0) {
    console.warn(`No orders_export.csv found in ${DATA_DIR}. Skipping.`);
  } else {
    console.log(`Found orders_export.csv with ${rawOrders.length} rows.`);
    const orderGroups = new Map();
    for (const row of rawOrders) {
      const orderNum = row.Name || row["Order ID"];
      if (!orderNum) continue;
      if (!orderGroups.has(orderNum)) {
        orderGroups.set(orderNum, []);
      }
      orderGroups.get(orderNum).push(row);
    }

    console.log(`Grouped into ${orderGroups.size} unique orders.`);
    let orderCount = 0;

    for (const [orderNumber, items] of orderGroups.entries()) {
      const first = items[0];
      const email = (first.Email || "").toLowerCase().trim();
      const customerName = `${first["Shipping Name"] || first["Billing Name"] || "Customer"}`;

      const orderItems = [];
      let subtotal = 0;

      for (const item of items) {
        const itemName = item["Lineitem name"] || "Ethnic Apparels";
        const price = parseFloat(item["Lineitem price"]) || 999;
        const qty = parseInt(item["Lineitem quantity"], 10) || 1;
        subtotal += price * qty;

        // Try to find matching product
        const matchedProduct = await Product.findOne({
          name: new RegExp(itemName.slice(0, 15), "i"),
        });

        orderItems.push({
          product: matchedProduct ? matchedProduct._id : (await Product.findOne())?._id,
          name: itemName,
          price,
          quantity: qty,
          size: "M",
          color: "Default",
          image: matchedProduct ? matchedProduct.primaryImage : "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
        });
      }

      const shippingFee = parseFloat(first["Shipping"]) || 0;
      const discountAmount = parseFloat(first["Discount Amount"]) || 0;
      const grandTotal = parseFloat(first["Total"]) || subtotal + shippingFee - discountAmount;

      const financialStatus = (first["Financial Status"] || "").toLowerCase();
      const paymentStatus = financialStatus === "paid" ? "paid" : "pending";
      const paymentMethod = (first["Payment Method"] || "").toLowerCase().includes("cod") ? "cod" : "online";

      const fulfillmentStatus = (first["Fulfillment Status"] || "").toLowerCase();
      let orderStatus = "placed";
      if (fulfillmentStatus === "fulfilled") orderStatus = "delivered";
      else if (financialStatus === "paid") orderStatus = "confirmed";

      const orderPayload = {
        orderNumber,
        customerDetails: {
          fullName: customerName,
          email: email || "customer@store.com",
          phone: first["Shipping Phone"] || first["Billing Phone"] || "+91 9876543210",
        },
        shippingAddress: {
          streetAddress: first["Shipping Street"] || first["Shipping Address1"] || "Customer Address",
          city: first["Shipping City"] || "Jaipur",
          state: first["Shipping Province"] || first["Shipping State"] || "Rajasthan",
          pincode: first["Shipping Zip"] || "302001",
        },
        items: orderItems,
        pricing: {
          subtotal,
          discountAmount,
          shippingFee,
          grandTotal,
        },
        paymentMethod,
        paymentStatus,
        orderStatus,
        tracking: {
          courierName: "Delhivery Express",
          trackingNumber: first["Tracking Number"] || "",
        },
      };

      if (!IS_DRY_RUN && orderItems.length > 0) {
        await Order.findOneAndUpdate({ orderNumber }, orderPayload, {
          upsert: true,
          new: true,
        });
      }
      orderCount++;
    }

    console.log(`Processed ${orderCount} customer orders.`);
  }

  console.log("\n==================================================================");
  console.log("            SHOPIFY IMPORT COMPLETED SUCCESSFULLY!                ");
  console.log("==================================================================");

  await disconnectDB();
}

runImporter().catch(async (err) => {
  console.error("\n[IMPORT ERROR]:", err);
  await disconnectDB();
  process.exit(1);
});
