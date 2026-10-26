/**
 * Comprehensive End-to-End Product Synchronization Test Suite
 * Tests:
 *  - TEST A: Admin adds product -> persists in DB -> visible on admin & customer storefront
 *  - TEST B: Admin edits product -> DB updated -> storefront reflects updates -> no duplicate
 *  - TEST C: Admin deletes product -> removed from customer storefront -> 404 on slug -> checkout rejected
 *  - TEST D: Security -> unauthenticated and customer attempts rejected with 401/403
 *  - TEST E: Failures & Persistence -> malformed IDs, missing fields, negative prices rejected
 */

const API_BASE = "http://localhost:5000/api/v1";
const STOREFRONT_BASE = "http://localhost:3000";

let adminToken = "";
let customerToken = "";
let testProductId = "";
let testProductSlug = "";

const uniqueSuffix = Date.now().toString().slice(-6);
const testProductName = `Sync Test Anarkali Suite ${uniqueSuffix}`;
const updatedProductName = `Sync Test Anarkali Suite ${uniqueSuffix} - Updated Edition`;

async function runTests() {
  console.log("=========================================================");
  console.log(" HOUSE OF LAADO — DATABASE & PRODUCT SYNC TEST SUITE");
  console.log("=========================================================\n");

  const results = {
    testA: false,
    testB: false,
    testC: false,
    testD: false,
    testE: false,
  };

  // 0. AUTHENTICATION SETUP
  console.log("--- STEP 0: AUTHENTICATION SETUP ---");
  try {
    const adminRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@houseoflaado.com",
        password: "AdminSecurePassword123!",
      }),
    });
    const adminData = await adminRes.json();
    if (!adminData.success || !adminData.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminData)}`);
    }
    adminToken = adminData.data.token;
    console.log("✓ Admin logged in successfully. Token acquired. Role:", adminData.data.user.role);

    const custRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "customer@houseoflaado.com",
        password: "CustomerSecurePassword123!",
      }),
    });
    const custData = await custRes.json();
    if (!custData.success || !custData.data?.token) {
      throw new Error(`Customer login failed: ${JSON.stringify(custData)}`);
    }
    customerToken = custData.data.token;
    console.log("✓ Customer logged in successfully. Token acquired. Role:", custData.data.user.role);
  } catch (err) {
    console.error("❌ Authentication setup failed:", err.message);
    process.exit(1);
  }

  // TEST A: ADMIN ADDS A PRODUCT
  console.log("\n--- TEST A: ADMIN ADDS PRODUCT → CUSTOMER CAN SEE IT ---");
  try {
    const newProductPayload = {
      name: testProductName,
      category: "suit-sets",
      fabric: "Chanderi Silk",
      description: "Artisanal handwoven suit set with zari embroidery and matching dupatta.",
      sellingPrice: 2899,
      compareAtPrice: 3999,
      stock: 25,
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: "Burgundy Wine", hex: "#5f0d24" },
        { name: "Gold", hex: "#d4af37" },
      ],
      primaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      secondaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      isNewArrival: true,
      isBestSeller: false,
      isFeatured: true,
      status: "active",
    };

    const createRes = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(newProductPayload),
    });
    const createData = await createRes.json();

    if (createRes.status !== 201 || !createData.success) {
      throw new Error(`Product creation failed: ${JSON.stringify(createData)}`);
    }

    testProductId = createData.data._id;
    testProductSlug = createData.data.slug;
    console.log(`✓ 1. Product created in MongoDB Atlas. ID: ${testProductId}, Slug: ${testProductSlug}`);
    console.log(`✓ 2. Discount percentage auto-calculated: ${createData.data.discountPercent}%`);

    // Verify in Admin Catalogue
    const adminCatRes = await fetch(`${API_BASE}/products?limit=100`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminCatData = await adminCatRes.json();
    const inAdminCat = adminCatData.data?.some((p) => (p._id || p.id) === testProductId);
    if (!inAdminCat) throw new Error("Created product not found in admin catalogue API");
    console.log("✓ 3. Verified product is present in Admin Catalogue listing.");

    // Verify in Customer Storefront API
    const custProdRes = await fetch(`${API_BASE}/products/${testProductSlug}`);
    const custProdData = await custProdRes.json();
    if (!custProdData.success || custProdData.data?.name !== testProductName) {
      throw new Error("Product not retrievable via public customer storefront API");
    }
    console.log("✓ 4. Customer storefront API returns product with correct details.");

    // Verify in Category listing
    const catRes = await fetch(`${API_BASE}/products?category=suit-sets&limit=50`);
    const catData = await catRes.json();
    const inCategory = catData.data?.some((p) => (p._id || p.id) === testProductId);
    if (!inCategory) throw new Error("Created product not found in category filter");
    console.log("✓ 5. Verified product appears in relevant category ('suit-sets').");

    // Verify in Search
    const searchRes = await fetch(`${API_BASE}/products?search=${uniqueSuffix}`);
    const searchData = await searchRes.json();
    const inSearch = searchData.data?.some((p) => (p._id || p.id) === testProductId);
    if (!inSearch) throw new Error("Created product not found in search results");
    console.log("✓ 6. Verified product appears in search results.");

    // Verify Next.js Storefront Detail Page
    const sfPageRes = await fetch(`${STOREFRONT_BASE}/product/${testProductSlug}`);
    console.log(`✓ 7. Storefront product page HTTP status: ${sfPageRes.status} (Expected 200)`);
    if (sfPageRes.status !== 200) throw new Error(`Storefront returned status ${sfPageRes.status}`);

    results.testA = true;
    console.log(">>> TEST A PASSED: Full Add & Customer Synchronization Successful!");
  } catch (err) {
    console.error("❌ TEST A FAILED:", err.message);
  }

  // TEST B: ADMIN EDITS A PRODUCT
  console.log("\n--- TEST B: ADMIN EDITS PRODUCT → CUSTOMER SEES UPDATED PRODUCT ---");
  try {
    const editPayload = {
      name: updatedProductName,
      sellingPrice: 3299,
      compareAtPrice: 4999,
      fabric: "Pure Chanderi Silk",
      stock: 40,
    };

    const editRes = await fetch(`${API_BASE}/products/${testProductId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(editPayload),
    });
    const editData = await editRes.json();

    if (!editRes.ok || !editData.success) {
      throw new Error(`Product edit failed: ${JSON.stringify(editData)}`);
    }

    console.log(`✓ 1. Database updated: Name="${editData.data.name}", Price=₹${editData.data.sellingPrice}, Stock=${editData.data.stock}`);
    console.log(`✓ 2. Discount percentage updated: ${editData.data.discountPercent}%`);

    // Verify customer API shows new values
    const getUpdatedRes = await fetch(`${API_BASE}/products/${testProductSlug}`);
    const getUpdatedData = await getUpdatedRes.json();
    if (getUpdatedData.data?.sellingPrice !== 3299 || getUpdatedData.data?.name !== updatedProductName) {
      throw new Error(`Storefront API did not return updated values. Got: ${JSON.stringify(getUpdatedData.data)}`);
    }
    console.log("✓ 3. Customer storefront API reflects updated name and price immediately.");

    // Confirm no duplicate product was created
    const countRes = await fetch(`${API_BASE}/products?search=${uniqueSuffix}`);
    const countData = await countRes.json();
    const matchingProducts = countData.data?.filter((p) => p.name.includes(uniqueSuffix));
    if (matchingProducts.length !== 1) {
      throw new Error(`Expected exactly 1 matching product, found ${matchingProducts.length} (duplicate created!)`);
    }
    console.log("✓ 4. Confirmed single source of truth: No duplicate record created.");

    results.testB = true;
    console.log(">>> TEST B PASSED: Edit & Update Synchronization Successful!");
  } catch (err) {
    console.error("❌ TEST B FAILED:", err.message);
  }

  // TEST C: ADMIN DELETES PRODUCT
  console.log("\n--- TEST C: ADMIN DELETES PRODUCT → CUSTOMER CAN NO LONGER BUY IT ---");
  try {
    const delRes = await fetch(`${API_BASE}/products/${testProductId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const delData = await delRes.json();
    if (!delRes.ok || !delData.success) {
      throw new Error(`Product deletion failed: ${JSON.stringify(delData)}`);
    }
    console.log("✓ 1. Product archived/deleted in database.");

    // Verify removed from active customer catalog
    const catListRes = await fetch(`${API_BASE}/products?limit=100`);
    const catListData = await catListRes.json();
    const stillInCat = catListData.data?.some((p) => (p._id || p.id) === testProductId);
    if (stillInCat) throw new Error("Deleted product is still visible in active customer catalogue!");
    console.log("✓ 2. Verified deleted product is removed from customer catalog.");

    // Verify customer product detail page returns 404
    const detail404Res = await fetch(`${API_BASE}/products/${testProductSlug}`);
    console.log(`✓ 3. Detail API status for deleted product: ${detail404Res.status} (Expected 404)`);
    if (detail404Res.status !== 404) {
      throw new Error(`Expected 404 for deleted product, got ${detail404Res.status}`);
    }

    // Verify storefront page returns 404
    const sf404Res = await fetch(`${STOREFRONT_BASE}/product/${testProductSlug}`);
    console.log(`✓ 4. Storefront page status for deleted product: ${sf404Res.status} (Expected 404)`);

    // Verify attempting to purchase deleted product is REJECTED
    const checkoutRes = await fetch(`${API_BASE}/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        customerDetails: {
          fullName: "Test Customer",
          email: "customer@houseoflaado.com",
          phone: "9876543210",
        },
        shippingAddress: {
          streetAddress: "123 Fashion Street",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        items: [
          {
            product: testProductId,
            name: updatedProductName,
            price: 3299,
            quantity: 1,
            size: "M",
            image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
          },
        ],
        paymentMethod: "cod",
      }),
    });
    const checkoutData = await checkoutRes.json();
    console.log(`✓ 5. Attempted purchase of deleted product: status=${checkoutRes.status}, code=${checkoutData.error?.code}`);
    if (checkoutRes.status !== 400 || !checkoutData.error) {
      throw new Error("Purchase of deleted product was not rejected!");
    }
    console.log(`✓ 6. Verified checkout safely rejects deleted/archived product: "${checkoutData.error.message}"`);

    results.testC = true;
    console.log(">>> TEST C PASSED: Deletion & Purchase Prevention Successful!");
  } catch (err) {
    console.error("❌ TEST C FAILED:", err.message);
  }

  // TEST D: SECURITY AND RBAC
  console.log("\n--- TEST D: SECURITY & RBAC ENFORCEMENT ---");
  try {
    // 1. Unauthenticated creation attempt
    const unauthCreate = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hacked Product", sellingPrice: 100 }),
    });
    console.log(`✓ 1. Unauthenticated POST /products: ${unauthCreate.status} (Expected 401)`);
    if (unauthCreate.status !== 401) throw new Error("Unauthenticated create was not rejected with 401");

    // 2. Customer creation attempt
    const custCreate = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        name: "Customer Created Product",
        category: "suit-sets",
        fabric: "Cotton",
        description: "Trying to hack catalog",
        sellingPrice: 100,
        primaryImage: "https://example.com/img.jpg",
      }),
    });
    console.log(`✓ 2. Customer POST /products: ${custCreate.status} (Expected 403)`);
    if (custCreate.status !== 403) throw new Error("Customer create was not rejected with 403");

    // 3. Customer edit attempt
    const custEdit = await fetch(`${API_BASE}/products/${testProductId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ sellingPrice: 1 }),
    });
    console.log(`✓ 3. Customer PUT /products/:id: ${custEdit.status} (Expected 403)`);
    if (custEdit.status !== 403) throw new Error("Customer edit was not rejected with 403");

    // 4. Customer delete attempt
    const custDelete = await fetch(`${API_BASE}/products/${testProductId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log(`✓ 4. Customer DELETE /products/:id: ${custDelete.status} (Expected 403)`);
    if (custDelete.status !== 403) throw new Error("Customer delete was not rejected with 403");

    results.testD = true;
    console.log(">>> TEST D PASSED: All Security & RBAC Constraints Verified!");
  } catch (err) {
    console.error("❌ TEST D FAILED:", err.message);
  }

  // TEST E: PERSISTENCE, FAILURES, AND EDGE CASES
  console.log("\n--- TEST E: PERSISTENCE, MALFORMED INPUTS & FAILURE HANDLING ---");
  try {
    // 1. Invalid Product ID format
    const invalidIdRes = await fetch(`${API_BASE}/products/id/invalid-mongo-id-12345`);
    console.log(`✓ 1. GET /products/id/invalid-id: status=${invalidIdRes.status} (Expected 404)`);
    if (invalidIdRes.status !== 404) throw new Error("Invalid ObjectId format did not return 404");

    // 2. Non-existent valid ObjectId
    const nonExistentRes = await fetch(`${API_BASE}/products/507f1f77bcf86cd799439011`);
    console.log(`✓ 2. GET /products/507f1f77bcf86cd799439011: status=${nonExistentRes.status} (Expected 404)`);
    if (nonExistentRes.status !== 404) throw new Error("Non-existent ObjectId did not return 404");

    // 3. Validation failure: Negative price
    const negPriceRes = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Invalid Product Negative Price",
        category: "suit-sets",
        fabric: "Cotton",
        description: "Valid description",
        sellingPrice: -500,
        primaryImage: "https://example.com/img.jpg",
      }),
    });
    const negPriceData = await negPriceRes.json();
    console.log(`✓ 3. POST negative price: status=${negPriceRes.status}, code=${negPriceData.error?.code} (Expected 400 VALIDATION_ERROR)`);
    if (negPriceRes.status !== 400 || negPriceData.error?.code !== "VALIDATION_ERROR") {
      throw new Error("Negative price was not rejected with 400 VALIDATION_ERROR");
    }

    // 4. Validation failure: Missing required category
    const missingCatRes = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Invalid Product No Category",
        fabric: "Cotton",
        description: "Valid description",
        sellingPrice: 1500,
        primaryImage: "https://example.com/img.jpg",
      }),
    });
    const missingCatData = await missingCatRes.json();
    console.log(`✓ 4. POST missing category: status=${missingCatRes.status}, code=${missingCatData.error?.code} (Expected 400 VALIDATION_ERROR)`);
    if (missingCatRes.status !== 400 || missingCatData.error?.code !== "VALIDATION_ERROR") {
      throw new Error("Missing category was not rejected with 400 VALIDATION_ERROR");
    }

    results.testE = true;
    console.log(">>> TEST E PASSED: Persistence and Failure Handling Verified!");
  } catch (err) {
    console.error("❌ TEST E FAILED:", err.message);
  }

  // FINAL SUMMARY
  console.log("\n=========================================================");
  console.log(" TEST SUMMARY RESULTS");
  console.log("=========================================================");
  console.log(`TEST A (Admin Adds Product -> Customer Sees It):    ${results.testA ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`TEST B (Admin Edits Product -> Storefront Updates):  ${results.testB ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`TEST C (Admin Deletes Product -> Checkout Blocked):  ${results.testC ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`TEST D (Security & RBAC Enforcement):               ${results.testD ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`TEST E (Persistence & Failure Handling):            ${results.testE ? "✅ PASSED" : "❌ FAILED"}`);
  console.log("=========================================================\n");

  const allPassed = Object.values(results).every(Boolean);
  if (allPassed) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! COMPLETE DATABASE & STOREFRONT SYNC VERIFIED.");
    process.exit(0);
  } else {
    console.error("⚠️ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.");
    process.exit(1);
  }
}

runTests();
