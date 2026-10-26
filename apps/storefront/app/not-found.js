import Link from "next/link";
import { brand } from "@/config/brand";

export const metadata = {
  title: `Page Not Found (404) | ${brand.name}`,
  description: "The page you are looking for cannot be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-ivory-light">
      <div className="max-w-md w-full text-center space-y-6">
        <span className="text-xs uppercase tracking-widest text-rose font-bold block">
          404 Error
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-burgundy">
          Page Not Found
        </h1>
        <p className="text-sm text-burgundy/85 leading-relaxed font-sans">
          The artisanal silhouette or page you are searching for might have been moved, renamed, or is temporarily out of season.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="btn-primary w-full sm:w-auto text-xs py-3 px-6">
            Back to Home
          </Link>
          <Link href="/shop" className="btn-outline w-full sm:w-auto text-xs py-3 px-6">
            Explore All Collections
          </Link>
        </div>
      </div>
    </div>
  );
}
