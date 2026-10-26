"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  Loader2,
  AlertCircle,
  RotateCcw,
  Ban,
  ShieldCheck,
  Camera,
  FileText,
  RefreshCw,
  UserCheck,
  Check,
  X,
  Calendar,
  Trash2,
} from "lucide-react";
import {
  fetchOrdersApi,
  updateOrderStatusApi,
  fetchReturnRequestsApi,
  updateReturnRequestApi,
  processReturnRefundApi,
  deleteOrderApi,
  bulkDeleteOrdersApi,
} from "@/lib/api";

/**
 * Reliable classifier for test and demo orders
 * Never classifies genuine customer orders as test orders, even if cancelled or unpaid.
 */
export const isTestOrder = (order) => {
  if (!order) return false;
  if (order.isTestOrder === true) return true;

  const orderNo = String(order.orderNumber || "").toUpperCase();
  const email = String(order.customerDetails?.email || "").toLowerCase();
  const name = String(order.customerDetails?.fullName || "").toLowerCase();

  // Known automated test prefixes
  if (
    orderNo.startsWith("ORD-TEST-") ||
    orderNo.startsWith("ORD-SEC-") ||
    orderNo.startsWith("ORD-E2E-") ||
    orderNo.startsWith("ORD-HOOK-") ||
    orderNo.startsWith("ORD-COD-FAIL") ||
    orderNo.startsWith("TEST-") ||
    orderNo.startsWith("DEMO-") ||
    orderNo.startsWith("SAMPLE-")
  ) {
    return true;
  }

  // Known test domains
  const testDomains = [
    "@test.com",
    "@test-sec.com",
    "@example.com",
    "@vastraloom.internal",
    "@e2e.internal",
  ];
  if (testDomains.some((dom) => email.endsWith(dom))) {
    return true;
  }

  // Specific automated test fixture accounts
  if (
    email.includes("test_") ||
    email.includes("testuser") ||
    email.includes("_e2e@") ||
    email.startsWith("e2e_") ||
    name === "test user" ||
    name === "e2e test customer" ||
    name === "automated test user"
  ) {
    return true;
  }

  return false;
};

const ORDER_STATUSES = [
  { value: "placed", label: "Placed", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "packed", label: "Packed", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "dispatched", label: "Dispatched", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "delivered", label: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "return_requested", label: "Return Requested", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "returned", label: "Returned", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "cancelled", label: "Cancelled", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const RETURN_STATUSES = [
  { value: "requested", label: "Requested", color: "bg-amber-100 text-amber-900 border-amber-300" },
  { value: "approved", label: "Approved for Pickup", color: "bg-blue-100 text-blue-900 border-blue-300" },
  { value: "pickup_scheduled", label: "Pickup Scheduled", color: "bg-purple-100 text-purple-900 border-purple-300" },
  { value: "item_received", label: "Item Received", color: "bg-indigo-100 text-indigo-900 border-indigo-300" },
  { value: "inspection_passed", label: "Inspection Passed", color: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { value: "inspection_failed", label: "Inspection Failed", color: "bg-rose-100 text-rose-900 border-rose-300" },
  { value: "refund_processing", label: "Refund Processing", color: "bg-amber-200 text-amber-950 border-amber-400" },
  { value: "completed", label: "Completed / Settled", color: "bg-emerald-600 text-white border-emerald-700" },
  { value: "rejected", label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState("orders"); // "orders", "returns", "cancellations"
  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(true);

  // Filters & search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all"); // "all", "test_only", "live_only"
  const [returnStatusFilter, setReturnStatusFilter] = useState("all");
  const [returnTypeFilter, setReturnTypeFilter] = useState("all");

  // Selection & bulk actions
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Deletion modals
  const [orderToDeleteSingle, setOrderToDeleteSingle] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selection modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Return actions form state
  const [returnDecisionNote, setReturnDecisionNote] = useState("");
  const [pickupCourierName, setPickupCourierName] = useState("Delhivery Reverse");
  const [pickupTrackingNumber, setPickupTrackingNumber] = useState("");
  const [codPayoutReference, setCodPayoutReference] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Global notification banner
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState("success");

  const showNotification = (msg, type = "success") => {
    setNotification(msg);
    setNotificationType(type);
    setTimeout(() => setNotification(""), 5000);
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetchOrdersApi();
      if (res?.data) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn("Failed to fetch admin orders:", err.message);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadReturns = async () => {
    setLoadingReturns(true);
    try {
      const res = await fetchReturnRequestsApi();
      if (res?.data) {
        setReturnRequests(res.data);
      } else {
        setReturnRequests([]);
      }
    } catch (err) {
      console.warn("Failed to fetch return requests:", err.message);
      setReturnRequests([]);
    } finally {
      setLoadingReturns(false);
    }
  };

  useEffect(() => {
    loadOrders();
    loadReturns();
  }, []);

  // Update order fulfillment status
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatusApi(orderId, { orderStatus: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: newStatus }));
      }
      showNotification(`Order status updated to ${newStatus.toUpperCase()}`);
    } catch (e) {
      showNotification(`Failed to update status: ${e.message}`, "error");
    }
  };

  // Update tracking number on order
  const handleUpdateTracking = async (orderId, trackingNumber) => {
    try {
      await updateOrderStatusApi(orderId, { trackingNumber });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, tracking: { ...o.tracking, trackingNumber } } : o
        )
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          tracking: { ...prev.tracking, trackingNumber },
        }));
      }
      showNotification("Courier tracking number updated successfully");
    } catch (e) {
      showNotification(`Failed to update tracking: ${e.message}`, "error");
    }
  };

  // Update return request status (Approve, Schedule pickup, Inspection result)
  const handleUpdateReturnStatus = async (returnId, targetStatus) => {
    if (!returnId || !targetStatus) return;
    setIsProcessingAction(true);
    try {
      const payload = {
        status: targetStatus,
        decisionReason: returnDecisionNote.trim() || undefined,
        inspectionNotes: returnDecisionNote.trim() || undefined,
      };

      if (targetStatus === "pickup_scheduled" || targetStatus === "approved") {
        if (pickupTrackingNumber.trim()) {
          payload.pickupTracking = {
            courierName: pickupCourierName.trim() || "Delhivery Reverse",
            trackingNumber: pickupTrackingNumber.trim(),
            scheduledDate: new Date(),
          };
        }
      }

      const res = await updateReturnRequestApi(returnId, payload);
      if (res?.data) {
        setReturnRequests((prev) =>
          prev.map((r) => (r._id === returnId ? res.data : r))
        );
        setSelectedReturn(res.data);
        setReturnDecisionNote("");
        showNotification(
          `Return request #${res.data.requestId || returnId} updated to ${targetStatus.toUpperCase()}`
        );
        loadOrders();
      }
    } catch (e) {
      showNotification(e.message || "Failed to update return request", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Process refund for return request (Prepaid via Razorpay or COD via verified UTR)
  const handleProcessRefund = async (returnReq) => {
    if (!returnReq) return;
    const isCod = returnReq.payoutDetails?.method === "bank_transfer" || returnReq.payoutDetails?.method === "upi";

    if (!codPayoutReference.trim()) {
      showNotification(
        "Please enter the verified Bank Reference / UTR Number or Payment Portal Reference before finalizing settlement.",
        "error"
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to process the refund of ₹${returnReq.refundAmount} for Request #${returnReq.requestId}? This action is irreversible.`
      )
    ) {
      return;
    }

    setIsProcessingAction(true);
    try {
      const payload = {
        refundMethod: isCod ? "manual_bank_transfer" : "manual_online_settlement",
        payoutReference: codPayoutReference.trim(),
        notes: returnDecisionNote.trim() || (isCod ? "COD refund settled via verified bank transfer" : "Prepaid refund verified and recorded manually"),
      };

      const res = await processReturnRefundApi(returnReq._id, payload);
      if (res?.data) {
        setReturnRequests((prev) =>
          prev.map((r) => (r._id === returnReq._id ? res.data : r))
        );
        setSelectedReturn(res.data);
        setCodPayoutReference("");
        setReturnDecisionNote("");
        showNotification(
          `Refund of ₹${res.data.refundAmount} settled successfully! Status: ${res.data.status.toUpperCase()}`
        );
        loadOrders();
      }
    } catch (e) {
      showNotification(e.message || "Refund settlement failed", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Trigger Single Delete Modal
  const handleDeleteOrder = (ord) => {
    if (!ord) return;
    setOrderToDeleteSingle(ord);
  };

  // Execute Single Permanent Delete
  const executeSingleDelete = async () => {
    if (!orderToDeleteSingle) return;
    setIsDeleting(true);
    try {
      await deleteOrderApi(orderToDeleteSingle._id);
      showNotification(
        `Order #${orderToDeleteSingle.orderNumber} deleted permanently. Inventory restored if applicable.`,
        "success"
      );
      const deletedId = orderToDeleteSingle._id;
      setSelectedOrderIds((prev) => prev.filter((id) => id !== deletedId));
      setOrderToDeleteSingle(null);
      if (selectedOrder?._id === deletedId) {
        setSelectedOrder(null);
      }
      await loadOrders();
    } catch (err) {
      showNotification(err.message || "Failed to delete order.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Execute Bulk Permanent Delete
  const executeBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await bulkDeleteOrdersApi(selectedOrderIds);
      const count = res?.data?.deletedCount || selectedOrderIds.length;
      showNotification(
        `Successfully deleted ${count} selected order(s) and safely restored inventory.`,
        "success"
      );
      setSelectedOrderIds([]);
      setShowBulkDeleteModal(false);
      if (selectedOrder && selectedOrderIds.includes(selectedOrder._id)) {
        setSelectedOrder(null);
      }
      await loadOrders();
    } catch (err) {
      showNotification(err.message || "Failed to bulk delete orders.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Selection toggle for individual order
  const toggleSelectOrder = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all visible orders on the page
  const selectAllVisible = () => {
    const visibleIds = filteredOrders.map((o) => o._id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedOrderIds.includes(id));
    if (allSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Select all verified test / demo orders across the entire catalog
  const selectAllTestOrdersOnly = () => {
    const testIds = orders.filter((o) => isTestOrder(o)).map((o) => o._id);
    setSelectedOrderIds(testIds);
    showNotification(`Selected all ${testIds.length} verified test / demo orders.`);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedOrderIds([]);
  };

  // Test & live order counts
  const totalTestOrdersCount = orders.filter((o) => isTestOrder(o)).length;
  const totalLiveOrdersCount = orders.length - totalTestOrdersCount;

  // Selected orders breakdown
  const selectedOrdersList = orders.filter((o) => selectedOrderIds.includes(o._id));
  const selectedOrdersBreakdown = {
    testCount: selectedOrdersList.filter((o) => isTestOrder(o)).length,
    liveCount: selectedOrdersList.filter((o) => !isTestOrder(o)).length,
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const orderNo = o.orderNumber || "";
    const name = o.customerDetails?.fullName || "";
    const phone = o.customerDetails?.phone || "";
    const matchesSearch =
      orderNo.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search);

    const matchesStatus = statusFilter === "all" || o.orderStatus === statusFilter;

    let matchesType = true;
    if (orderTypeFilter === "test_only") {
      matchesType = isTestOrder(o);
    } else if (orderTypeFilter === "live_only") {
      matchesType = !isTestOrder(o);
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  // Filtered Returns
  const filteredReturns = returnRequests.filter((r) => {
    const reqId = r.requestId || "";
    const ordNo = r.orderNumber || r.order?.orderNumber || "";
    const name = r.customerDetails?.name || r.order?.customerDetails?.fullName || "";
    const matchesSearch =
      reqId.toLowerCase().includes(search.toLowerCase()) ||
      ordNo.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = returnStatusFilter === "all" || r.status === returnStatusFilter;
    const matchesType = returnTypeFilter === "all" || r.type === returnTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Filtered Cancellations: Only genuinely cancelled orders
  const cancelledOrders = orders.filter(
    (o) =>
      o.orderStatus === "cancelled" ||
      Boolean(o.cancellation?.cancelledAt || (o.cancellation?.reason && o.cancellation.reason.trim()))
  );

  const pendingReturnsCount = returnRequests.filter(
    (r) => ["requested", "pickup_scheduled", "item_received"].includes(r.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-neutral-900">
            Order Fulfillment, Returns & Refunds
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage dispatches, inspect return & exchange requests, verify reverse logistics, and settle refunds.
          </p>
        </div>

        <button
          onClick={() => {
            loadOrders();
            loadReturns();
            showNotification("Refreshed orders and returns data from atelier database.");
          }}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-xs transition-all ${
            notificationType === "error"
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationType === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification("")}
            className="text-stone-400 hover:text-stone-700 text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-stone-200 gap-2 sm:gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3.5 px-2 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "orders"
              ? "border-[#1F2A44] text-[#1F2A44]"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders & Dispatches</span>
          <span className="ml-1 text-xs py-0.5 px-2 rounded-full bg-stone-100 text-stone-700">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("returns")}
          className={`pb-3.5 px-2 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "returns"
              ? "border-[#1F2A44] text-[#1F2A44]"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Return & Exchange Requests</span>
          {pendingReturnsCount > 0 ? (
            <span className="ml-1 text-xs py-0.5 px-2 rounded-full bg-amber-500 text-white font-bold animate-pulse">
              {pendingReturnsCount} pending
            </span>
          ) : (
            <span className="ml-1 text-xs py-0.5 px-2 rounded-full bg-stone-100 text-stone-700">
              {returnRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("cancellations")}
          className={`pb-3.5 px-2 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "cancellations"
              ? "border-[#1F2A44] text-[#1F2A44]"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>Cancellations & Refunds</span>
          <span className="ml-1 text-xs py-0.5 px-2 rounded-full bg-stone-100 text-stone-700">
            {cancelledOrders.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ORDERS & DISPATCHES */}
      {/* ===================================================================== */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Order ID, name, or phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-xs text-stone-900 bg-stone-50/50"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap justify-end">
              {/* Type filter */}
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <span>Type:</span>
              </div>
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
              >
                <option value="all">All Types ({orders.length})</option>
                <option value="test_only">🧪 Test / Demo Only ({totalTestOrdersCount})</option>
                <option value="live_only">👤 Live Customer Only ({totalLiveOrdersCount})</option>
              </select>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
              >
                <option value="all">All Statuses ({orders.length})</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {/* One-click Select All Test Orders */}
              {totalTestOrdersCount > 0 && (
                <button
                  type="button"
                  onClick={selectAllTestOrdersOnly}
                  className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Select only verified test/demo orders for bulk deletion"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  <span>Select Test Orders ({totalTestOrdersCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Bulk Selection Actions Toolbar */}
          {selectedOrderIds.length > 0 && (
            <div className="p-4 bg-[#1F2A44] text-white rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-[#C6A75E]">
                  {selectedOrderIds.length}
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">
                    {selectedOrderIds.length} {selectedOrderIds.length === 1 ? "order" : "orders"} selected
                  </p>
                  <p className="text-[11px] text-stone-300">
                    {selectedOrdersBreakdown.testCount} Test / Demo • {selectedOrdersBreakdown.liveCount} Live Customer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedOrdersBreakdown.liveCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const onlyTest = orders
                        .filter((o) => selectedOrderIds.includes(o._id) && isTestOrder(o))
                        .map((o) => o._id);
                      setSelectedOrderIds(onlyTest);
                      showNotification("Deselected live customer orders. Kept only verified test orders.");
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30 transition-colors cursor-pointer"
                  >
                    Keep Only Test Orders ({selectedOrdersBreakdown.testCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={selectAllTestOrdersOnly}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  Select All Test ({totalTestOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-stone-200 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bulk Delete Selected ({selectedOrderIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 text-[11px] uppercase tracking-wider border-b border-stone-200">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredOrders.length > 0 &&
                          filteredOrders.every((o) => selectedOrderIds.includes(o._id))
                        }
                        onChange={selectAllVisible}
                        className="w-4 h-4 rounded text-[#1F2A44] border-stone-300 focus:ring-[#1F2A44] cursor-pointer"
                        title="Select/Deselect all visible orders"
                      />
                    </th>
                    <th className="py-3.5 px-4 font-semibold">Order Details</th>
                    <th className="py-3.5 px-4 font-semibold">Customer</th>
                    <th className="py-3.5 px-4 font-semibold">Items</th>
                    <th className="py-3.5 px-4 font-semibold">Amount & Method</th>
                    <th className="py-3.5 px-4 font-semibold">Status Stage</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-stone-500">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#1F2A44] mb-2" />
                        <p className="text-xs font-medium text-stone-600">Loading orders from database...</p>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-stone-500">
                        <Package className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                        <p className="font-serif font-bold text-base text-stone-700">No orders found</p>
                        <p className="text-xs text-stone-400 mt-1">Try adjusting your filters or search keywords.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const isOrderTest = isTestOrder(ord);
                      const isSelected = selectedOrderIds.includes(ord._id);
                      const currentStatusObj =
                        ORDER_STATUSES.find((s) => s.value === ord.orderStatus) || ORDER_STATUSES[0];
                      const orderDate = new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <tr
                          key={ord._id}
                          className={`transition-colors ${
                            isSelected ? "bg-amber-50/40" : "hover:bg-stone-50/70"
                          }`}
                        >
                          <td className="py-4 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOrder(ord._id)}
                              className="w-4 h-4 rounded text-[#1F2A44] border-stone-300 focus:ring-[#1F2A44] cursor-pointer"
                            />
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-mono font-bold text-xs text-neutral-900">
                                #{ord.orderNumber}
                              </p>
                              {isOrderTest ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                                  TEST ORDER
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  LIVE ORDER
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">{orderDate}</p>
                          </td>

                          <td className="py-4 px-4">
                            <p className="font-medium text-neutral-900">
                              {ord.customerDetails?.fullName || "Guest Customer"}
                            </p>
                            <p className="text-xs text-stone-500">{ord.customerDetails?.phone || ord.customerDetails?.email}</p>
                          </td>

                          <td className="py-4 px-4 max-w-xs">
                            <p className="text-xs text-neutral-800 font-medium truncate">
                              {ord.items?.[0]?.name}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              Size: {ord.items?.[0]?.size} • Color: {ord.items?.[0]?.color || "Standard"} • Qty: {ord.items?.[0]?.quantity}
                              {(ord.items?.length || 0) > 1 && ` (+${ord.items.length - 1} more)`}
                            </p>
                          </td>

                          <td className="py-4 px-4">
                            <p className="font-semibold text-neutral-900 text-sm">
                              ₹{ord.pricing?.grandTotal?.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[11px] text-stone-500 capitalize">
                              {ord.paymentMethod === "online" ? "Prepaid (Razorpay)" : "Cash on Delivery (COD)"}
                            </p>
                          </td>

                          <td className="py-4 px-4">
                            <select
                              value={ord.orderStatus}
                              onChange={(e) => handleOrderStatusChange(ord._id, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer focus:outline-none ${currentStatusObj.color}`}
                            >
                              {ORDER_STATUSES.map((st) => (
                                <option key={st.value} value={st.value}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(ord)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-[#1F2A44] hover:text-white transition-colors cursor-pointer"
                              >
                                Inspect
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(ord)}
                                className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Order Directly"
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: RETURN & EXCHANGE REQUESTS */}
      {/* ===================================================================== */}
      {activeTab === "returns" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Request ID, Order #, or customer..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1F2A44] text-xs text-stone-900 bg-stone-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Type:</span>
              </div>
              <select
                value={returnTypeFilter}
                onChange={(e) => setReturnTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="return_refund">Return & Refund</option>
                <option value="exchange">Size Exchange</option>
              </select>

              <div className="flex items-center gap-2 text-xs text-stone-500 ml-2">
                <span>Status:</span>
              </div>
              <select
                value={returnStatusFilter}
                onChange={(e) => setReturnStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none"
              >
                <option value="all">All Statuses ({returnRequests.length})</option>
                {RETURN_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Returns Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 text-[11px] uppercase tracking-wider border-b border-stone-200">
                    <th className="py-3.5 px-6 font-semibold">Request ID & Date</th>
                    <th className="py-3.5 px-6 font-semibold">Order & Customer</th>
                    <th className="py-3.5 px-6 font-semibold">Items & Reason</th>
                    <th className="py-3.5 px-6 font-semibold">Type & Refund</th>
                    <th className="py-3.5 px-6 font-semibold">Verified Status</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {loadingReturns ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-stone-500">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#1F2A44] mb-2" />
                        <p className="text-xs font-medium text-stone-600">Loading return requests...</p>
                      </td>
                    </tr>
                  ) : filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-stone-500">
                        <RotateCcw className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                        <p className="font-serif font-bold text-base text-stone-700">No return requests found</p>
                        <p className="text-xs text-stone-400 mt-1">Customer return and exchange submissions will appear here.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((ret) => {
                      const statusObj =
                        RETURN_STATUSES.find((s) => s.value === ret.status) || RETURN_STATUSES[0];
                      const reqDate = new Date(ret.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <tr key={ret._id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-mono font-bold text-xs text-[#1F2A44]">
                              {ret.requestId || ret._id}
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">{reqDate}</p>
                          </td>

                          <td className="py-4 px-6">
                            <p className="font-mono font-semibold text-xs text-stone-900">
                              Order #{ret.orderNumber || ret.order?.orderNumber}
                            </p>
                            <p className="text-xs text-stone-600 mt-0.5">
                              {ret.customerDetails?.name || ret.order?.customerDetails?.fullName}
                            </p>
                            <p className="text-[11px] text-stone-400">
                              {ret.customerDetails?.phone || ret.order?.customerDetails?.phone}
                            </p>
                          </td>

                          <td className="py-4 px-6 max-w-xs">
                            <p className="text-xs font-semibold text-neutral-900 truncate">
                              {ret.items?.[0]?.name}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              Size: {ret.items?.[0]?.size} • Qty: {ret.items?.[0]?.quantity}
                              {ret.items?.[0]?.exchangeSize && (
                                <span className="font-semibold text-emerald-700 ml-1">
                                  → Size {ret.items[0].exchangeSize}
                                </span>
                              )}
                              {(ret.items?.length || 0) > 1 && ` (+${ret.items.length - 1} more)`}
                            </p>
                            <p className="text-[11px] text-stone-500 italic mt-0.5 truncate">
                              &ldquo;{ret.reason}&rdquo;
                            </p>
                          </td>

                          <td className="py-4 px-6">
                            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-0.5">
                              {ret.type === "exchange" ? "Size Exchange" : "Return & Refund"}
                            </span>
                            {ret.type === "return_refund" && (
                              <p className="font-bold text-neutral-900 text-sm">
                                ₹{ret.refundAmount?.toLocaleString("en-IN")}
                              </p>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${statusObj.color}`}
                            >
                              {statusObj.label}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => {
                                setSelectedReturn(ret);
                                setPickupTrackingNumber(ret.pickupTracking?.trackingNumber || "");
                                setPickupCourierName(ret.pickupTracking?.courierName || "Delhivery Reverse");
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#1F2A44] text-white hover:bg-[#C6A75E] transition-colors cursor-pointer shadow-xs"
                            >
                              Review & Process
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CANCELLATIONS & REFUNDS */}
      {/* ===================================================================== */}
      {activeTab === "cancellations" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 text-[11px] uppercase tracking-wider border-b border-stone-200">
                    <th className="py-3.5 px-6 font-semibold">Order Number & Date</th>
                    <th className="py-3.5 px-6 font-semibold">Customer</th>
                    <th className="py-3.5 px-6 font-semibold">Cancellation Reason</th>
                    <th className="py-3.5 px-6 font-semibold">Payment & Amount</th>
                    <th className="py-3.5 px-6 font-semibold">Refund Status</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {cancelledOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-stone-500">
                        <Ban className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                        <p className="font-serif font-bold text-base text-stone-700">No cancelled orders</p>
                      </td>
                    </tr>
                  ) : (
                    cancelledOrders.map((ord) => {
                      const cancelInfo = ord.cancellation || {};
                      const refundStatusColor = {
                        completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
                        processing: "bg-amber-100 text-amber-900 border-amber-300",
                        failed: "bg-rose-100 text-rose-800 border-rose-300",
                        not_applicable: "bg-stone-100 text-stone-600 border-stone-200",
                      };

                      return (
                        <tr key={ord._id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-mono font-bold text-xs text-neutral-900">
                              #{ord.orderNumber}
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Cancelled {new Date(cancelInfo.cancelledAt || ord.updatedAt).toLocaleDateString("en-IN")}
                            </p>
                          </td>

                          <td className="py-4 px-6">
                            <p className="font-medium text-neutral-900">
                              {ord.customerDetails?.fullName}
                            </p>
                            <p className="text-xs text-stone-500">{ord.customerDetails?.phone}</p>
                          </td>

                          <td className="py-4 px-6 max-w-xs">
                            <p className="text-xs text-neutral-800 font-medium">
                              &ldquo;{cancelInfo.reason || "Customer self-cancelled via online portal"}&rdquo;
                            </p>
                            <p className="text-[11px] text-stone-400 capitalize">
                              By: {cancelInfo.cancelledBy || ord.customerDetails?.fullName || "customer"}
                            </p>
                          </td>

                          <td className="py-4 px-6">
                            <p className="font-bold text-neutral-900 text-sm">
                              ₹{ord.pricing?.grandTotal?.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[11px] text-stone-500 capitalize">
                              {ord.paymentMethod === "online" ? "Prepaid (Razorpay)" : "Cash on Delivery"}
                            </p>
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                refundStatusColor[cancelInfo.refundStatus] || "bg-stone-100 text-stone-600"
                              }`}
                            >
                              {ord.paymentMethod === "cod"
                                ? "No Refund (COD)"
                                : cancelInfo.refundStatus === "completed"
                                ? "Refund Completed"
                                : cancelInfo.refundStatus === "pending" || cancelInfo.refundStatus === "requested"
                                ? "Refund Pending (Review)"
                                : cancelInfo.refundStatus === "failed"
                                ? "Refund Failed"
                                : cancelInfo.refundStatus || "N/A"}
                            </span>
                            {cancelInfo.refundId && (
                              <p className="text-[10px] font-mono text-stone-500 mt-1">
                                ID: {cancelInfo.refundId}
                              </p>
                            )}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-[#1F2A44] hover:text-white transition-colors cursor-pointer"
                              >
                                Inspect Order
                              </button>
                              <button
                                disabled={isProcessingAction}
                                onClick={() => handleDeleteOrder(ord)}
                                className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Order"
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: INSPECT ORDER (Standard fulfillment) */}
      {/* ===================================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-serif font-bold text-lg text-neutral-900">
                  Order Details: #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-800 text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Customer & Delivery */}
            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-stone-400">
                Customer & Delivery Address
              </p>
              <div className="p-3 bg-stone-50 rounded-xl space-y-1 text-stone-800 border border-stone-100">
                <p className="font-semibold text-neutral-900 text-sm">
                  {selectedOrder.customerDetails?.fullName}
                </p>
                <p className="flex items-center gap-1.5 text-stone-600">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{selectedOrder.customerDetails?.phone}</span>
                </p>
                <p className="flex items-center gap-1.5 text-stone-600">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span>{selectedOrder.customerDetails?.email}</span>
                </p>
                <p className="flex items-start gap-1.5 text-stone-600 pt-1 border-t border-stone-200/50 mt-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-stone-400" />
                  <span>
                    {selectedOrder.shippingAddress?.streetAddress}, {selectedOrder.shippingAddress?.city},{" "}
                    {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                  </span>
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-stone-400">
                Ordered Items ({selectedOrder.items?.length || 0})
              </p>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900">{item.name}</p>
                      <p className="text-[11px] text-stone-500">
                        Size: {item.size} • Color: {item.color || "Standard"} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-neutral-900">
                      ₹{(item.price * item.quantity)?.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Manager */}
            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-stone-400">
                Courier Tracking ID
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="AWB / Courier Tracking ID (e.g. DLH982347102)"
                  defaultValue={selectedOrder.tracking?.trackingNumber}
                  id="orderTrackingInput"
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = document.getElementById("orderTrackingInput").value;
                    handleUpdateTracking(selectedOrder._id, val);
                  }}
                  className="px-4 py-2 bg-[#1F2A44] text-white rounded-xl text-xs font-semibold hover:bg-[#C6A75E] transition-colors"
                >
                  Save Tracking
                </button>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="p-4 bg-stone-50 rounded-xl space-y-1.5 text-xs border border-stone-100">
              <div className="flex justify-between text-stone-600">
                <span>Payment Method</span>
                <span className="font-medium text-stone-900 capitalize">
                  {selectedOrder.paymentMethod === "online" ? "Prepaid (Razorpay)" : "Cash on Delivery (COD)"}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Payment Status</span>
                <span className="font-medium text-stone-900 uppercase">
                  {selectedOrder.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1 border-t border-stone-200">
                <span>Grand Total</span>
                <span>₹{selectedOrder.pricing?.grandTotal?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => handleDeleteOrder(selectedOrder)}
                className="flex-1 py-2.5 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Order Permanently</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: INSPECT & PROCESS RETURN REQUEST */}
      {/* ===================================================================== */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif font-bold text-lg text-neutral-900">
                    Return Request: {selectedReturn.requestId || selectedReturn._id}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      RETURN_STATUSES.find((s) => s.value === selectedReturn.status)?.color ||
                      "bg-stone-100 text-stone-800"
                    }`}
                  >
                    {selectedReturn.status}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Order #{selectedReturn.orderNumber || selectedReturn.order?.orderNumber} • Submitted{" "}
                  {new Date(selectedReturn.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-stone-400 hover:text-stone-800 text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Customer & Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl space-y-1 border border-stone-200">
                <p className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">
                  Customer Contact
                </p>
                <p className="font-semibold text-neutral-900 text-sm">
                  {selectedReturn.customerDetails?.name || selectedReturn.order?.customerDetails?.fullName}
                </p>
                <p className="text-stone-600">
                  {selectedReturn.customerDetails?.phone || selectedReturn.order?.customerDetails?.phone}
                </p>
                <p className="text-stone-600">
                  {selectedReturn.customerDetails?.email || selectedReturn.order?.customerDetails?.email}
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF7F2] rounded-xl space-y-1 border border-[#C6A75E]/30 text-stone-800">
                <p className="font-bold text-[#1F2A44] uppercase tracking-wider text-[10px]">
                  Return Reason & Notes
                </p>
                <p className="font-semibold text-neutral-900">
                  &ldquo;{selectedReturn.reason}&rdquo;
                </p>
                {selectedReturn.description && (
                  <p className="text-stone-600 italic text-[11px] pt-1">
                    &ldquo;{selectedReturn.description}&rdquo;
                  </p>
                )}
                <p className="text-[10px] text-stone-500 pt-1 font-semibold">
                  Type: {selectedReturn.type === "exchange" ? "Doorstep Size Exchange" : "Return & Online Refund"}
                </p>
              </div>
            </div>

            {/* Items for return */}
            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-stone-400">
                Garments Included for Return ({selectedReturn.items?.length || 0})
              </p>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                {(selectedReturn.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-white">
                    <div className="flex items-center space-x-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-16 object-cover rounded-lg border border-stone-200"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-neutral-900">{item.name}</p>
                        <p className="text-[11px] text-stone-500">
                          Size: <strong>{item.size}</strong> • Color: <strong>{item.color || "Standard"}</strong> • Qty: <strong>{item.quantity}</strong>
                        </p>
                        {item.exchangeSize && (
                          <p className="text-[11px] font-semibold text-emerald-700">
                            Requested Exchange Size: {item.exchangeSize}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-neutral-900">
                      ₹{(item.price * item.quantity)?.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo evidence if provided */}
            {selectedReturn.photos && selectedReturn.photos.length > 0 && (
              <div className="space-y-2 text-xs">
                <p className="font-bold uppercase tracking-wider text-stone-400">
                  Customer Uploaded Evidence ({selectedReturn.photos.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedReturn.photos.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block w-20 h-24 rounded-lg overflow-hidden border border-stone-300 hover:border-[#1F2A44]"
                    >
                      <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px]">
                        Inspect
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* COD Payout details if applicable */}
            {selectedReturn.payoutDetails && (selectedReturn.payoutDetails.accountNumber || selectedReturn.payoutDetails.upiId) && (
              <div className="p-3.5 bg-amber-50/60 rounded-xl space-y-1.5 text-xs border border-amber-200 text-stone-800">
                <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Customer Verified Payout Information (For COD Refund)</span>
                </div>
                {selectedReturn.payoutDetails.method === "upi" ? (
                  <p>
                    <strong>UPI ID:</strong> {selectedReturn.payoutDetails.upiId}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <p><strong>Account Name:</strong> {selectedReturn.payoutDetails.accountHolderName}</p>
                    <p><strong>Account #:</strong> {selectedReturn.payoutDetails.accountNumber}</p>
                    <p><strong>Bank:</strong> {selectedReturn.payoutDetails.bankName}</p>
                    <p><strong>IFSC:</strong> {selectedReturn.payoutDetails.ifscCode}</p>
                  </div>
                )}
              </div>
            )}

            {/* Reverse Pickup Manager */}
            <div className="p-4 bg-stone-50 rounded-xl space-y-3 text-xs border border-stone-200">
              <p className="font-bold uppercase tracking-wider text-stone-600">
                Reverse Logistics & Pickup Scheduling
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Reverse Courier Name
                  </label>
                  <input
                    type="text"
                    value={pickupCourierName}
                    onChange={(e) => setPickupCourierName(e.target.value)}
                    placeholder="Delhivery Reverse Logistics"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Pickup AWB / Tracking ID
                  </label>
                  <input
                    type="text"
                    value={pickupTrackingNumber}
                    onChange={(e) => setPickupTrackingNumber(e.target.value)}
                    placeholder="REV-DELH8912739"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* Audit Trail / Status History */}
            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-stone-400">
                Atelier Audit Trail & Lifecycle
              </p>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 max-h-36 overflow-y-auto space-y-2">
                {(selectedReturn.statusHistory || []).map((h, idx) => (
                  <div key={idx} className="flex items-start justify-between text-[11px] pb-1.5 border-b border-stone-200/60 last:border-0 last:pb-0">
                    <div>
                      <span className="font-bold uppercase text-[#1F2A44]">{h.status}</span>
                      {h.note && <span className="text-stone-600 ml-1.5">— {h.note}</span>}
                    </div>
                    <span className="text-stone-400 font-mono text-[10px]">
                      {new Date(h.changedAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Decision / Inspection Notes Input */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-stone-700 block">
                Admin Inspection Notes / Reason for Decision
              </label>
              <textarea
                rows={2}
                value={returnDecisionNote}
                onChange={(e) => setReturnDecisionNote(e.target.value)}
                placeholder="Enter inspection results (e.g. Garment tags intact, no wear, approved for full refund)..."
                className="w-full p-3 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
              />
            </div>

            {/* Action Buttons Toolbar */}
            <div className="p-4 bg-stone-100 rounded-2xl space-y-3">
              <p className="font-bold uppercase tracking-wider text-stone-500 text-[10px]">
                Authorized Admin Actions
              </p>

              <div className="flex flex-wrap gap-2">
                {/* 1. Approve */}
                {selectedReturn.status === "requested" && (
                  <button
                    disabled={isProcessingAction}
                    onClick={() => handleUpdateReturnStatus(selectedReturn._id, "approved")}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 transition-colors shadow-xs"
                  >
                    ✓ Approve Request
                  </button>
                )}

                {/* 2. Schedule Pickup */}
                {["requested", "approved"].includes(selectedReturn.status) && (
                  <button
                    disabled={isProcessingAction}
                    onClick={() => handleUpdateReturnStatus(selectedReturn._id, "pickup_scheduled")}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs disabled:opacity-50 transition-colors shadow-xs"
                  >
                    Schedule Delhivery Reverse Pickup
                  </button>
                )}

                {/* 3. Mark Received */}
                {["approved", "pickup_scheduled"].includes(selectedReturn.status) && (
                  <button
                    disabled={isProcessingAction}
                    onClick={() => handleUpdateReturnStatus(selectedReturn._id, "item_received")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50 transition-colors shadow-xs"
                  >
                    Mark Parcel Received at Warehouse
                  </button>
                )}

                {/* 4. Inspection Passed */}
                {["item_received"].includes(selectedReturn.status) && (
                  <button
                    disabled={isProcessingAction}
                    onClick={() => handleUpdateReturnStatus(selectedReturn._id, "inspection_passed")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs disabled:opacity-50 transition-colors shadow-xs"
                  >
                    ✓ Quality Inspection Passed
                  </button>
                )}

                {/* 5. Inspection Failed */}
                {["item_received"].includes(selectedReturn.status) && (
                  <button
                    disabled={isProcessingAction}
                    onClick={() => handleUpdateReturnStatus(selectedReturn._id, "inspection_failed")}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50 transition-colors shadow-xs"
                  >
                    ✕ Inspection Failed (Tags missing / Worn)
                  </button>
                )}

                {/* 6. Reject Request */}
                {!["completed", "rejected"].includes(selectedReturn.status) && (
                  <button
                    disabled={isProcessingAction}
                    onClick={() => {
                      if (!returnDecisionNote.trim()) {
                        alert("Please specify the reason for rejection in the notes field above.");
                        return;
                      }
                      handleUpdateReturnStatus(selectedReturn._id, "rejected");
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-rose-100 hover:text-rose-800 text-stone-700 font-semibold text-xs disabled:opacity-50 transition-colors"
                  >
                    Reject Request
                  </button>
                )}
              </div>

              {/* Refund Initiation Panel (Only when inspection passed or approved) */}
              {["inspection_passed", "approved"].includes(selectedReturn.status) &&
                selectedReturn.type === "return_refund" && (
                  <div className="pt-3 border-t border-stone-200 mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-neutral-900">
                          Settle Customer Refund: ₹{selectedReturn.refundAmount?.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {selectedReturn.payoutDetails?.method === "bank_transfer" ||
                          selectedReturn.payoutDetails?.method === "upi"
                            ? "Cash on Delivery: Verify manual bank transfer reference"
                            : "Prepaid: Direct Razorpay online refund API"}
                        </p>
                      </div>
                    </div>
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Bank UTR / Transaction Reference Number <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={codPayoutReference}
                        onChange={(e) => setCodPayoutReference(e.target.value)}
                        placeholder="e.g. UTR-HDFC982341908234 or TXN-REF-12345"
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white text-stone-900"
                      />
                      <p className="text-[10px] text-stone-500 mt-1">
                        Phase 1 Guard: Live automated Razorpay gateway is disabled. Record verified manual transaction reference to finalize this refund.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => handleProcessRefund(selectedReturn)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors shadow-xs"
                    >
                      <IndianRupee className="w-4 h-4" />
                      <span>
                        {isProcessingAction ? "Processing Settlement..." : `Finalize & Issue Refund of ₹${selectedReturn.refundAmount}`}
                      </span>
                    </button>
                  </div>
                )}
            </div>

            {/* Footer */}
            <button
              onClick={() => setSelectedReturn(null)}
              className="w-full py-2.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: SINGLE ORDER DELETE CONFIRMATION DIALOG */}
      {/* ===================================================================== */}
      {orderToDeleteSingle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-neutral-900">
                    Confirm Order Deletion
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    #{orderToDeleteSingle.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderToDeleteSingle(null)}
                className="text-stone-400 hover:text-stone-800 text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Order Summary Card */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Order Classification:</span>
                {isTestOrder(orderToDeleteSingle) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    🧪 Verified Test / Demo Order
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    👤 Live Customer Order
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Customer:</span>
                <span className="font-semibold text-neutral-900">
                  {orderToDeleteSingle.customerDetails?.fullName || "Guest Customer"} ({orderToDeleteSingle.customerDetails?.email || "No email"})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Amount & Payment:</span>
                <span className="font-medium text-neutral-900">
                  ₹{orderToDeleteSingle.pricing?.grandTotal?.toLocaleString("en-IN")} • {orderToDeleteSingle.paymentMethod === "online" ? "Prepaid" : "COD"} ({orderToDeleteSingle.paymentStatus})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Current Status:</span>
                <span className="font-semibold capitalize text-stone-800">
                  {orderToDeleteSingle.orderStatus}
                </span>
              </div>
            </div>

            {/* Warning & Data Integrity Notice */}
            <div className="space-y-2 text-xs">
              {!isTestOrder(orderToDeleteSingle) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Caution: Live Customer Order</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      This order was placed by a genuine customer. Deleting it will permanently remove it from customer history and reports.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 space-y-1.5 text-[11px]">
                <p className="font-bold text-neutral-900 text-xs">Data Integrity & Stock Safety:</p>
                {["placed", "confirmed"].includes(orderToDeleteSingle.orderStatus) ? (
                  <p className="text-emerald-700 flex items-center gap-1">
                    ✓ Stock units ({orderToDeleteSingle.items?.length || 0} items) will be safely restored back to the product catalog once.
                  </p>
                ) : ["cancelled", "returned"].includes(orderToDeleteSingle.orderStatus) ? (
                  <p className="text-stone-600">
                    ℹ️ Stock was already restored during cancellation/return. It will not be duplicated.
                  </p>
                ) : (
                  <p className="text-stone-600">
                    ℹ️ Order is in {orderToDeleteSingle.orderStatus} status. Stock will not be altered.
                  </p>
                )}
                <p className="text-stone-500">
                  ✓ Associated return requests, checkout reservations, and test payment records will be cleaned up.
                </p>
                <p className="text-stone-500">
                  ✓ Action will be permanently recorded in the Admin Audit Log.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setOrderToDeleteSingle(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeSingleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Permanently Delete Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: BULK DELETE CONFIRMATION DIALOG */}
      {/* ===================================================================== */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-neutral-900">
                    Confirm Bulk Delete Orders
                  </h3>
                  <p className="text-xs text-stone-500">
                    {selectedOrderIds.length} orders selected for permanent removal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="text-stone-400 hover:text-stone-800 text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-purple-700 font-bold text-lg">{selectedOrdersBreakdown.testCount}</p>
                <p className="text-purple-900 font-semibold text-[11px]">Verified Test Orders</p>
                <p className="text-purple-600 text-[10px]">Safe to delete</p>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  selectedOrdersBreakdown.liveCount > 0
                    ? "bg-amber-50 border-amber-300"
                    : "bg-stone-50 border-stone-200"
                }`}
              >
                <p
                  className={`font-bold text-lg ${
                    selectedOrdersBreakdown.liveCount > 0 ? "text-amber-800" : "text-stone-700"
                  }`}
                >
                  {selectedOrdersBreakdown.liveCount}
                </p>
                <p
                  className={`font-semibold text-[11px] ${
                    selectedOrdersBreakdown.liveCount > 0 ? "text-amber-900" : "text-stone-600"
                  }`}
                >
                  Live Customer Orders
                </p>
                <p
                  className={`text-[10px] ${
                    selectedOrdersBreakdown.liveCount > 0
                      ? "text-amber-700 font-medium"
                      : "text-stone-400"
                  }`}
                >
                  {selectedOrdersBreakdown.liveCount > 0
                    ? "Requires careful review"
                    : "None selected"}
                </p>
              </div>
            </div>

            {/* Warning if any live orders selected */}
            {selectedOrdersBreakdown.liveCount > 0 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Warning: Live Orders Included in Selection!</p>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      Your selection contains {selectedOrdersBreakdown.liveCount} live customer order(s).
                      Real customer orders should generally not be deleted.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const onlyTest = orders
                      .filter((o) => selectedOrderIds.includes(o._id) && isTestOrder(o))
                      .map((o) => o._id);
                    setSelectedOrderIds(onlyTest);
                    showNotification("Deselected live customer orders. Kept only verified test orders.");
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Deselect Live Orders (Keep Only {selectedOrdersBreakdown.testCount} Test Orders)
                </button>
              </div>
            )}

            {/* Selected Orders List Preview */}
            <div className="space-y-1.5 text-xs">
              <p className="font-bold uppercase tracking-wider text-stone-500 text-[11px]">
                Selected Orders Preview ({selectedOrderIds.length}):
              </p>
              <div className="max-h-48 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl bg-stone-50/50">
                {orders
                  .filter((o) => selectedOrderIds.includes(o._id))
                  .map((ord) => {
                    const test = isTestOrder(ord);
                    return (
                      <div key={ord._id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-neutral-900">#{ord.orderNumber}</span>
                            {test ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                                TEST
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                LIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500">
                            {ord.customerDetails?.fullName} ({ord.customerDetails?.email || ord.customerDetails?.phone})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-neutral-900">
                            ₹{ord.pricing?.grandTotal?.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] text-stone-500 capitalize">{ord.orderStatus}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Safety info */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
              <p className="font-bold text-neutral-900">Safety & Integrity Guarantees:</p>
              <p>✓ Inventory stock will be safely restored once for any placed/confirmed orders.</p>
              <p>✓ Associated test payment records and return requests will be cleanly deleted.</p>
              <p>✓ Admin Audit Log will record this bulk deletion action permanently.</p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeBulkDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Bulk Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Bulk Delete ({selectedOrderIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
