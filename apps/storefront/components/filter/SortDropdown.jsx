"use client";

import { ArrowUpDown } from "lucide-react";

export function SortDropdown({ value, onChange }) {
  const sortOptions = [
    { label: "Featured", value: "featured" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
    { label: "Best Selling", value: "bestselling" },
    { label: "Customer Rating", value: "rating" },
  ];

  return (
    <div className="flex items-center space-x-2 text-xs">
      <span className="text-burgundy/80 hidden sm:inline flex items-center">
        <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-rose" />
        Sort By:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 rounded-pill border border-blush bg-ivory-light text-burgundy text-xs focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose font-medium transition-colors cursor-pointer"
        aria-label="Sort products"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
