"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Home, Grid, Heart, User, ShoppingBag } from "lucide-react";
import { handleShopNowClick } from "@/lib/auth-helpers";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalCount, wishlist, setIsCartOpen } = useCart();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    {
      label: "Shop",
      action: () => handleShopNowClick(router, "/shop"),
      icon: Grid,
      isCurrent: pathname === "/shop",
    },
    {
      label: "Wishlist",
      href: "/wishlist",
      icon: Heart,
      badge: wishlist.length > 0 ? wishlist.length : null
    },
    { label: "Account", href: "/account", icon: User },
    {
      label: "Cart",
      action: () => setIsCartOpen(true),
      icon: ShoppingBag,
      badge: totalCount > 0 ? totalCount : null
    }
  ];


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-ivory-light border-t border-blush shadow-lg lg:hidden">
      <div className="grid grid-cols-5 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = (item.href && pathname === item.href) || item.isCurrent;

          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`flex flex-col items-center justify-center relative transition-colors ${
                  isActive ? "text-rose font-bold" : "text-burgundy hover:text-rose"
                }`}
                aria-label={item.label}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge !== null && (
                    <span className="absolute -top-1.5 -right-2 bg-rose text-ivory-light text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center relative transition-colors ${
                isActive ? "text-rose font-bold" : "text-burgundy hover:text-rose"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.2]" : "stroke-[1.7]"}`} />
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-2 bg-rose text-ivory-light text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
