"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MobileBottomNav } from "./MobileBottomNav";
import { WhatsAppQuickLink } from "@/components/ui/WhatsAppQuickLink";
import { BackToTop } from "@/components/ui/BackToTop";
import { CookieConsent } from "@/components/ui/CookieConsent";

export function StorefrontLayoutShell({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname ? pathname.startsWith("/admin") : false;

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {/* Top Announcement Bar */}
      <AnnouncementBar />

      {/* Sticky Header with Search, Wishlist, and Cart Counter */}
      <Header />

      {/* Main Customer Page Content */}
      <main className="flex-1">{children}</main>

      {/* Comprehensive Footer */}
      <Footer />

      {/* Slide-out Cart Drawer */}
      <CartDrawer />

      {/* Sticky Bottom Navigation for Mobile Devices */}
      <MobileBottomNav />

      {/* Global Utility Overlays */}
      <WhatsAppQuickLink />
      <BackToTop />
      <CookieConsent />
    </>
  );
}
