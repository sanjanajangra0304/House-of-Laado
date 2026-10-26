"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  IndianRupee,
  ExternalLink,
} from "lucide-react";
import { fetchAdminStatsApi, fetchOrdersApi } from "@/lib/api";

const statusStyles = {
  placed: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  packed: "bg-purple-50 text-purple-700 border-purple-200",
  dispatched: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    lowStockCount: 0,
    awaitingFulfillment: 0,
  });
  const [lowStockList, setLowStockList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAdminStatsApi().catch(() => null),
      fetchOrdersApi({ limit: 5 }).catch(() => null),
    ]).then(([statsRes, ordersRes]) => {
      if (statsRes?.data?.metrics) {
        setStats({
          totalRevenue: statsRes.data.metrics.totalRevenue ?? 0,
          totalOrders: statsRes.data.metrics.totalOrders ?? 0,
          activeProducts: statsRes.data.metrics.activeProducts ?? 0,
          lowStockCount: statsRes.data.metrics.lowStockProducts ?? 0,
          awaitingFulfillment: statsRes.data.metrics.awaitingFulfillment ?? 0,
        });
        if (statsRes.data.lowStockList) {
          setLowStockList(statsRes.data.lowStockList);
        }
      }

      if (ordersRes?.data && Array.isArray(ordersRes.data)) {
        const mapped = ordersRes.data.slice(0, 5).map((o) => ({
          id: o.orderNumber || o._id,
          customer: o.customerDetails?.fullName || "Guest Customer",
          city: `${o.shippingAddress?.city || "Jaipur"}, ${o.shippingAddress?.state || "Rajasthan"}`,
          items: (o.items || []).map((it) => it.name).join(", "),
          amount: o.pricing?.grandTotal || 0,
          date: new Date(o.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
          status: o.orderStatus || "placed",
          paymentMethod: o.paymentMethod === "online" ? "Prepaid" : "COD",
        }));
        setOrders(mapped);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-neutral-900">
            Store Overview & Control Center
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Monitor real-time sales, fulfill new customer orders, and manage catalog pricing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-[#1F2A44] hover:bg-[#480a1c] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold px-4 py-2.5 rounded-full transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>View All Orders</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-neutral-900 mt-4">
            ₹{stats.totalRevenue.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Eligible verified & confirmed sales</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Orders Placed
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-neutral-900 mt-4">
            {stats.totalOrders}
          </p>
          <p className="text-xs text-stone-500 mt-2">
            {stats.awaitingFulfillment} {stats.awaitingFulfillment === 1 ? "order" : "orders"} awaiting fulfillment
          </p>
        </div>

        {/* Active Products */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Active Catalog
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#1F2A44] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-neutral-900 mt-4">
            {stats.activeProducts}
          </p>
          <Link
            href="/admin/products"
            className="text-xs text-[#1F2A44] hover:underline font-medium mt-2 inline-flex items-center gap-1"
          >
            <span>Manage stock levels</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-neutral-900 mt-4">
            {stats.lowStockCount}
          </p>
          <p className="text-xs text-amber-700 font-medium mt-2">
            Items below reorder limit (10)
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Stock Urgency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-neutral-900">
                Recent Customer Orders
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                New orders received through storefront checkout
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#1F2A44] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 text-[11px] uppercase tracking-wider border-b border-stone-200">
                  <th className="py-3 px-6 font-semibold">Order ID</th>
                  <th className="py-3 px-6 font-semibold">Customer</th>
                  <th className="py-3 px-6 font-semibold">Total</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-400">
                      <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                      <p className="font-medium text-xs text-stone-600">No customer orders recorded yet</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Orders placed on storefront will appear here in real-time</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono font-medium text-xs text-neutral-900">
                      {ord.id}
                      <span className="block text-[11px] font-sans text-stone-400">
                        {ord.date}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-neutral-900">{ord.customer}</p>
                      <p className="text-xs text-stone-500 truncate max-w-xs">{ord.city}</p>
                    </td>
                    <td className="py-4 px-6 font-semibold text-neutral-900">
                      ₹{ord.amount.toLocaleString("en-IN")}
                      <span className="block text-[10px] font-normal text-stone-500">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${
                          statusStyles[ord.status] || "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/orders`}
                        className="text-xs font-semibold text-[#1F2A44] hover:underline"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock & Catalog Highlights (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="font-serif font-bold text-lg text-neutral-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Low Stock Inventory</span>
              </h2>
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                Needs Attention
              </span>
            </div>

            <div className="divide-y divide-stone-100 mt-2">
              {lowStockList.length === 0 ? (
                <div className="py-8 text-center text-stone-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold text-stone-700">All inventory well-stocked</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">No products currently below 10 units</p>
                </div>
              ) : (
                lowStockList.map((prod) => (
                  <div key={prod._id || prod.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prod.primaryImage || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80"}
                        alt={prod.name}
                        className="w-12 h-16 object-cover rounded-lg border border-stone-200 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-neutral-900 truncate">
                          {prod.name}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          ₹{prod.sellingPrice} • {prod.category?.name || prod.category || "Ethnic"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        {prod.stock} left
                      </span>
                      <Link
                        href={`/admin/products/${prod._id || prod.id}`}
                        className="block text-[11px] text-[#1F2A44] font-semibold hover:underline mt-1"
                      >
                        Update
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/admin/products"
              className="mt-4 w-full py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Manage All Products</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
