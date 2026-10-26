"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Barcode,
} from "lucide-react";
import { createProductApi, uploadImageApi } from "@/lib/api";
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

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function NewProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    category: "suit-sets",
    fabric: "",
    description: "",
    sellingPrice: "",
    compareAtPrice: "",
    stock: 10,
    sizes: ["S", "M", "L", "XL"],
    colors: [],
    primaryImage: "",
    secondaryImage: "",
    images: [],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    status: "active",
  });

  const [variants, setVariants] = useState([
    {
      size: "M",
      color: "Burgundy Wine",
      sku: "HOL-PROD-M-BURGUNDY",
      stock: 5,
      reservedStock: 0,
      price: "",
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Sync total stock from variants
  useEffect(() => {
    if (variants.length > 0) {
      const total = variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
      setForm((prev) => ({ ...prev, stock: total }));
    }
  }, [variants]);

  // Discount calculation
  const discountPercent =
    form.compareAtPrice && Number(form.compareAtPrice) > Number(form.sellingPrice)
      ? Math.round(
          ((Number(form.compareAtPrice) - Number(form.sellingPrice)) /
            Number(form.compareAtPrice)) *
            100
        )
      : 0;

  const handleToggleSize = (size) => {
    if (form.sizes.includes(size)) {
      if (form.sizes.length > 1) {
        setForm((prev) => ({ ...prev, sizes: prev.sizes.filter((s) => s !== size) }));
      }
    } else {
      setForm((prev) => ({ ...prev, sizes: [...prev.sizes, size] }));
    }
  };

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

      const payload = {
        ...form,
        sizes: uniqueSizes.length > 0 ? uniqueSizes : form.sizes,
        colors: uniqueColors,
        images: form.images || [],
        sellingPrice: Number(form.sellingPrice),
        compareAtPrice: Number(form.compareAtPrice) || 0,
        stock: Number(form.stock) || 0,
        variants: variants.map((v) => ({
          ...v,
          stock: Number(v.stock) || 0,
          price: Number(v.price) || Number(form.sellingPrice),
        })),
      };

      await createProductApi(payload);
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/products");
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

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
              Add New Product
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Publish a new artisan garment with granular SKU variants
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#1F2A44] hover:bg-[#480a1c] text-white text-xs font-semibold px-6 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{loading ? "Saving..." : "Publish Product"}</span>
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Product created successfully! Redirecting to inventory...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Details */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <h2 className="text-base font-serif font-bold text-neutral-900 border-b border-stone-100 pb-3">
            Garment Information
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
                placeholder="e.g. Gulabi Anarkali Pure Cotton 3-Piece Suit Set"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-sm text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Collection / Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-sm text-stone-900 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
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
                placeholder="e.g. 100% Jaipur Mulmul Cotton"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-sm text-stone-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Garment Description *
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Handcrafted in breathable Jaipur mulmul cotton featuring delicate hand-block floral motifs..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-sm text-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Pricing */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <h2 className="text-base font-serif font-bold text-neutral-900 border-b border-stone-100 pb-3">
            Base Pricing
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
                placeholder="1899"
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
                placeholder="3499"
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

        {/* Card 3: Variants Table Component */}
        <ProductVariantsTable
          variants={variants}
          setVariants={setVariants}
          basePrice={form.sellingPrice}
          slugPrefix={form.name}
          availableSizes={AVAILABLE_SIZES}
          selectedSizes={form.sizes}
          onToggleSize={handleToggleSize}
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

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-[#1F2A44] hover:bg-[#480a1c] text-white text-xs font-semibold px-6 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{loading ? "Saving Product..." : "Save & Publish"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
