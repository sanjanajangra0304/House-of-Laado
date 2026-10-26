import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="py-3 text-xs text-burgundy/80 font-sans">
      <ol className="flex items-center space-x-1.5 flex-wrap">
        <li>
          <Link
            href="/"
            className="flex items-center text-burgundy/80 hover:text-rose transition-colors"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            <span>Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-blush" />
              {isLast || !item.href ? (
                <span className="font-semibold text-burgundy truncate max-w-[200px] sm:max-w-none">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-rose transition-colors truncate max-w-[150px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
