"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ExternalLink,
  Download,
  Percent,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import {
  fetchProducts,
  deleteProductApi,
  exportProductsCsvApi,
  bulkUpdatePricesApi,
} from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [notification, setNotification] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkPriceConfig, setBulkPriceConfig] = useState({
    type: "percentage",
    value: 10,
    direction: "decrease",
  });
  const [bulkLoading, setBulkLoading] = useState(false);

  // Custom Archive Confirmation Modal State
  const [archiveModal, setArchiveModal] = useState({
    isOpen: false,
    productId: null,
    productName: "",
    loading: false,
    error: null,
  });

  const loadProducts = () => {
    setLoading(true);
    fetchProducts({ limit: 100 })
      .then((res) => {
        if (res?.data) {
          const apiItems = res.data.map((item) => ({
            id: item._id || item.id,
            name: item.name,
            slug: item.slug,
            category: item.category?.name || item.categorySlug,
            fabric: item.fabric,
            sellingPrice: item.sellingPrice,
            compareAtPrice: item.compareAtPrice,
            discountPercent: item.discountPercent,
            primaryImage: item.primaryImage,
            stock: item.stock ?? 20,
            status: item.status || "active",
            isBestSeller: item.isBestSeller,
            isNew: item.isNewArrival,
            variants: item.variants || [],
          }));
          setProducts(apiItems);
        }
      })
      .catch((err) => {
        console.error("Failed to load products from database:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const closeArchiveModal = useCallback(() => {
    setArchiveModal((prev) => {
      if (prev.loading) return prev;
      return {
        isOpen: false,
        productId: null,
        productName: "",
        loading: false,
        error: null,
      };
    });
  }, []);

  // Keyboard accessibility: Escape key to close archive modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && archiveModal.isOpen && !archiveModal.loading) {
        closeArchiveModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [archiveModal.isOpen, archiveModal.loading, closeArchiveModal]);

  const openArchiveModal = (id, name) => {
    setArchiveModal({
      isOpen: true,
      productId: id,
      productName: name,
      loading: false,
      error: null,
    });
  };

  const handleConfirmArchive = async () => {
    if (!archiveModal.productId || archiveModal.loading) return;

    setArchiveModal((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await deleteProductApi(archiveModal.productId);
      setProducts((prev) => prev.filter((p) => p.id !== archiveModal.productId));
      setNotification(`Product "${archiveModal.productName}" archived successfully.`);
      setTimeout(() => setNotification(""), 4000);
      setArchiveModal({
        isOpen: false,
        productId: null,
        productName: "",
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Failed to archive product:", err);
      setArchiveModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Failed to archive product. Please try again.",
      }));
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = await exportProductsCsvApi();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `house_of_laado_products_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setNotification("Catalogue exported as CSV successfully.");
      setTimeout(() => setNotification(""), 4000);
    } catch (err) {
      setErrorMessage("Failed to export CSV: " + (err?.message || "Export error"));
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleApplyBulkPrice = async (e) => {
    e.preventDefault();
    const targetIds = selectedIds.length > 0 ? selectedIds : filteredProducts.map((p) => p.id);
    if (!targetIds.length) {
      setBulkError("No products selected to update.");
      return;
    }

    setBulkLoading(true);
    setBulkError("");
    try {
      await bulkUpdatePricesApi({
        productIds: targetIds,
        type: bulkPriceConfig.type,
        value: Number(bulkPriceConfig.value),
        direction: bulkPriceConfig.direction,
      });
      setShowBulkPriceModal(false);
      setSelectedIds([]);
      setNotification(`Successfully updated prices for ${targetIds.length} products.`);
      loadProducts();
      setTimeout(() => setNotification(""), 4000);
    } catch (err) {
      setBulkError("Bulk price update error: " + (err?.message || "Server error"));
    } finally {
      setBulkLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" ||
      p.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-neutral-900">
            Products & Inventory
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage clothing items, update prices, inspect variants, and control stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-4 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowBulkPriceModal(true)}
            className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-4 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Percent className="w-3.5 h-3.5 text-[#1F2A44]" />
            <span>Bulk Price Edit</span>
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-[#1F2A44] hover:bg-[#480a1c] text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification("")}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-400 hover:text-red-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or fabric..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-xs text-stone-900 bg-stone-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="text-xs text-stone-400">
            {filteredProducts.length} items
          </span>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/75 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      selectedIds.length === filteredProducts.length
                    }
                    onChange={handleToggleSelectAll}
                    className="rounded text-[#1F2A44] focus:ring-[#1F2A44]"
                  />
                </th>
                <th className="py-3.5 px-6">Product</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Price</th>
                <th className="py-3.5 px-6">Stock</th>
                <th className="py-3.5 px-6">Variants</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1F2A44] mx-auto mb-2" />
                    <span>Loading products from database...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.stock <= 5;
                  const isOutOfStock = p.stock === 0;
                  const isChecked = selectedIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-stone-50/50 transition-colors ${
                        isChecked ? "bg-rose-50/40" : ""
                      }`}
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(p.id)}
                          className="rounded text-[#1F2A44] focus:ring-[#1F2A44]"
                        />
                      </td>

                      {/* Product Thumbnail & Title */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.primaryImage}
                            alt={p.name}
                            className="w-12 h-16 object-cover rounded-lg border border-stone-200 shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-neutral-900 block line-clamp-1">
                              {p.name}
                            </span>
                            <span className="text-stone-400 text-[11px]">
                              {p.fabric || "Pure Cotton"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] font-medium capitalize">
                          {p.category}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-neutral-900">
                          ₹{p.sellingPrice.toLocaleString("en-IN")}
                        </div>
                        {p.compareAtPrice > p.sellingPrice && (
                          <div className="text-[11px] text-stone-400 line-through">
                            ₹{p.compareAtPrice.toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            isOutOfStock
                              ? "bg-red-50 text-red-700"
                              : isLowStock
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOutOfStock
                                ? "bg-red-500"
                                : isLowStock
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          {p.stock} units
                        </span>
                      </td>

                      {/* Variants Summary */}
                      <td className="py-4 px-6 text-stone-600">
                        {p.variants?.length ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-neutral-800">{p.variants.length} variants</span>
                            {p.variants.some((v) => v.color) && (
                              <span className="text-[10px] text-stone-400">
                                {Array.from(new Set(p.variants.map((v) => v.color).filter(Boolean))).slice(0, 2).join(", ")}
                                {new Set(p.variants.map((v) => v.color).filter(Boolean)).size > 2 ? "..." : ""}
                              </span>
                            )}
                          </div>
                        ) : (
                          "Standard"
                        )}
                      </td>

                      {/* Badges / Merchandising */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          {p.isBestSeller && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                              Bestseller
                            </span>
                          )}
                          {p.isNew && (
                            <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[10px] font-bold border border-pink-200">
                              New
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            title="View on Storefront"
                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/products/${p.id}`}
                            title="Edit Product"
                            className="p-1.5 text-stone-400 hover:text-[#1F2A44] rounded-lg hover:bg-stone-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openArchiveModal(p.id, p.name)}
                            title="Archive Product"
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Archive Confirmation Modal */}
      {archiveModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-modal-title"
          aria-describedby="archive-modal-description"
          onClick={(e) => {
            if (e.target === e.currentTarget && !archiveModal.loading) {
              closeArchiveModal();
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={closeArchiveModal}
              disabled={archiveModal.loading}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-40"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-xs flex-shrink-0">
                <Trash2 className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="pt-0.5">
                <h3
                  id="archive-modal-title"
                  className="font-serif font-bold text-xl text-neutral-900 tracking-tight"
                >
                  Archive this product?
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  House of Laado Catalog Management
                </p>
              </div>
            </div>

            {/* Modal Body Message */}
            <div className="space-y-3">
              <p
                id="archive-modal-description"
                className="text-xs text-stone-600 leading-relaxed"
              >
                Are you sure you want to archive{" "}
                <strong className="text-neutral-900 font-semibold font-serif">
                  &ldquo;{archiveModal.productName}&rdquo;
                </strong>
                ?
              </p>
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-stone-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Catalog Impact</span>
                </div>
                <p>
                  This piece will be immediately removed from the active customer storefront, collection listings, and search results. Past customer orders and accounting history will remain completely intact.
                </p>
              </div>
            </div>

            {/* Server Error Alert if API fails */}
            {archiveModal.error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{archiveModal.error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                autoFocus
                onClick={closeArchiveModal}
                disabled={archiveModal.loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-medium text-xs hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={archiveModal.loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
              >
                {archiveModal.loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Archiving Product...</span>
                  </>
                ) : (
                  <span>Archive Product</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Price Edit Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-neutral-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#1F2A44]" />
                <span>Bulk Price Adjustment</span>
              </h3>
              <button
                onClick={() => {
                  setShowBulkPriceModal(false);
                  setBulkError("");
                }}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Applying to:{" "}
              <strong>
                {selectedIds.length > 0
                  ? `${selectedIds.length} selected products`
                  : `All ${filteredProducts.length} filtered products`}
              </strong>
            </p>

            {bulkError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}

            <form onSubmit={handleApplyBulkPrice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Adjustment Type
                </label>
                <select
                  value={bulkPriceConfig.type}
                  onChange={(e) =>
                    setBulkPriceConfig({ ...bulkPriceConfig, type: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Direction
                </label>
                <select
                  value={bulkPriceConfig.direction}
                  onChange={(e) =>
                    setBulkPriceConfig({ ...bulkPriceConfig, direction: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900"
                >
                  <option value="decrease">Discount / Decrease Price</option>
                  <option value="increase">Markup / Increase Price</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Value ({bulkPriceConfig.type === "percentage" ? "%" : "₹"})
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={bulkPriceConfig.value}
                  onChange={(e) =>
                    setBulkPriceConfig({ ...bulkPriceConfig, value: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBulkPriceModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading}
                  className="px-5 py-2 rounded-xl bg-[#1F2A44] text-white font-semibold hover:bg-[#480a1c] disabled:opacity-50"
                >
                  {bulkLoading ? "Updating..." : "Apply Price Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
