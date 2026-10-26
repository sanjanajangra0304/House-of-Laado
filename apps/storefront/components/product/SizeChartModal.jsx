"use client";

import { X, Ruler } from "lucide-react";

export function SizeChartModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const sizeTable = [
    { size: "XS", bust: "34", waist: "28", hip: "36", length: "44" },
    { size: "S", bust: "36", waist: "30", hip: "38", length: "44" },
    { size: "M", bust: "38", waist: "32", hip: "40", length: "45" },
    { size: "L", bust: "40", waist: "34", hip: "42", length: "45" },
    { size: "XL", bust: "42", waist: "36", hip: "44", length: "46" },
    { size: "XXL", bust: "44", waist: "38", hip: "46", length: "46" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-burgundy/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-ivory-light border border-blush rounded-2xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-blush mb-4">
          <div className="flex items-center space-x-2">
            <Ruler className="w-5 h-5 text-rose" />
            <h3 className="font-serif text-lg font-bold text-burgundy">
              Standard Size Guide (Inches)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-burgundy/70 hover:text-burgundy hover:bg-blush-light transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Size Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-blush-light text-burgundy border-b border-blush">
                <th className="py-2.5 px-3 font-serif font-bold">Size</th>
                <th className="py-2.5 px-3 font-semibold">Bust</th>
                <th className="py-2.5 px-3 font-semibold">Waist</th>
                <th className="py-2.5 px-3 font-semibold">Hip</th>
                <th className="py-2.5 px-3 font-semibold">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush/60">
              {sizeTable.map((row) => (
                <tr key={row.size} className="hover:bg-blush-light/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-burgundy font-serif">
                    {row.size}
                  </td>
                  <td className="py-2.5 px-3 text-burgundy/80">{row.bust}&quot;</td>
                  <td className="py-2.5 px-3 text-burgundy/80">{row.waist}&quot;</td>
                  <td className="py-2.5 px-3 text-burgundy/80">{row.hip}&quot;</td>
                  <td className="py-2.5 px-3 text-burgundy/80">{row.length}&quot;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measuring Tip */}
        <div className="bg-blush-light/60 border border-blush/40 rounded-xl p-3 text-xs text-burgundy/85 leading-relaxed">
          <p className="font-semibold text-burgundy mb-1">💡 How to Measure:</p>
          <p>
            Measure around the fullest part of your chest and waist using a tape measure. Our pure mulmul cotton suits feature a relaxed, comfortable drape. If between sizes, we recommend sizing up.
          </p>
        </div>
      </div>
    </div>
  );
}
