"use client";

import { useState } from "react";
import Link from "next/link";
import { brand } from "@/config/brand";
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { subscribeNewsletterApi } from "@/lib/api";
import { useCart } from "@/lib/cart-context";

export function Footer() {
  const { applyCoupon, appliedCoupon } = useCart();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [welcomeData, setWelcomeData] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [appliedDirectly, setAppliedDirectly] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await subscribeNewsletterApi(email, "footer");
      setWelcomeData(res?.data || { couponCode: "WELCOME10", email });
      setSubscribed(true);
      setEmail("");
    } catch (err) {
      setError(err?.message || "Unable to subscribe at this moment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    const code = welcomeData?.couponCode || "WELCOME10";
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Format phone number for tel: link (ensure international +91 prefix)
  const phoneDigits = (brand.contact?.phone || "").replace(/[^0-9]/g, "");
  const telNumber = phoneDigits.startsWith("91")
    ? `+${phoneDigits}`
    : phoneDigits.length === 10
      ? `+91${phoneDigits}`
      : `+${phoneDigits}`;

  // WhatsApp number in international format without symbols or spaces (wa.me)
  const rawWhatsApp = brand.contact?.whatsappNumber || brand.contact?.whatsapp || "";
  const whatsappDigits = rawWhatsApp.replace(/[^0-9]/g, "");
  const formattedWhatsAppDigits = whatsappDigits.startsWith("91")
    ? whatsappDigits
    : whatsappDigits.length === 10
      ? `91${whatsappDigits}`
      : whatsappDigits;
  const whatsappUrl = `https://wa.me/${formattedWhatsAppDigits}`;

  // Google Maps location URL for the business address
  const googleMapsUrl =
    brand.contact?.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      brand.contact?.address || "108 Heritage Crafts Lane C-Scheme Jaipur Rajasthan 302001 India"
    )}`;

  return (
    <footer className="bg-burgundy border-t border-blush mt-16 pt-16 pb-20 lg:pb-12 text-ivory-light">
      {/* Newsletter Strip */}
      <div className="max-w-container mx-auto px-4 sm:px-6 mb-16">
        <div className="bg-burgundy-dark text-ivory-light rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl border border-blush/30">
          <div className="max-w-xl mx-auto relative z-10">
            <span className="text-blush uppercase tracking-widest text-xs font-semibold block mb-2 font-sans">
              Join Our Artisan Community
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-3 text-ivory-light">
              Get 10% Off Your First Order
            </h3>
            <p className="text-blush text-sm mb-6 font-sans">
              Subscribe for exclusive previews of our Festive Edits, secret sales, and stories from our Jaipur block print workshops.
            </p>

            {subscribed ? (
              <div className="bg-ivory-light/10 backdrop-blur-md border border-blush/40 rounded-2xl p-6 text-ivory-light shadow-xl text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Welcome to Our Artisan Community</span>
                </div>

                <p className="text-sm font-medium text-ivory-light mb-1">
                  ✨ We&apos;ve sent your exclusive welcome letter and 10% gift to:
                </p>
                <p className="font-mono text-xs text-blush font-semibold mb-4 bg-burgundy/60 py-1 px-3 rounded-full inline-block border border-blush/20">
                  {welcomeData?.email || "your inbox"}
                </p>

                {/* Coupon Box */}
                <div className="bg-ivory-light text-burgundy rounded-xl p-4 max-w-sm mx-auto shadow-md border border-blush mb-4">
                  <div className="text-[11px] uppercase tracking-wider text-burgundy/70 font-semibold mb-1">
                    Your 10% Welcome Discount Code
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-bold text-xl tracking-wider text-burgundy select-all">
                      {welcomeData?.couponCode || "WELCOME10"}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 text-xs font-medium bg-burgundy text-ivory-light rounded-md hover:bg-burgundy-dark transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1.5">
                    Apply at checkout for 10% off any order of ₹999 or more
                  </p>

                  {appliedCoupon?.code === (welcomeData?.couponCode || "WELCOME10") || appliedDirectly ? (
                    <div className="mt-2.5 pt-2 border-t border-stone-200 text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Applied to your Bag! 10% off ready at checkout.</span>
                    </div>
                  ) : (
                    <div className="mt-2.5 pt-2 border-t border-stone-200">
                      <button
                        type="button"
                        onClick={async () => {
                          const code = welcomeData?.couponCode || "WELCOME10";
                          await applyCoupon(code, 1500);
                          setAppliedDirectly(true);
                        }}
                        className="w-full py-1.5 rounded-pill bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-serif font-bold transition-colors shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Apply 10% Discount to My Bag Now</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-pill bg-ivory-light text-burgundy font-serif font-semibold text-xs hover:bg-blush transition-all shadow-md active:scale-95"
                  >
                    <span>Shop Collections with 10% Off</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSubscribed(false);
                      setWelcomeData(null);
                    }}
                    className="text-xs text-blush/80 hover:text-ivory-light underline cursor-pointer"
                  >
                    Subscribe another email
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-12 px-6 rounded-pill bg-ivory-light text-burgundy placeholder:text-burgundy/50 text-sm focus:outline-none focus:ring-2 focus:ring-rose border border-blush flex-1 shadow-inner disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 px-8 rounded-pill bg-ivory-light text-burgundy font-serif font-semibold text-sm hover:bg-blush hover:text-burgundy transition-all flex items-center justify-center space-x-1.5 shadow-md active:scale-95 focus-visible:outline-2 focus-visible:outline-ivory-light disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-burgundy" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <ArrowRight className="w-4 h-4 text-burgundy" />
                      </>
                    )}
                  </button>
                </form>
                {error && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-200 border border-red-400/30 text-xs text-center max-w-md">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-container mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Column 1: Brand & Contact Info */}
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            {brand.logo?.imageUrl && (
              <img
                src={brand.logo.imageUrl}
                alt={brand.logo.alt || brand.name}
                className="w-14 h-14 object-contain rounded-full bg-ivory-light p-1 border border-blush/60 shadow-md transition-transform group-hover:scale-105"
              />
            )}
            <div>
              <span className="font-serif text-2xl font-bold text-ivory-light block leading-tight">
                {brand.name}
              </span>
              <span className="text-[11px] uppercase tracking-widest text-blush block mt-0.5">
                {brand.tagline}
              </span>
            </div>
          </Link>
          <p className="text-xs text-blush leading-relaxed">
            {brand.shortDescription}
          </p>

          <div className="space-y-2.5 text-xs pt-2">
            <div className="flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-olive mt-0.5 flex-shrink-0" aria-hidden="true" />
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory-light/90 hover:text-blush transition-colors leading-relaxed hover:underline underline-offset-2"
                aria-label={`Open ${brand.name} business address on Google Maps: ${brand.contact.address}`}
              >
                {brand.contact.address}
              </a>
            </div>
            <div className="flex items-center space-x-2.5">
              <Phone className="w-4 h-4 text-olive flex-shrink-0" aria-hidden="true" />
              <a
                href={`tel:${telNumber}`}
                className="text-ivory-light/90 hover:text-blush transition-colors hover:underline underline-offset-2"
                aria-label={`Call ${brand.name} at ${brand.contact.phone}`}
              >
                {brand.contact.phone}
              </a>
            </div>
            <div className="flex items-center space-x-2.5">
              <svg
                className="w-4 h-4 text-olive flex-shrink-0 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory-light/90 hover:text-blush transition-colors hover:underline underline-offset-2"
                aria-label={`Chat with ${brand.name} on WhatsApp at ${brand.contact.whatsapp}`}
              >
                WhatsApp: {brand.contact.whatsapp}
              </a>
            </div>
            <div className="flex items-center space-x-2.5">
              <Mail className="w-4 h-4 text-olive flex-shrink-0" aria-hidden="true" />
              <a
                href={`mailto:${brand.contact.email}`}
                className="text-ivory-light/90 hover:text-blush transition-colors break-all hover:underline underline-offset-2"
                aria-label={`Send an email to ${brand.name} at ${brand.contact.email}`}
              >
                {brand.contact.email}
              </a>
            </div>
          </div>
        </div>

        {/* Column 2: Categories */}
        <div>
          <h4 className="font-serif font-bold text-ivory-light text-base mb-4 tracking-tight">
            Shop Collections
          </h4>
          <ul className="space-y-2 text-xs font-sans">
            <li>
              <Link href="/collections/suit-sets" className="text-ivory-light/90 hover:text-blush transition-colors">
                Pure Cotton Suit Sets
              </Link>
            </li>
            <li>
              <Link href="/collections/kurtas" className="text-ivory-light/90 hover:text-blush transition-colors">
                A-Line & Straight Kurtas
              </Link>
            </li>
            <li>
              <Link href="/collections/anarkali-suit-sets" className="text-ivory-light/90 hover:text-blush transition-colors">
                Anarkali Flared Sets
              </Link>
            </li>
            <li>
              <Link href="/collections/coord-sets" className="text-ivory-light/90 hover:text-blush transition-colors">
                Lounge & Co-ord Sets
              </Link>
            </li>
            <li>
              <Link href="/collections/dresses" className="text-ivory-light/90 hover:text-blush transition-colors">
                Tiered Ethnic Dresses
              </Link>
            </li>
            <li>
              <Link href="/collections/bags" className="text-ivory-light/90 hover:text-blush transition-colors">
                Quilted Tote Bags
              </Link>
            </li>
            <li>
              <Link href="/collections/festive-edit" className="text-blush font-semibold hover:text-ivory-light underline">
                Festive Edit 2026
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Quick Links & Policies */}
        <div>
          <h4 className="font-serif font-bold text-ivory-light text-base mb-4 tracking-tight">
            Customer Care
          </h4>
          <ul className="space-y-2 text-xs font-sans">
            <li>
              <Link href="/track-order" className="text-ivory-light font-medium hover:text-blush transition-colors">
                Track Your Order
              </Link>
            </li>
            <li>
              <Link href="/exchange-policy" className="text-ivory-light/90 hover:text-blush transition-colors">
                7-Day Exchange & Returns
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="text-ivory-light/90 hover:text-blush transition-colors">
                Shipping & Delivery Policy
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="text-ivory-light/90 hover:text-blush transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms-of-service" className="text-ivory-light/90 hover:text-blush transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-ivory-light/90 hover:text-blush transition-colors">
                About Our Atelier
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-ivory-light/90 hover:text-blush transition-colors">
                Contact & Support
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Security & Socials */}
        <div className="space-y-4">
          <h4 className="font-serif font-bold text-ivory-light text-base mb-2 tracking-tight">
            Connect With Us
          </h4>
          <p className="text-xs text-blush">
            Follow our design diary on Instagram for behind-the-scenes block printing videos.
          </p>

          <div className="flex space-x-3 pt-1">
            <a
              href={brand.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-burgundy-dark border border-blush/40 flex items-center justify-center text-ivory-light hover:bg-blush hover:text-burgundy transition-all hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-blush"
              aria-label={`Follow ${brand.name} on Instagram`}
            >
              <Instagram className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-burgundy-dark border border-blush/40 flex items-center justify-center text-ivory-light hover:bg-blush hover:text-burgundy transition-all hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-blush"
              aria-label={`Chat with ${brand.name} on WhatsApp`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </a>
          </div>

          <div className="pt-3 border-t border-blush/30">
            <div className="flex items-center space-x-2 text-xs text-ivory-light font-medium mb-1">
              <ShieldCheck className="w-4 h-4 text-olive" />
              <span>100% Genuine Jaipur Craft</span>
            </div>
            <p className="text-[11px] text-blush">
              All orders processed with Jaipur craft authenticity guarantee. Cash on Delivery & Doorstep UPI accepted.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-container mx-auto px-4 sm:px-6 pt-8 border-t border-blush/30 flex flex-col sm:flex-row items-center justify-between text-xs text-blush space-y-4 sm:space-y-0">
        <p>
          © {new Date().getFullYear()} {brand.name}. All Rights Reserved. Crafted with pride in Mahendergarh,Haryana.
        </p>
        <div className="flex items-center space-x-4 text-[11px] text-blush">
          <span>Made in India</span>
          <span>•</span>
          <span>Pan-India Delivery</span>
          <span>•</span>
          <span>Authentic Handloom</span>
        </div>
      </div>
    </footer>
  );
}
