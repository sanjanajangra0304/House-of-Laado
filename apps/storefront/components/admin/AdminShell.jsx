"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Bell,
  Store,
  ChevronRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { brand } from "@/config/brand";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products & Stock", icon: ShoppingBag },
  { href: "/admin/orders", label: "Customer Orders", icon: Package },
];

export function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, isAuthenticated, isLoading, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  // Enforce server-backed authentication protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // If on the login page, render children directly
  if (isLoginPage) {
    return <div className="min-h-screen bg-stone-50">{children}</div>;
  }

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  // Guard while resolving session or redirecting
  if (isLoading || (!isAuthenticated && pathname !== "/admin/login")) {
    return (
      <div className="min-h-screen bg-[#fcfbfa] flex flex-col items-center justify-center p-6 text-stone-600">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F2A44] mb-3" />
        <p className="text-sm font-medium">Verifying administrator session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbfa] flex flex-col md:flex-row text-neutral-800">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#1F2A44] text-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded text-white/90 hover:bg-white/10"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-serif font-bold text-lg tracking-wide">{brand.name}</span>
          <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded text-white">
            Admin
          </span>
        </div>
        <Link
          href="/"
          target="_blank"
          className="text-xs flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full text-white/90 hover:bg-white/25 transition-colors"
        >
          <span>Store</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] text-white flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-0 max-md:-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                {brand.name}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#d0473e] text-white px-1.5 py-0.5 rounded">
                Portal
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">Store Owner Operations</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#1F2A44] text-white shadow-sm"
                    : "text-stone-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-stone-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-6 pb-2">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Quick Links
            </p>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm text-stone-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-stone-400" />
              <span>Customer Storefront</span>
            </div>
            <ExternalLink className="w-4 h-4 text-stone-400" />
          </Link>
        </nav>

        {/* User Footer & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#1F2A44] flex items-center justify-center font-bold text-sm text-white border border-white/20">
                A
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {adminUser?.name || "Admin"}
                </p>
                <p className="text-xs text-stone-400 truncate">
                  {adminUser?.email || "admin@store.com"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-stone-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="hidden md:flex h-16 bg-white border-b border-stone-200 px-8 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span>Admin</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-semibold text-neutral-900 capitalize">
              {pathname === "/admin"
                ? "Overview"
                : pathname.replace("/admin/", "").replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Catalog Live</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <span>View Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Backdrop for mobile sidebar */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}
    </div>
  );
}
