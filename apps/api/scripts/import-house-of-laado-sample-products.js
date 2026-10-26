/**
 * House of Laado — Safe Sample Catalog Importer
 *
 * Usage:
 *   Dry run (default - ZERO database writes):
 *     node apps/api/scripts/import-house-of-laado-sample-products.js
 *
 *   Apply import to development database (writes allowed with explicit confirmation):
 *     node apps/api/scripts/import-house-of-laado-sample-products.js --apply --confirm-dev-db=house_of_laado
 *
 *   Safe Cleanup (removes only demo records matching DEMO_DATA tags, SKUs, and slugs):
 *     node apps/api/scripts/import-house-of-laado-sample-products.js --cleanup --apply --confirm-dev-db=house_of_laado
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB, disconnectDB, getDBDetails } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { Category } from "../src/models/Category.js";
import { Product } from "../src/models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------------------
// CLI Argument Parsing & Safety Guards
// -----------------------------------------------------------------------------
const args = process.argv.slice(2);
const IS_APPLY = args.includes("--apply");
const IS_CLEANUP = args.includes("--cleanup");
const IS_DRY_RUN = !IS_APPLY;

// Extract target DB confirmation argument, e.g. --confirm-dev-db=house_of_laado
const confirmDbArg = args.find((a) => a.startsWith("--confirm-dev-db="));
const CONFIRMED_DEV_DB = confirmDbArg ? confirmDbArg.split("=")[1].trim() : null;

const EXPECTED_DEV_DB = process.env.MONGODB_DB_NAME || "house_of_laado";
const DATA_FILE = path.resolve(__dirname, "../data/house-of-laado-sample-products.json");

// Category definitions matching storefront categories.js
const REQUIRED_CATEGORIES = [
  { name: "Kurtas", slug: "kurtas", isFeatured: true, displayOrder: 1 },
  { name: "Suit Sets", slug: "suit-sets", isFeatured: true, displayOrder: 2 },
  { name: "Lounge/ Co-ord Sets", slug: "lounge-co-ord-sets", isFeatured: false, displayOrder: 3 },
  { name: "Tops/ Short Kurtis", slug: "tops-short-kurtis", isFeatured: false, displayOrder: 4 },
  { name: "Dresses", slug: "dresses", isFeatured: false, displayOrder: 5 },
  { name: "Bottoms & Jackets", slug: "bottoms", isFeatured: false, displayOrder: 6 },
  { name: "Bags", slug: "bags", isFeatured: false, displayOrder: 7 },
  { name: "Special Prices", slug: "special-prices", isSale: true, displayOrder: 8 },
  { name: "Festive Edit", slug: "festive-edit", isFeatured: true, displayOrder: 9 },
  { name: "Kids", slug: "kids-wear", isFeatured: false, displayOrder: 10 },
  { name: "Menswear", slug: "menswear", isFeatured: false, displayOrder: 11 },
];

async function runImporter() {
  console.log("\n==================================================================");
  console.log("       HOUSE OF LAADO — SAMPLE CATALOG IMPORTER (100 PRODUCTS)    ");
  console.log("==================================================================");
  console.log(`Execution Mode : ${IS_DRY_RUN ? "🔍 DRY RUN (Preview only, 0 database writes)" : "⚡ APPLY (Database modifications requested)"}`);
  console.log(`Target Action  : ${IS_CLEANUP ? "🗑️ CLEANUP DEMO DATA" : "📥 IMPORT SAMPLE CATALOG"}`);
  console.log(`Environment    : ${env.nodeEnv.toUpperCase()}`);

  // ---------------------------------------------------------------------------
  // SAFETY CHECK 1: Production Guard
  // ---------------------------------------------------------------------------
  if (env.nodeEnv === "production") {
    console.error("\n❌ [SAFETY ABORT] NODE_ENV is set to 'production'!");
    console.error("   Importing demo products into a production environment is strictly prohibited.");
    console.error("   Switch to a development environment before running this script.");
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // SAFETY CHECK 2: Validate Data File
  // ---------------------------------------------------------------------------
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`\n❌ [ERROR] Dataset file not found at: ${DATA_FILE}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(DATA_FILE, "utf8");
  let products = [];
  try {
    products = JSON.parse(rawContent);
  } catch (err) {
    console.error(`\n❌ [ERROR] Failed to parse JSON dataset: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(products) || products.length !== 100) {
    console.error(`\n❌ [ERROR] Invalid dataset: expected exactly 100 products, found ${products?.length || 0}.`);
    process.exit(1);
  }

  console.log(`✓ Loaded dataset: ${products.length} products found in JSON.`);

  // ---------------------------------------------------------------------------
  // Database Connection (Host masked for security)
  // ---------------------------------------------------------------------------
  console.log("\n[Database] Connecting to MongoDB...");
  await connectDB();
  const dbInfo = getDBDetails();
  const maskedHost = dbInfo.host ? dbInfo.host.replace(/(?<=.{4}).(?=.*@)/g, "*") : "connected";
  const connectedDbName = dbInfo.database;

  console.log(`[Database] Connected to database: '${connectedDbName}' on host '${maskedHost}'`);

  // ---------------------------------------------------------------------------
  // SAFETY CHECK 3: Database Target Verification (Do not rely on NODE_ENV alone)
  // ---------------------------------------------------------------------------
  const PROD_INDICATORS = ["prod", "production", "live", "primary"];
  const dbNameLower = (connectedDbName || "").toLowerCase();
  const hostLower = (dbInfo.host || "").toLowerCase();

  for (const indicator of PROD_INDICATORS) {
    if (dbNameLower.includes(indicator) || hostLower.includes(indicator)) {
      console.error(`\n❌ [FATAL SAFETY ABORT] Connected target '${connectedDbName}' (${maskedHost}) contains production indicator '${indicator}'!`);
      console.error("   Database writes are strictly prohibited on any production-associated target.");
      await disconnectDB();
      process.exit(1);
    }
  }

  // If writes are requested (--apply), enforce explicit database target confirmation
  if (IS_APPLY) {
    if (!CONFIRMED_DEV_DB) {
      console.error("\n❌ [SAFETY ABORT] Explicit database target confirmation is required before any writes!");
      console.error(`   The connected database is: '${connectedDbName}'`);
      console.error("   To proceed with database writes, you must provide the confirmation flag matching the target database:");
      console.error(`   --confirm-dev-db=${connectedDbName}\n`);
      await disconnectDB();
      process.exit(1);
    }

    if (CONFIRMED_DEV_DB !== connectedDbName) {
      console.error(`\n❌ [SAFETY ABORT] Database confirmation mismatch!`);
      console.error(`   Provided confirmation: '${CONFIRMED_DEV_DB}'`);
      console.error(`   Actual connected target: '${connectedDbName}'`);
      console.error("   Aborting to prevent writing to an unintended database.\n");
      await disconnectDB();
      process.exit(1);
    }

    console.log(`✓ Database target confirmed: writes authorized strictly for development database '${connectedDbName}'.`);
  }

  // ---------------------------------------------------------------------------
  // Branch A: CLEANUP DEMO RECORDS
  // ---------------------------------------------------------------------------
  if (IS_CLEANUP) {
    console.log("\n[Cleanup] Searching for demo records to remove safely...");
    // Strict multi-marker filter: requires DEMO_DATA tag, HOL-DEMO SKU, AND laado-demo slug
    const demoFilter = {
      tags: "DEMO_DATA",
      sku: /^HOL-DEMO-/,
      slug: /^laado-demo-/,
    };

    const count = await Product.countDocuments(demoFilter);
    console.log(`Found ${count} demo records matching safe cleanup filter.`);

    if (IS_DRY_RUN) {
      console.log(`\n🔍 [DRY RUN] Would remove ${count} demo products from database '${connectedDbName}'.`);
      console.log("   Zero records were deleted because --apply flag was not specified.");
    } else {
      const res = await Product.deleteMany(demoFilter);
      console.log(`\n✓ [APPLY] Successfully deleted ${res.deletedCount} demo products.`);
      console.log("   Real customer data, orders, and authentic inventory remain untouched.");
    }

    await disconnectDB();
    return;
  }

  // ---------------------------------------------------------------------------
  // Branch B: IMPORT SAMPLE CATALOG
  // ---------------------------------------------------------------------------

  // Step 1: In-Memory Schema Pre-Validation
  console.log("\n[Validation] Validating all 100 product records against Mongoose schema...");
  const dummyCategoryId = "600000000000000000000001";
  let validationErrors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const testDoc = new Product({
      ...p,
      category: dummyCategoryId,
    });
    const err = testDoc.validateSync();
    if (err) {
      console.error(`  ❌ Validation failed for product #${i + 1} (${p.slug}): ${err.message}`);
      validationErrors++;
    }
  }

  if (validationErrors > 0) {
    console.error(`\n❌ [VALIDATION FAILED] ${validationErrors} products failed schema validation. Aborting import.`);
    await disconnectDB();
    process.exit(1);
  }
  console.log("✓ All 100 product records passed strict schema validation.");

  // Step 2: Resolve Category ObjectIds
  console.log("\n[Categories] Resolving Category documents...");
  const categoryMap = {};

  for (const catDef of REQUIRED_CATEGORIES) {
    let catDoc = await Category.findOne({ slug: catDef.slug });
    if (!catDoc) {
      if (IS_APPLY) {
        catDoc = await Category.create({
          name: catDef.name,
          slug: catDef.slug,
          isSale: catDef.isSale || false,
          isFeatured: catDef.isFeatured || false,
          displayOrder: catDef.displayOrder || 0,
          isActive: true,
        });
        console.log(`  ✓ Created category: ${catDef.name} (${catDef.slug})`);
      } else {
        console.log(`  🔍 [Dry Run] Category '${catDef.slug}' does not exist in DB and would be created on apply.`);
        catDoc = { _id: dummyCategoryId, slug: catDef.slug };
      }
    } else {
      console.log(`  ✓ Found existing category: ${catDoc.name} (${catDoc.slug})`);
    }
    categoryMap[catDef.slug] = catDoc._id;
  }

  // Step 3: Analyze and Execute Product Import
  console.log(`\n[Catalog] Processing 100 sample products (${IS_DRY_RUN ? "DRY RUN" : "APPLY"})...`);
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedRealCount = 0;
  let errorCount = 0;

  for (const item of products) {
    try {
      const categoryId = categoryMap[item.categorySlug] || dummyCategoryId;

      // Check if product with same slug exists
      const existing = await Product.findOne({ slug: item.slug });

      if (existing) {
        // SAFETY: Never overwrite real (non-demo) products!
        const isExistingDemo =
          existing.tags &&
          existing.tags.includes("DEMO_DATA") &&
          existing.sku &&
          existing.sku.startsWith("HOL-DEMO-") &&
          existing.slug &&
          existing.slug.startsWith("laado-demo-");

        if (!isExistingDemo) {
          console.warn(`  ⚠️ [SKIP PROTECTED] Existing product '${item.slug}' is not demo data. Skipping to prevent overwrite.`);
          skippedRealCount++;
          continue;
        }

        if (IS_APPLY) {
          await Product.updateOne(
            { slug: item.slug },
            {
              ...item,
              category: categoryId,
            }
          );
        }
        updatedCount++;
      } else {
        if (IS_APPLY) {
          await Product.create({
            ...item,
            category: categoryId,
          });
        }
        insertedCount++;
      }
    } catch (err) {
      console.error(`  ❌ Error processing ${item.slug}: ${err.message}`);
      errorCount++;
    }
  }

  // ---------------------------------------------------------------------------
  // Summary Report
  // ---------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`         IMPORT SUMMARY: ${IS_DRY_RUN ? "DRY RUN COMPLETED" : "APPLY COMPLETED"}`);
  console.log("==================================================================");
  console.log(`  Total Dataset Records   : ${products.length}`);
  console.log(`  Would Insert / Inserted : ${insertedCount}`);
  console.log(`  Would Update / Updated  : ${updatedCount}`);
  console.log(`  Skipped Real Products   : ${skippedRealCount}`);
  console.log(`  Failed / Errors         : ${errorCount}`);
  console.log(`  Database Writes Made    : ${IS_DRY_RUN ? "0 (Pure Preview)" : insertedCount + updatedCount}`);
  console.log("==================================================================\n");

  if (IS_DRY_RUN) {
    console.log("ℹ️  This was a DRY RUN. Zero modifications were written to the database.");
    console.log("   To perform the actual import, run with the --apply flag and confirmed database name:\n");
    console.log(`   node apps/api/scripts/import-house-of-laado-sample-products.js --apply --confirm-dev-db=${connectedDbName}\n`);
  } else {
    console.log(`✓ All 100 sample products are now live in the development database '${connectedDbName}'!`);
  }

  await disconnectDB();
}

runImporter().catch(async (err) => {
  console.error("\n[CRITICAL ERROR]:", err.message);
  await disconnectDB();
  process.exit(1);
});
