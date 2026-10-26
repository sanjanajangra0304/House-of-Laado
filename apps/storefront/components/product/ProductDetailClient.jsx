"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { SizeChartModal } from "@/components/product/SizeChartModal";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductReviews } from "@/components/product/ProductReviews";
import { isCustomerLoggedIn } from "@/lib/auth-helpers";
import {
  Star,
  Heart,
  ShoppingBag,
  Zap,
  Truck,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  Ruler,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Share2,
  Copy,
  Bell,
  X,
  MessageCircle,
  Tag,
  Sparkles,
  Percent,
} from "lucide-react";
import { AvailableOffersModal } from "@/components/checkout/AvailableOffersModal";
import { onProductImageError, DEFAULT_PRODUCT_FALLBACK } from "@/lib/image-fallback";
import { getColorHex } from "@/lib/colorHelper";

export function ProductDetailClient({ product }) {
  const router = useRouter();
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    applyCoupon,
    appliedCoupon,
    removeCoupon,
  } = useCart();
  const { showToast } = useToast();
  const wishlisted = isWishlisted(product.id);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);

  // Gallery images list
  const images = useMemo(() => {
    const list = [product.primaryImage];
    if (product.secondaryImage) list.push(product.secondaryImage);
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list.filter(Boolean);
  }, [product]);

  const [activeImage, setActiveImage] = useState(images[0]);

  // Dynamic Available Colors derived from product.variants or product.colors
  const availableColors = useMemo(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const colorMap = new Map();
      product.variants.forEach((v) => {
        const cName = (v.color || "").trim();
        if (!cName) return;
        if (!colorMap.has(cName)) {
          const found = (product.colors || []).find(
            (c) => (c.name || "").toLowerCase() === cName.toLowerCase()
          );
          colorMap.set(cName, {
            name: cName,
            hex: found?.hex || getColorHex(cName),
            totalStock: 0,
            availableStock: 0,
          });
        }
        const entry = colorMap.get(cName);
        const vStock = Math.max(0, (Number(v.stock) || 0) - (Number(v.reservedStock) || 0));
        entry.totalStock += Number(v.stock) || 0;
        entry.availableStock += vStock;
      });
      return Array.from(colorMap.values());
    }

    if (Array.isArray(product.colors) && product.colors.length > 0) {
      const overallStock = product.stock !== undefined ? Number(product.stock) : 20;
      return product.colors.map((c) => ({
        name: c.name || "Default",
        hex: c.hex || getColorHex(c.name || "Default"),
        totalStock: overallStock,
        availableStock: overallStock,
      }));
    }

    return [];
  }, [product]);

  const [selectedColor, setSelectedColor] = useState(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const inStock = product.variants.find((v) => (Number(v.stock) || 0) > 0);
      if (inStock && inStock.color) return inStock.color.trim();
      return (product.variants[0].color || "").trim() || "Default";
    }
    return product.colors?.[0]?.name || "Default";
  });

  // Ensure selectedColor stays valid if availableColors change
  useEffect(() => {
    if (availableColors.length > 0) {
      const exists = availableColors.some((c) => c.name === selectedColor);
      if (!exists) {
        const inStock = availableColors.find((c) => c.availableStock > 0);
        setSelectedColor(inStock ? inStock.name : availableColors[0].name);
      }
    }
  }, [availableColors, selectedColor]);

  // Available sizes for the currently selected color
  const sizesForColor = useMemo(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const colorVariants = product.variants.filter(
        (v) => (v.color || "").trim().toLowerCase() === (selectedColor || "").trim().toLowerCase()
      );
      const variantsToUse = colorVariants.length > 0 ? colorVariants : product.variants;
      return variantsToUse.map((v) => ({
        size: v.size,
        sku: v.sku,
        stock: Math.max(0, (Number(v.stock) || 0) - (Number(v.reservedStock) || 0)),
        price: v.price !== null && v.price !== undefined ? Number(v.price) : null,
      }));
    }

    const baseSizes = Array.isArray(product.sizes) && product.sizes.length > 0
      ? product.sizes
      : ["XS", "S", "M", "L", "XL", "XXL"];
    const overallStock = product.stock !== undefined ? Number(product.stock) : 20;
    return baseSizes.map((sz) => ({
      size: sz,
      sku: `${product.slug || "HOL"}-${sz}`,
      stock: overallStock,
      price: null,
    }));
  }, [product, selectedColor]);

  const [selectedSize, setSelectedSize] = useState(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const inStock = product.variants.find((v) => (Number(v.stock) || 0) > 0);
      if (inStock && inStock.size) return inStock.size;
      return product.variants[0].size || "M";
    }
    return product.sizes?.[1] || product.sizes?.[0] || "M";
  });

  // When selectedColor changes, ensure selectedSize is in-stock for this color
  useEffect(() => {
    if (sizesForColor.length > 0) {
      const currentMatch = sizesForColor.find((s) => s.size === selectedSize);
      if (!currentMatch || currentMatch.stock <= 0) {
        const firstInStock = sizesForColor.find((s) => s.stock > 0);
        if (firstInStock) {
          setSelectedSize(firstInStock.size);
        } else if (!currentMatch) {
          setSelectedSize(sizesForColor[0].size);
        }
      }
    }
  }, [sizesForColor, selectedSize]);

  // Active Variant matching
  const activeVariant = useMemo(() => {
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      return null;
    }
    return (
      product.variants.find(
        (v) =>
          (v.color || "").trim().toLowerCase() === (selectedColor || "").trim().toLowerCase() &&
          (v.size || "").trim().toLowerCase() === (selectedSize || "").trim().toLowerCase()
      ) || null
    );
  }, [product.variants, selectedColor, selectedSize]);

  const currentStock = activeVariant
    ? Math.max(0, (Number(activeVariant.stock) || 0) - (Number(activeVariant.reservedStock) || 0))
    : (product.stock !== undefined ? Number(product.stock) : 20);

  const isSoldOut = product.isSoldOut || (
    Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants.every((v) => Number(v.stock) <= 0)
      : (product.stock !== undefined && product.stock <= 0)
  );

  const isCurrentVariantSoldOut = currentStock <= 0;

  // Real-time price per variant (if variant has customized price)
  const displayPrice = activeVariant?.price && Number(activeVariant.price) > 0
    ? Number(activeVariant.price)
    : Number(product.sellingPrice);

  const comparePrice = product.compareAtPrice && Number(product.compareAtPrice) > displayPrice
    ? Number(product.compareAtPrice)
    : null;

  const discountPercent = comparePrice
    ? Math.round(((comparePrice - displayPrice) / comparePrice) * 100)
    : (product.discountPercent || 0);

  const selectedColorStock = useMemo(() => {
    const col = availableColors.find((c) => c.name === selectedColor);
    return col ? col.availableStock : null;
  }, [availableColors, selectedColor]);

  const [quantity, setQuantity] = useState(1);

  // Guard quantity bounds
  useEffect(() => {
    if (currentStock > 0 && quantity > currentStock) {
      setQuantity(currentStock);
    }
  }, [currentStock, quantity]);

  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50, isZoomed: false });

  // Pincode checker state
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null);

  // Accordion tabs
  const [openTab, setOpenTab] = useState("fabric");

  // Recently viewed products tracking
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("laado_recently_viewed") ||
        localStorage.getItem("vastra_recently_viewed") ||
        "[]"
      );
      // Filter out current product
      const others = stored.filter((p) => p.id !== product.id);
      setRecentlyViewed(others.slice(0, 4));

      // Prepend current product and store
      const updated = [product, ...stored.filter((p) => p.id !== product.id)].slice(0, 8);
      localStorage.setItem("laado_recently_viewed", JSON.stringify(updated));
    } catch (e) {
      // Storage unavailable or disabled
    }
  }, [product]);

  const toggleTab = (tab) => {
    setOpenTab((prev) => (prev === tab ? null : tab));
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
      setPincodeStatus({
        success: false,
        message: "Please enter a valid 6-digit Indian pincode."
      });
      return;
    }

    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 4);
    const dateString = deliveryDate.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });

    setPincodeStatus({
      success: true,
      message: `Delivery available by ${dateString}. Free shipping & Cash on Delivery eligible!`
    });
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    addToCart(product, selectedSize, selectedColor, quantity);

    if (!isCustomerLoggedIn()) {
      showToast("Please sign in or create an account to complete instant checkout.", "info");
      router.push(`/account?mode=login&redirect=${encodeURIComponent("/checkout")}`);
    } else {
      router.push("/checkout");
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("Product link copied to clipboard!", "success");
    }
  };

  const handleWhatsAppShare = () => {
    if (typeof window !== "undefined") {
      const shareText = encodeURIComponent(
        `Take a look at this beautiful ${product.name} at ₹${product.sellingPrice}: ${window.location.href}`
      );
      window.open(`https://wa.me/?text=${shareText}`, "_blank");
    }
  };

  const handleNotifySubmit = (e) => {
    e.preventDefault();
    if (!notifyEmail) return;
    setNotifySubmitted(true);
    showToast("We'll notify you as soon as this item is back in stock!", "success");
    setTimeout(() => {
      setIsNotifyModalOpen(false);
      setNotifySubmitted(false);
      setNotifyEmail("");
    }, 2000);
  };

  // Sample verified customer reviews
  const reviews = [
    {
      name: "Ananya Sharma",
      city: "New Delhi",
      rating: 5,
      date: "2 days ago",
      comment:
        "The Sanganeri handblock print is stunning and the pure cotton mulmul fabric feels exceptionally soft and breathable. Fits true to size and survived first wash without any color bleed.",
    },
    {
      name: "Pooja Mehta",
      city: "Mumbai",
      rating: 5,
      date: "1 week ago",
      comment:
        "Loved the stitching quality and the elegant zari piping details. Express delivery to Mumbai took only 3 days. Extremely happy with the purchase!",
    },
    {
      name: "Sneha Verma",
      city: "Bengaluru",
      rating: 5,
      date: "2 weeks ago",
      comment:
        "Perfect festive and office wear set. The pants have deep pockets and the dupatta drape is so graceful. Truly authentic Jaipur craftsmanship.",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4 sm:mt-6">
        {/* LEFT: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 items-start">
          {/* Vertical Thumbnails List */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible w-full md:w-24 flex-shrink-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`aspect-[3/4] w-20 md:w-full rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                  activeImage === img
                    ? "border-primary shadow-md scale-95"
                    : "border-border hover:border-muted opacity-80 hover:opacity-100"
                }`}
              >
                <img
                  src={img || DEFAULT_PRODUCT_FALLBACK}
                  alt={`${product.name} angle ${idx + 1}`}
                  onError={onProductImageError}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Main Stage Image with Interactive Magnifying Lens Zoom */}
          <div
            className="flex-1 w-full relative aspect-[3/4] rounded-2xl overflow-hidden border border-border bg-sand/20 shadow-sm group cursor-crosshair select-none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setZoomPos({ x, y, isZoomed: true });
            }}
            onMouseLeave={() => setZoomPos((prev) => ({ ...prev, isZoomed: false }))}
          >
            <img
              src={activeImage || DEFAULT_PRODUCT_FALLBACK}
              alt={product.name}
              onError={onProductImageError}
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              }}
              className={`w-full h-full object-cover object-center transition-transform duration-200 ease-out ${
                zoomPos.isZoomed ? "scale-[2.2]" : "scale-100"
              }`}
            />

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-4 right-4 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-md border border-blush/40 ${
                wishlisted
                  ? "bg-rose text-ivory-light"
                  : "bg-ivory-light/90 backdrop-blur-md text-burgundy hover:bg-rose hover:text-ivory-light"
              }`}
              aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? "fill-ivory-light" : ""}`} />
            </button>

            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
              {isSoldOut ? (
                <span className="bg-burgundy text-ivory-light text-[11px] font-bold px-2.5 py-1 rounded-badge uppercase tracking-wide">
                  Sold Out
                </span>
              ) : (
                <>
                  {product.isNew && (
                    <span className="bg-olive text-ivory-light text-[11px] font-bold px-2.5 py-1 rounded-badge uppercase tracking-wide">
                      New Arrival
                    </span>
                  )}
                  {product.compareAtPrice && product.compareAtPrice > product.sellingPrice && (
                    <span className="bg-rose text-ivory-light text-[11px] font-bold px-2.5 py-1 rounded-badge uppercase tracking-wide">
                      {product.discountPercent}% Off
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Product Buying Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category & Title */}
          <div>
            <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
              {product.category} • Handcrafted in Jaipur
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy leading-snug">
              {product.name}
            </h1>

            {/* Star Rating Widget */}
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500" />
                ))}
              </div>
              <span className="text-xs font-bold text-burgundy">
                {product.rating || "4.9"}
              </span>
              <span className="text-xs text-burgundy/50">
                ({product.reviewsCount || 48} Verified Reviews)
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-xl bg-blush-light border border-blush">
            <div className="flex items-baseline space-x-3">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-rose">
                ₹{displayPrice}
              </span>
              {comparePrice && (
                <span className="text-base text-burgundy/50 line-through">
                  ₹{comparePrice}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs font-bold text-olive bg-ivory-light px-2 py-0.5 rounded-full border border-olive/30">
                  Save {discountPercent}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-burgundy/85 mt-1 font-sans">
              Inclusive of all taxes. Free express shipping on orders over ₹1,000.
            </p>
            {activeVariant?.sku && (
              <p className="text-[10px] text-burgundy/60 mt-1 font-mono tracking-wide">
                SKU: <span className="font-semibold text-burgundy/80">{activeVariant.sku}</span>
              </p>
            )}
          </div>

          {/* Dynamic Color Swatch Selection */}
          {availableColors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-serif font-bold text-burgundy">
                  Select Color: <span className="font-sans font-normal text-burgundy/85">{selectedColor}</span>
                </label>
                {selectedColorStock !== null && (
                  <span className={`text-[11px] font-medium ${selectedColorStock > 0 ? "text-olive" : "text-rose font-semibold"}`}>
                    {selectedColorStock > 0 ? `${selectedColorStock} in stock` : "Color Out of Stock"}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {availableColors.map((c) => {
                  const isSelected = selectedColor === c.name;
                  const isOutOfStock = c.availableStock <= 0;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-pill border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-burgundy bg-burgundy text-ivory-light shadow-sm"
                          : isOutOfStock
                          ? "border-stone-300 text-stone-400 bg-stone-50 hover:border-stone-400"
                          : "border-blush text-burgundy hover:border-rose bg-white"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                      {isOutOfStock && (
                        <span className="text-[10px] text-rose font-bold">Sold Out</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector + Size Guide */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-serif font-bold text-burgundy">
                Select Size: <span className="font-sans font-normal text-burgundy/85">{selectedSize}</span>
              </label>
              <button
                type="button"
                onClick={() => setIsSizeModalOpen(true)}
                className="text-xs text-rose font-semibold hover:underline flex items-center space-x-1"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Guide</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {sizesForColor.map((item) => {
                const isSelected = selectedSize === item.size;
                const isOutOfStock = item.stock <= 0;
                return (
                  <button
                    key={item.size}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(item.size)}
                    title={isOutOfStock ? `${item.size} is out of stock in ${selectedColor}` : `${item.size} (${item.stock} left)`}
                    className={`min-w-[46px] h-10 px-3 rounded-pill text-xs font-bold font-serif border transition-all ${
                      isSelected
                        ? "bg-burgundy text-ivory-light border-burgundy shadow-sm"
                        : isOutOfStock
                        ? "border-dashed border-stone-200 text-stone-300 bg-stone-50 cursor-not-allowed line-through"
                        : "border-blush text-burgundy hover:border-rose bg-white"
                    }`}
                  >
                    {item.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Stock Urgency */}
          <div className="flex items-center space-x-4 pt-2">
            {!isCurrentVariantSoldOut ? (
              <>
                <div className="flex items-center border border-blush rounded-pill px-3 py-1 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-burgundy/85 hover:text-rose px-1.5 py-0.5 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-burgundy px-3">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="text-burgundy/85 hover:text-rose px-1.5 py-0.5 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={quantity >= currentStock}
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center space-x-1.5 text-xs text-olive font-semibold">
                  <span className="w-2 h-2 rounded-full bg-olive animate-ping" />
                  <span>
                    In Stock • {currentStock <= 5 ? `Only ${currentStock} left in this size & color!` : "Ready to Dispatch"}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1.5 text-xs text-rose font-semibold">
                <AlertCircle className="w-4 h-4 text-rose" />
                <span>
                  {selectedColor} in size {selectedSize} is currently out of stock
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons: Add to Cart & Buy Now OR Notify Me */}
          <div className="space-y-3 pt-2">
            {!isCurrentVariantSoldOut ? (
              <>
                <button
                  type="button"
                  onClick={() => addToCart(product, selectedSize, selectedColor, quantity)}
                  className="btn-secondary w-full py-4 text-sm flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="btn-primary w-full py-4 text-sm flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Buy It Now • Instant Checkout</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsNotifyModalOpen(true)}
                className="w-full py-4 rounded-full border-2 border-dashed border-rose/50 bg-rose/5 text-rose font-serif font-bold text-sm flex items-center justify-center space-x-2 hover:bg-rose/10 transition-colors"
              >
                <Bell className="w-4 h-4 text-rose" />
                <span>Notify Me When In Stock</span>
              </button>
            )}
          </div>

          {/* Available Offers & Discounts Card */}
          <div className="bg-blush-light/80 border border-blush rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose" />
                <span className="font-serif font-bold text-xs uppercase tracking-wider text-burgundy">
                  Available Offers & Discounts
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOffersModalOpen(true)}
                className="text-xs font-bold text-rose hover:text-burgundy underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All (4)</span>
                <span>&rarr;</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* Offer 1: WELCOME10 */}
              <div className="p-2.5 rounded-xl bg-white border border-blush flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="px-2 py-0.5 rounded bg-blush-light text-burgundy font-mono font-bold text-[11px] border border-rose/30 flex-shrink-0">
                    WELCOME10
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-burgundy truncate">10% Off First Order</p>
                    <p className="text-[10px] text-burgundy/70">Min. spend ₹999 • Instant atelier discount</p>
                  </div>
                </div>
                {appliedCoupon?.code === "WELCOME10" ? (
                  <span className="text-[11px] font-bold text-olive flex items-center gap-0.5 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-olive" />
                    <span>Applied</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await applyCoupon("WELCOME10", product.sellingPrice * quantity);
                      if (res.success) {
                        showToast("Coupon WELCOME10 applied! 10% off ready for checkout.", "success");
                      } else {
                        showToast(res.message || "Could not apply coupon.", "info");
                      }
                    }}
                    className="px-2.5 py-1 rounded-pill bg-burgundy text-ivory-light text-[10px] font-serif font-bold hover:bg-rose transition-colors flex-shrink-0 cursor-pointer"
                  >
                    Apply
                  </button>
                )}
              </div>

              {/* Offer 2: FESTIVE20 */}
              <div className="p-2.5 rounded-xl bg-white border border-blush flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="px-2 py-0.5 rounded bg-blush-light text-burgundy font-mono font-bold text-[11px] border border-rose/30 flex-shrink-0">
                    FESTIVE20
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-burgundy truncate">Flat 20% Off Festive Edit</p>
                    <p className="text-[10px] text-burgundy/70">Min. spend ₹1,999 • Save up to ₹1,000</p>
                  </div>
                </div>
                {appliedCoupon?.code === "FESTIVE20" ? (
                  <span className="text-[11px] font-bold text-olive flex items-center gap-0.5 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-olive" />
                    <span>Applied</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await applyCoupon("FESTIVE20", product.sellingPrice * quantity);
                      if (res.success) {
                        showToast("Coupon FESTIVE20 applied! 20% off ready for checkout.", "success");
                      } else {
                        showToast(res.message || "Add items to reach ₹1,999 to unlock 20% off.", "info");
                      }
                    }}
                    className="px-2.5 py-1 rounded-pill bg-burgundy text-ivory-light text-[10px] font-serif font-bold hover:bg-rose transition-colors flex-shrink-0 cursor-pointer"
                  >
                    Apply
                  </button>
                )}
              </div>

              {/* Offer 3: Online Prepaid Benefit */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-burgundy/80">
                <Percent className="w-3.5 h-3.5 text-olive flex-shrink-0" />
                <span>
                  <strong className="text-burgundy">Prepaid Benefit: </strong>
                  Get flat 5% extra off automatically when paying via UPI or Card online.
                </span>
              </div>
            </div>
          </div>

          {/* Share Tools */}
          <div className="flex items-center justify-between py-2 border-t border-blush/60 text-xs text-burgundy/85">
            <span className="font-medium text-burgundy flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-rose" />
              <span>Share this style:</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-pill bg-olive/15 text-olive hover:bg-olive/25 font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-pill bg-blush-light hover:bg-blush/40 text-burgundy font-semibold transition-colors border border-blush/50"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>

          {/* Pincode Delivery Checker */}
          <div className="p-4 rounded-xl border border-blush bg-blush-light space-y-2">
            <div className="flex items-center space-x-2 text-xs font-serif font-bold text-burgundy">
              <MapPin className="w-4 h-4 text-rose" />
              <span>Check Delivery & COD Availability</span>
            </div>
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="h-10 px-4 rounded-pill border border-blush text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-rose focus:border-rose bg-white text-burgundy placeholder:text-burgundy/50"
              />
              <button
                type="submit"
                className="h-10 px-5 rounded-pill bg-rose text-ivory-light text-xs font-serif font-semibold hover:bg-burgundy transition-colors"
              >
                Check
              </button>
            </form>

            {pincodeStatus && (
              <div
                className={`flex items-start space-x-2 text-xs p-2.5 rounded-lg mt-2 ${
                  pincodeStatus.success
                    ? "bg-olive/10 text-olive border border-olive/30"
                    : "bg-rose/10 text-rose border border-rose/30"
                }`}
              >
                {pincodeStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{pincodeStatus.message}</span>
              </div>
            )}
          </div>

          {/* Trust Points */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-blush text-center text-xs text-burgundy/85">
            <div className="flex flex-col items-center">
              <Truck className="w-5 h-5 text-rose mb-1" />
              <span className="font-semibold text-burgundy">Free Delivery</span>
              <span className="text-[10px] text-burgundy/50">Orders ₹1,000+</span>
            </div>
            <div className="flex flex-col items-center">
              <RefreshCw className="w-5 h-5 text-rose mb-1" />
              <span className="font-semibold text-burgundy">7-Day Exchange</span>
              <span className="text-[10px] text-burgundy/50">Doorstep pickup</span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-rose mb-1" />
              <span className="font-semibold text-burgundy">100% Cotton</span>
              <span className="text-[10px] text-burgundy/50">Herbal Dyes</span>
            </div>
          </div>

          {/* Accordion Tabs */}
          <div className="space-y-2 pt-2">
            <div className="border border-blush rounded-xl overflow-hidden">
              <button
                onClick={() => toggleTab("fabric")}
                className="w-full p-3.5 text-left flex items-center justify-between text-xs font-serif font-bold text-burgundy hover:bg-blush-light"
              >
                <span>Fabric & Craft Details</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openTab === "fabric" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openTab === "fabric" && (
                <div className="p-4 text-xs text-muted space-y-2 border-t border-border/60 bg-sand/10 leading-relaxed font-sans">
                  <p>
                    <strong>Fabric:</strong> {product.fabric}
                  </p>
                  <p>
                    <strong>Technique:</strong> Authentic Rajasthani hand-block printing using carved teakwood blocks.
                  </p>
                  <p>
                    <strong>Fit:</strong> Tailored comfortable fit with generous ease for all-day breathability.
                  </p>
                  <p>
                    <strong>Origin:</strong> Handcrafted in Sanganer, Jaipur, India.
                  </p>
                </div>
              )}
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleTab("care")}
                className="w-full p-3.5 text-left flex items-center justify-between text-xs font-serif font-bold text-dark hover:bg-sand/20"
              >
                <span>Wash & Maintenance Care</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openTab === "care" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openTab === "care" && (
                <div className="p-4 text-xs text-muted space-y-1.5 border-t border-border/60 bg-sand/10 leading-relaxed font-sans">
                  <p>• Hand wash separately in cold water for initial washes.</p>
                  <p>• Use mild liquid detergent; do not soak or bleach.</p>
                  <p>• Dry inside out in shade to preserve vibrant herbal pigments.</p>
                  <p>• Warm iron on reverse side.</p>
                </div>
              )}
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleTab("shipping")}
                className="w-full p-3.5 text-left flex items-center justify-between text-xs font-serif font-bold text-dark hover:bg-sand/20"
              >
                <span>Shipping, COD & Exchanges</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openTab === "shipping" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openTab === "shipping" && (
                <div className="p-4 text-xs text-muted space-y-2 border-t border-border/60 bg-sand/10 leading-relaxed font-sans">
                  <p>
                    Orders dispatched within 24-48 business hours via express air courier. Doorstep tracking link provided via SMS and Email.
                  </p>
                  <p>
                    Easy 7-day exchange for sizing or fit adjustments. Reverse pickup arranged from your doorstep.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <ProductReviews
        productId={product.id || product._id || product.slug}
        productName={product.name}
      />

      {/* Recently Viewed Products Section */}
      {recentlyViewed.length > 0 && (
        <div className="mt-16 pt-12 border-t border-border">
          <div className="mb-6">
            <span className="text-xs font-sans uppercase tracking-widest text-primary font-bold block mb-1">
              Based on your browsing
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-dark">
              Recently Viewed
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {recentlyViewed.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}

      {/* Sizing Modal */}
      <SizeChartModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
      />

      {/* Back In Stock Notification Modal */}
      {isNotifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsNotifyModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-dark p-1 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-sand/40 text-primary flex items-center justify-center mx-auto mb-2">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-dark">
                Notify When Available
              </h3>
              <p className="text-xs text-muted mt-1">
                Enter your email or phone number. We&apos;ll notify you the moment {product.name} is restocked.
              </p>
            </div>

            {notifySubmitted ? (
              <div className="p-4 bg-badge-new/10 text-badge-new border border-badge-new/20 rounded-xl text-center text-xs font-medium">
                ✨ Thank you! We have registered your request.
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-pill border border-border text-xs focus:outline-none focus:border-dark"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-dark hover:bg-black text-white text-xs font-serif font-bold rounded-pill shadow-md transition-all active:scale-95"
                >
                  Send Me Restock Alert
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Available Offers & Discounts Modal */}
      <AvailableOffersModal
        isOpen={isOffersModalOpen}
        onClose={() => setIsOffersModalOpen(false)}
        currentSubtotal={product.sellingPrice * quantity}
      />
    </>
  );
}
