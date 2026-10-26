"use client";

import React from "react";
import { Plus, Trash2, RefreshCw, Barcode, AlertCircle } from "lucide-react";
import { getColorHex } from "@/lib/colorHelper";

const POPULAR_COLORS = [
  "Burgundy Wine",
  "Black",
  "Navy Blue",
  "Ivory",
  "Powder Pink",
  "Mustard Yellow",
  "Olive Green",
  "Emerald Green",
  "White",
  "Off White",
  "Maroon",
  "Rust",
  "Peach",
  "Teal",
  "Royal Blue",
];

export function ProductVariantsTable({
  variants,
  setVariants,
  basePrice = 0,
  slugPrefix = "HOL",
  availableSizes = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"],
  selectedSizes = ["S", "M", "L", "XL"],
  onToggleSize,
}) {
  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddVariant = () => {
    const defaultSize = selectedSizes[0] || availableSizes[0] || "M";
    const lastColor = variants[variants.length - 1]?.color || "Burgundy Wine";
    const cleanPrefix = (slugPrefix || "HOL").slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanColor = lastColor.replace(/\s+/g, "").toUpperCase();

    const newVariant = {
      size: defaultSize,
      color: lastColor,
      sku: `HOL-${cleanPrefix || "PROD"}-${defaultSize}-${cleanColor}`,
      stock: 5,
      reservedStock: 0,
      price: Number(basePrice) || 0,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
    };

    setVariants((prev) => [...prev, newVariant]);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length <= 1) {
      alert("At least one variant is required for the product.");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateMatrix = () => {
    if (!selectedSizes || selectedSizes.length === 0) {
      alert("Please select at least one garment size first.");
      return;
    }

    // Collect unique colors currently in variants or prompt default
    const existingColors = Array.from(
      new Set(variants.map((v) => (v.color || "").trim()).filter(Boolean))
    );
    const colorsToUse = existingColors.length > 0 ? existingColors : ["Burgundy Wine", "Black"];

    const cleanPrefix = (slugPrefix || "HOL").slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const newMatrix = [];

    colorsToUse.forEach((color) => {
      const cleanColor = color.replace(/\s+/g, "").toUpperCase();
      selectedSizes.forEach((size) => {
        // Check if this size + color combo already exists
        const existing = variants.find(
          (v) => v.size === size && v.color.trim().toLowerCase() === color.trim().toLowerCase()
        );
        if (existing) {
          newMatrix.push(existing);
        } else {
          newMatrix.push({
            size,
            color,
            sku: `HOL-${cleanPrefix || "PROD"}-${size}-${cleanColor}`,
            stock: 5,
            reservedStock: 0,
            price: Number(basePrice) || 0,
            barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
          });
        }
      });
    });

    setVariants(newMatrix);
  };

  const handleRegenerateSkus = () => {
    const cleanPrefix = (slugPrefix || "HOL").slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "");
    setVariants((prev) =>
      prev.map((v) => {
        const cleanColor = (v.color || "STD").replace(/\s+/g, "").toUpperCase();
        return {
          ...v,
          sku: `HOL-${cleanPrefix || "PROD"}-${v.size}-${cleanColor}`,
        };
      })
    );
  };

  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const uniqueColorsCount = new Set(variants.map((v) => (v.color || "").trim().toLowerCase()).filter(Boolean)).size;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-5">
      {/* Header and Size Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-base font-serif font-bold text-neutral-900">
            Product Variants Table (SKU & Inventory)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure stock units, price, SKU, barcode, and distinct colors for each variant
          </p>
        </div>

        {onToggleSize && (
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-1">
              Sizes:
            </span>
            {availableSizes.map((size) => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onToggleSize(size)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-[#1F2A44] text-white border-[#1F2A44]"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Datalist for color suggestions */}
      <datalist id="admin-variant-color-options">
        {POPULAR_COLORS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {/* Action helpers */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddVariant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#1F2A44]" />
            <span>Add Variant Row</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateMatrix}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition-colors"
            title="Create combinations of selected sizes and variant colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
            <span>Auto-Combine Sizes × Colors</span>
          </button>

          <button
            type="button"
            onClick={handleRegenerateSkus}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition-colors"
            title="Format SKUs with standard brand syntax"
          >
            <Barcode className="w-3.5 h-3.5 text-stone-600" />
            <span>Clean SKUs</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-stone-500 font-medium">
          <span>
            Variants: <strong className="text-stone-900">{variants.length}</strong>
          </span>
          <span>
            Colors: <strong className="text-stone-900">{uniqueColorsCount}</strong>
          </span>
          <span>
            Total Stock: <strong className="text-[#1F2A44]">{totalStock} units</strong>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-stone-200 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-50 text-[11px] font-bold text-stone-600 uppercase tracking-wider border-b border-stone-200">
              <th className="py-2.5 px-3">Size</th>
              <th className="py-2.5 px-3">Variant Color *</th>
              <th className="py-2.5 px-3">SKU</th>
              <th className="py-2.5 px-3">Stock Units *</th>
              <th className="py-2.5 px-3">Price (₹)</th>
              <th className="py-2.5 px-3">Barcode</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {variants.map((v, idx) => (
              <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                {/* Size Selector */}
                <td className="py-2 px-3">
                  <select
                    value={v.size}
                    onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                    className="px-2 py-1 rounded-lg border border-stone-300 text-xs font-bold text-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
                  >
                    {availableSizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Color Input with Live Color Swatch Indicator */}
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0 shadow-2xs"
                      style={{ backgroundColor: getColorHex(v.color) }}
                      title={v.color}
                    />
                    <input
                      type="text"
                      list="admin-variant-color-options"
                      value={v.color}
                      onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                      placeholder="e.g. Burgundy Wine"
                      className="px-2.5 py-1 rounded-lg border border-stone-300 text-xs w-36 font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
                      required
                    />
                  </div>
                </td>

                {/* SKU */}
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                    placeholder="HOL-PROD-M-BURGUNDY"
                    className="px-2 py-1 rounded-lg border border-stone-300 text-xs w-44 font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
                  />
                </td>

                {/* Stock Units */}
                <td className="py-2 px-3">
                  <input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) =>
                      handleVariantChange(idx, "stock", Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="px-2 py-1 rounded-lg border border-stone-300 text-xs w-20 font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
                    required
                  />
                </td>

                {/* Price */}
                <td className="py-2 px-3">
                  <input
                    type="number"
                    min={0}
                    value={v.price}
                    onChange={(e) =>
                      handleVariantChange(idx, "price", Math.max(0, Number(e.target.value) || 0))
                    }
                    className="px-2 py-1 rounded-lg border border-stone-300 text-xs w-24 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
                  />
                </td>

                {/* Barcode */}
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={v.barcode}
                    onChange={(e) => handleVariantChange(idx, "barcode", e.target.value)}
                    placeholder="890123456789"
                    className="px-2 py-1 rounded-lg border border-stone-200 text-[11px] font-mono text-stone-500 w-28 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
                  />
                </td>

                {/* Delete button */}
                <td className="py-2 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove this variant"
                    disabled={variants.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
