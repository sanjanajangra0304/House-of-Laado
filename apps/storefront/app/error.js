"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Storefront Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <span className="text-xs uppercase tracking-widest text-secondary font-bold block">
          500 System Notice
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">
          Something Went Wrong
        </h1>
        <p className="text-sm text-muted leading-relaxed font-sans">
          We encountered an unexpected issue while loading this page. Our team has been notified.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="btn-primary w-full sm:w-auto text-xs py-3 px-6 cursor-pointer"
          >
            Try Again
          </button>
          <Link href="/" className="btn-outline w-full sm:w-auto text-xs py-3 px-6">
            Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
