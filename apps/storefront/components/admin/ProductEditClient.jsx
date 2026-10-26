"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { updateProductApi, fetchProductByIdApi, fetchProductBySlugApi } from "@/lib/api";
import { ImageUploadZone } from "@/components/admin/ImageUploadZone";
import { ProductVariantsTable } from "@/components/admin/ProductVariantsTable";
import { getColorHex } from "@/lib/colorHelper";

const CATEGORIES = [
  { slug: "suit-sets", name: "Suit Sets" },
  { slug: "kurtas", name: "Kurtas" },
  { slug: "festive-edit", name: "Festive Edit" },
  { slug: "dresses", name: "Dresses" },
  { slug: "coord-sets", name: "Co-ord Sets" },
  { slug: "bags", name: "Bags & Accessories" },
  { slug: "menswear", name: "Menswear" },
];

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

export function ProductEditClient({ productId }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: "suit-sets",
    fabric: "",
    description: "",
    sellingPrice: "",
    compareAtPrice: "",
    stock: 20,
    sizes: ["S", "M", "L", "XL"],
    colors: [],
    primaryImage: "",
    secondaryImage: "",
    images: [],
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: true,
    status: "active",
  });

  const [variants, setVariants] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      setIsFetching(true);
      setError("");
      try {
        let res = null;
        try {
          res = await fetchProductByIdApi(productId);
        } catch {
          res = await fetchProductBySlugApi(productId);
        }
        if (res?.data && isMounted) {
          const p = res.data;
          setForm({
            name: p.name || "",
            slug: p.slug || "",
            category: p.categorySlug || p.category?.slug || "suit-sets",
            fabric: p.fabric || "",
            description: p.description || "",
            sellingPrice: p.sellingPrice || "",
            compareAtPrice: p.compareAtPrice || "",
            stock: p.stock ?? 20,
            sizes: p.sizes?.length ? p.sizes : ["S", "M", "L", "XL"],
            colors: p.colors || [],
            primaryImage: p.primaryImage || "",
            secondaryImage: p.secondaryImage || "",
            images: Array.isArray(p.images) ? p.images : [],
            isNewArrival: p.isNewArrival ?? false,
            isBestSeller: p.isBestSeller ?? false,
            isFeatured: p.isFeatured ?? false,
            status: p.status || "active",
          });

          // Normalize variants from DB or synthesize from legacy data
          let loadedVariants = [];
          if (Array.isArray(p.variants) && p.variants.length > 0) {
            loadedVariants = p.variants.map((v) => ({
              size: v.size || "M",
              color: (v.color || "").trim() || (p.colors?.[0]?.name) || "Default",
              sku: v.sku || "",
              stock: v.stock !== undefined ? Number(v.stock) : 0,
              reservedStock: Number(v.reservedStock) || 0,
              price: v.price !== undefined && v.price !== null ? v.price : "",
              barcode: v.barcode || "",
              image: v.image || "",
            }));
          } else {
            const fallbackSizes = p.sizes?.length ? p.sizes : ["M"];
            const fallbackColors = p.colors?.length ? p.colors.map((c) => c.name || c) : ["Default"];
            const perVariantStock = Math.max(1, Math.floor((p.stock || 20) / (fallbackSizes.length * fallbackColors.length)));
            for (const col of fallbackColors) {
              const colName = typeof col === "string" ? col : (col.name || "Default");
              for (const sz of fallbackSizes) {
                loadedVariants.push({
                  size: sz,
                  color: colName,
                  sku: `${p.slug || "HOL"}-${sz}-${colName}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
                  stock: perVariantStock,
                  reservedStock: 0,
                  price: "",
                  barcode: "",
                });
              }
            }
          }
          setVariants(loadedVariants);
        }
      } catch (err) {
        if (isMounted) setError("Product could not be loaded from database: " + err.message);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    }
    loadProduct();
    return () => { isMounted = false; };
  }, [productId]);

  // Sync total stock from variants
  useEffect(() => {
    if (variants.length > 0) {
      const total = variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
      setForm((prev) => ({ ...prev, stock: total }));
    }
  }, [variants]);

  // Discount calculation
  const selling = Number(form.sellingPrice) || 0;
  const compare = Number(form.compareAtPrice) || 0;
  const discountPercent =
    compare > selling && compare > 0
      ? Math.round(((compare - selling) / compare) * 100)
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.primaryImage) {
      setError("Please select at least one primary image for this garment from your phone or laptop.");
      return;
    }

    if (!variants || variants.length === 0) {
      setError("Please add at least one product variant.");
      return;
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.size) {
        setError(`Variant #${i + 1} is missing a size.`);
        return;
      }
      if (!v.color || !v.color.trim()) {
        setError(`Variant #${i + 1} (${v.size}) is missing a color.`);
        return;
      }
      if (v.stock < 0 || isNaN(v.stock)) {
        setError(`Variant #${i + 1} (${v.size} - ${v.color}) has an invalid stock quantity.`);
        return;
      }
      if (v.price < 0 || isNaN(v.price)) {
        setError(`Variant #${i + 1} (${v.size} - ${v.color}) has an invalid price.`);
        return;
      }
    }

    setLoading(true);

    try {
      const uniqueColors = Array.from(
        new Set(variants.map((v) => (v.color || "").trim()).filter(Boolean))
      ).map((name) => ({
        name,
        hex: getColorHex(name),
      }));

      const uniqueSizes = Array.from(
        new Set(variants.map((v) => v.size).filter(Boolean))
      );

      const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

      const payload = {
        ...form,
        images: form.images || [],
        variants: variants.map((v) => ({
          size: v.size,
          color: (v.color || "").trim(),
          sku: (v.sku || "").trim(),
          stock: Number(v.stock) || 0,
          reservedStock: Number(v.reservedStock) || 0,
          price: v.price === "" || v.price === null || v.price === undefined ? null : Number(v.price),
          barcode: (v.barcode || "").trim(),
          image: v.image || "",
        })),
        colors: uniqueColors,
        sizes: uniqueSizes,
        sellingPrice: Number(form.sellingPrice),
        compareAtPrice: Number(form.compareAtPrice) || 0,
        stock: totalStock,
      };

      await updateProductApi(productId, payload);
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/products");
      }, 1200);
    } catch (err) {
      setError(err?.message || "Failed to update product in database");
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F2A44] mb-3" />
        <p className="text-sm">Fetching product details from database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-neutral-900">
              Edit Product: {form.name || "Product"}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Update pricing, inventory levels, and merchandising settings
            </p>
          </div>
        </div>

        {form.slug && (
          <Link
            href={`/product/${form.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs text-[#1F2A44] hover:underline font-semibold"
          >
            <span>View on Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Product updated successfully! Returning to catalogue...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Details */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <h2 className="text-base font-serif font-bold text-neutral-900 border-b border-stone-100 pb-3">
            Product Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-sm text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-sm text-stone-900 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Fabric / Material *
              </label>
              <input
                type="text"
                required
                value={form.fabric}
                onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-sm text-stone-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Garment Description *
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-sm text-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Pricing & Stock Inventory */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <h2 className="text-base font-serif font-bold text-neutral-900 border-b border-stone-100 pb-3">
            Pricing & Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-sm text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Compare-at MRP Price (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.compareAtPrice}
                onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-sm text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Total Calculated Stock
              </label>
              <input
                type="number"
                disabled
                value={form.stock}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-600 cursor-not-allowed"
              />
            </div>
          </div>

          {discountPercent > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-[#1F2A44] font-medium flex items-center justify-between">
              <span>Automatic Calculated Discount:</span>
              <span className="font-bold text-sm">{discountPercent}% OFF</span>
            </div>
          )}
        </div>

        {/* Card 3: Variants Table (Matrix generator & custom inventory) */}
        <ProductVariantsTable
          variants={variants}
          onChange={setVariants}
          baseSku={form.slug || form.name ? (form.slug || form.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 15) : "hol"}
          basePrice={form.sellingPrice}
          availableSizes={AVAILABLE_SIZES}
        />

        {/* Card 4: Modern Photography & Media Uploader */}
        <ImageUploadZone
          primaryImage={form.primaryImage}
          setPrimaryImage={(val) => setForm((prev) => ({ ...prev, primaryImage: val }))}
          secondaryImage={form.secondaryImage}
          setSecondaryImage={(val) => setForm((prev) => ({ ...prev, secondaryImage: val }))}
          galleryImages={form.images || []}
          setGalleryImages={(updater) => {
            setForm((prev) => ({
              ...prev,
              images: typeof updater === "function" ? updater(prev.images || []) : updater,
            }));
          }}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/admin/products"
            className="px-6 py-3 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-full bg-[#1F2A44] hover:bg-[#480a1c] text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Product...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
