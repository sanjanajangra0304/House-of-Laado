import { connectDB, disconnectDB } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { User } from "../src/models/User.js";
import { Category } from "../src/models/Category.js";
import { Product } from "../src/models/Product.js";
import { Coupon } from "../src/models/Coupon.js";
import { Banner } from "../src/models/Banner.js";
import { HomepageSection } from "../src/models/HomepageSection.js";
import { Setting } from "../src/models/Setting.js";
import { Page } from "../src/models/Page.js";
import { BlogPost } from "../src/models/BlogPost.js";

const categoriesData = [
  {
    name: "Suit Sets",
    slug: "suit-sets",
    description: "Handcrafted 3-piece pure cotton and silk suit sets with dupattas.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    isFeatured: true,
    displayOrder: 1,
  },
  {
    name: "Kurtas",
    slug: "kurtas",
    description: "Artisan Jaipur hand-block printed everyday & occasion kurtas.",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    isFeatured: true,
    displayOrder: 2,
  },
  {
    name: "Festive Edit",
    slug: "festive-edit",
    description: "Opulent Chanderi silks, zari booti work, and regal anarkalis.",
    image: "https://images.unsplash.com/photo-1589810635657-23295960413a?auto=format&fit=crop&w=800&q=80",
    isFeatured: true,
    displayOrder: 3,
  },
  {
    name: "Dresses",
    slug: "dresses",
    description: "Breezy tiered ethnic maxi dresses, fusion gowns, and tunics.",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    isFeatured: false,
    displayOrder: 4,
  },
  {
    name: "Co-ord Sets",
    slug: "coord-sets",
    description: "Contemporary relaxed silhouette 2-piece printed matching sets.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    isFeatured: false,
    displayOrder: 5,
  },
  {
    name: "Bags & Accessories",
    slug: "bags",
    description: "Double-quilted artisan totes, potlis, and handcrafted bags.",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    isFeatured: false,
    displayOrder: 6,
  },
  {
    name: "Menswear",
    slug: "menswear",
    description: "Comfortable breathable hand-block khadi cotton short kurtas for men.",
    image: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80",
    isFeatured: false,
    displayOrder: 7,
  },
];

// 42 Authentic Indian Ethnic Wear Products (6 per category)
const productsData = [
  // ---------------- SUIT SETS (6 items) ----------------
  {
    name: "Gulabi Anarkali Pure Cotton 3-Piece Suit Set",
    slug: "gulabi-anarkali-pure-cotton-suit-set",
    categorySlug: "suit-sets",
    fabric: "100% Jaipur Mulmul Cotton",
    sellingPrice: 1899,
    compareAtPrice: 3499,
    discountPercent: 45,
    primaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 84,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Burgundy Wine", hex: "#5f0d24" },
      { name: "Powder Pink", hex: "#e8a598" },
      { name: "Off White", hex: "#f9f8f6" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 25,
    description: "Handcrafted in breathable Jaipur mulmul cotton featuring delicate hand-block floral motifs, paired with tailored cigarette pants and a featherlight kota doria dupatta.",
  },
  {
    name: "Aarohi Maheshwari Handloom Silk Suit Set",
    slug: "aarohi-maheshwari-handloom-silk-suit-set",
    categorySlug: "suit-sets",
    fabric: "Maheshwari Silk Cotton Blend",
    sellingPrice: 2499,
    compareAtPrice: 4299,
    discountPercent: 41,
    primaryImage: "https://images.unsplash.com/photo-1589810635657-23295960413a?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 42,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Teal Green", hex: "#164e63" },
      { name: "Maroon", hex: "#7f1d1d" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    stock: 18,
    description: "Traditional Maheshwari weave featuring subtle zari borders on the hemline, matched with straight trousers and a gossamer silk blend dupatta.",
  },
  {
    name: "Noor Floral Cotton Sharara Suit Set",
    slug: "noor-floral-cotton-sharara-suit-set",
    categorySlug: "suit-sets",
    fabric: "100% Cambric Cotton",
    sellingPrice: 1999,
    compareAtPrice: 3299,
    discountPercent: 39,
    primaryImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviewsCount: 36,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Sage Olive", hex: "#7a8b6e" },
      { name: "Mustard Ochre", hex: "#d89e2e" },
    ],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: false,
    stock: 20,
    description: "Flared two-tier sharara paired with a waist-length peplum silhouette kurta and a printed mulmul dupatta. Accented with subtle gota patti piping.",
  },
  {
    name: "Roshni Indigo Dabu Print Straight Suit Set",
    slug: "roshni-indigo-dabu-print-straight-suit-set",
    categorySlug: "suit-sets",
    fabric: "Natural Dyed Dabu Cotton",
    sellingPrice: 1799,
    compareAtPrice: 2899,
    discountPercent: 38,
    primaryImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 57,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Indigo Blue", hex: "#1c3f60" },
      { name: "Ivory Sand", hex: "#f2e4d8" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    stock: 30,
    description: "Handcrafted using traditional mud-resist Dabu printing techniques from Bagru, paired with solid indigo culottes and a sheer dabu-motif dupatta.",
  },
  {
    name: "Chandni Embroidered Velvet Neck Suit Set",
    slug: "chandni-embroidered-velvet-neck-suit-set",
    categorySlug: "suit-sets",
    fabric: "Slub Cotton Silk with Velvet Yoke",
    sellingPrice: 2299,
    compareAtPrice: 3999,
    discountPercent: 42,
    primaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1589810635657-23295960413a?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 29,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Deep Plum", hex: "#4a044e" },
      { name: "Burgundy Wine", hex: "#5f0d24" },
    ],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: false,
    stock: 15,
    description: "An elegant evening silhouette featuring delicate zardozi embroidery over a rich micro-velvet neck patch, styled with tapered pants.",
  },
  {
    name: "Parijat Angrakha Flared Anarkali Suit Set",
    slug: "parijat-angrakha-flared-anarkali-suit-set",
    categorySlug: "suit-sets",
    fabric: "Pure Jaipur Mulmul Cotton",
    sellingPrice: 2199,
    compareAtPrice: 3799,
    discountPercent: 42,
    primaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 68,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Dusty Peach", hex: "#fbcfe8" },
      { name: "Mint Foam", hex: "#ccfbf1" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    stock: 22,
    description: "Regal cross-over angrakha pattern with handmade latkan tassels, full ghera flared kalis, and a matching hand-blocked kota doria chunni.",
  },

  // ---------------- KURTAS (6 items) ----------------
  {
    name: "Neelambari Hand-Block Print A-Line Kurta",
    slug: "neelambari-hand-block-print-a-line-kurta",
    categorySlug: "kurtas",
    fabric: "100% Breathable Cambric Cotton",
    sellingPrice: 899,
    compareAtPrice: 1499,
    discountPercent: 40,
    primaryImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 52,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Indigo Blue", hex: "#1c3f60" },
      { name: "Rust Terracotta", hex: "#d0473e" },
    ],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    stock: 35,
    description: "Deep indigo natural dye A-line silhouette with three-quarter sleeves and wooden button detailing along the placket. Perfect for elevated everyday wear.",
  },
  {
    name: "Kashmiri Embroidered Straight Cotton Kurta",
    slug: "kashmiri-embroidered-straight-cotton-kurta",
    categorySlug: "kurtas",
    fabric: "Slub Cotton with Ari Embroidery",
    sellingPrice: 999,
    compareAtPrice: 1799,
    discountPercent: 44,
    primaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviewsCount: 31,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Wine Red", hex: "#5f0d24" },
      { name: "Olive Moss", hex: "#4b5320" },
    ],
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    stock: 20,
    description: "Classic straight-hem kurta with fine Ari needlework around the mandarin collar and cuffs. High side slits for relaxed movement.",
  },
  {
    name: "Sanganeri Floral Buta Daily Wear Kurta",
    slug: "sanganeri-floral-buta-daily-wear-kurta",
    categorySlug: "kurtas",
    fabric: "100% Pure Mulmul Cotton",
    sellingPrice: 799,
    compareAtPrice: 1399,
    discountPercent: 42,
    primaryImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 73,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Mustard Ochre", hex: "#d89e2e" },
      { name: "Sand Almond", hex: "#f2e4d8" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 40,
    description: "Featherlight everyday Jaipur kurta stamped with heritage floral butas using wooden hand-carved blocks. Features neat round neck with V-slit.",
  },
  {
    name: "Meera Short Peplum Tunic Kurta",
    slug: "meera-short-peplum-tunic-kurta",
    categorySlug: "kurtas",
    fabric: "Cotton Linen Blend",
    sellingPrice: 849,
    compareAtPrice: 1499,
    discountPercent: 43,
    primaryImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 45,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Coral Rose", hex: "#fb7185" },
      { name: "Sky Mist", hex: "#bae6fd" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: false,
    stock: 28,
    description: "Fusion peplum waist cut short kurta that pairs effortlessly with denim jeans, culottes, or cigarette pants. Finished with elasticated cuff sleeves.",
  },
  {
    name: "Kalamkari Printed Straight Slit Kurta",
    slug: "kalamkari-printed-straight-slit-kurta",
    categorySlug: "kurtas",
    fabric: "Breathable Organic Cotton",
    sellingPrice: 949,
    compareAtPrice: 1699,
    discountPercent: 44,
    primaryImage: "https://images.unsplash.com/photo-1589810635657-23295960413a?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviewsCount: 38,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Terracotta Earth", hex: "#9a3412" },
      { name: "Charcoal Black", hex: "#1f2937" },
    ],
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    stock: 24,
    description: "Detailed mythological and floral Kalamkari prints across a tailored straight silhouette. Accented with wooden buttons on the front placket.",
  },
  {
    name: "Zari Highlights Chanderi Festive Kurta",
    slug: "zari-highlights-chanderi-festive-kurta",
    categorySlug: "kurtas",
    fabric: "Chanderi Cotton Silk with Lining",
    sellingPrice: 1199,
    compareAtPrice: 2199,
    discountPercent: 45,
    primaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1589810635657-23295960413a?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 64,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Burgundy Wine", hex: "#5f0d24" },
      { name: "Emerald Forest", hex: "#14854e" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 20,
    description: "Festive occasion kurta adorned with metallic zari highlights along the neck and cuff hems. Designed with pure cotton inner lining for comfort.",
  },

  // ---------------- FESTIVE EDIT (6 items) ----------------
  {
    name: "Zari Buti Emerald Chanderi 3-Piece Festive Set",
    slug: "zari-buti-emerald-chanderi-festive-set",
    categorySlug: "festive-edit",
    fabric: "Chanderi Silk with Cotton Lining",
    sellingPrice: 2799,
    compareAtPrice: 4999,
    discountPercent: 44,
    primaryImage: "https://images.unsplash.com/photo-1589810635657-23295960413a?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    rating: 5.0,
    reviewsCount: 39,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Emerald Forest", hex: "#14854e" },
      { name: "Royal Wine", hex: "#5f0d24" },
      { name: "Peacock Blue", hex: "#07272e" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    stock: 18,
    description: "Opulent Chanderi silk straight kurta woven with golden zari booti motifs, paired with silk trousers and an embellished organza dupatta with scalloped borders.",
  },
  {
    name: "Maharani Zardozi Embellished Anarkali Gown",
    slug: "maharani-zardozi-embellished-anarkali-gown",
    categorySlug: "festive-edit",
    fabric: "Pure Raw Silk with Shantoon Lining",
    sellingPrice: 3499,
    compareAtPrice: 5999,
    discountPercent: 41,
    primaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1589810635657-23295960413a?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 28,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Royal Wine", hex: "#5f0d24" },
      { name: "Deep Navy", hex: "#0f172a" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 12,
    description: "Floor-sweeping 32-kali flare crafted in raw silk with intricate antique zardozi, sequin, and dori needlework on the yoke. Includes net dupatta with lace trim.",
  },
  {
    name: "Shahi Brocade Banarasi Silk Trouser Set",
    slug: "shahi-brocade-banarasi-silk-trouser-set",
    categorySlug: "festive-edit",
    fabric: "Banarasi Art Silk Brocade",
    sellingPrice: 2999,
    compareAtPrice: 5299,
    discountPercent: 43,
    primaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1589810635657-23295960413a?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 35,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Mustard Gold", hex: "#eab308" },
      { name: "Crimson Maroon", hex: "#881337" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    stock: 16,
    description: "Lustrous Banarasi brocade weave kurta with round sweetheart neck, paired with ankle-length silk blend straight trousers and rich tissue dupatta.",
  },
  {
    name: "Sitara Gota Patti Georgette Kalidar Kurta Set",
    slug: "sitara-gota-patti-georgette-kalidar-kurta-set",
    categorySlug: "festive-edit",
    fabric: "Flowy Viscose Georgette with Crepe Lining",
    sellingPrice: 2699,
    compareAtPrice: 4799,
    discountPercent: 43,
    primaryImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 41,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Rani Pink", hex: "#fd4c8b" },
      { name: "Ivory Gold", hex: "#fef08a" },
    ],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    stock: 14,
    description: "Luminous Jaipur gota patti leaf and flower work around the neckline and hemlines. Lightweight georgette drape with voluminous gathers.",
  },
  {
    name: "Nazneen Organza Mirror Work Festive Set",
    slug: "nazneen-organza-mirror-work-festive-set",
    categorySlug: "festive-edit",
    fabric: "Tissue Organza with Satin Slip",
    sellingPrice: 3199,
    compareAtPrice: 5499,
    discountPercent: 41,
    primaryImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1589810635657-23295960413a?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 22,
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Powder Lavender", hex: "#e9d5ff" },
      { name: "Blush Rose", hex: "#fecdd3" },
    ],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: false,
    stock: 10,
    description: "Delicate sheer organza kurta lined with butter satin, enriched with real foil mirror needlework and scalloped border organza wrap.",
  },
  {
    name: "Jodha Embroidered Angrakha Velvet Festive Set",
    slug: "jodha-embroidered-angrakha-velvet-festive-set",
    categorySlug: "festive-edit",
    fabric: "Micro Velvet 9000 with Silk Trousers",
    sellingPrice: 3899,
    compareAtPrice: 6999,
    discountPercent: 44,
    primaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    rating: 5.0,
    reviewsCount: 19,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Burgundy Wine", hex: "#5f0d24" },
      { name: "Bottle Green", hex: "#064e3b" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    stock: 8,
    description: "Royal winter festive edit in plush micro velvet, featuring antique marodi and tilla embroidery with silk pants and a heavy jacquard woven shawl.",
  },

  // ---------------- DRESSES (6 items) ----------------
  {
    name: "Sanganeri Floral Tiered Maxi Dress",
    slug: "sanganeri-floral-tiered-maxi-dress",
    categorySlug: "dresses",
    fabric: "Pure Cotton Mulmul",
    sellingPrice: 1499,
    compareAtPrice: 2299,
    discountPercent: 35,
    primaryImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviewsCount: 46,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Terracotta Red", hex: "#d0473e" },
      { name: "Mustard Ochre", hex: "#d89e2e" },
      { name: "Sage Olive", hex: "#7a8b6e" },
    ],
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    stock: 22,
    description: "A breezy three-tiered ethnic maxi dress crafted with traditional Sanganeri hand-blocks. Features flutter sleeves, tie-up tassels, and a tiered flared hemline.",
  },
  {
    name: "Bagru Indigo Hand-Block Tiered Sundress",
    slug: "bagru-indigo-hand-block-tiered-sundress",
    categorySlug: "dresses",
    fabric: "100% Bagru Dabu Organic Cotton",
    sellingPrice: 1399,
    compareAtPrice: 2199,
    discountPercent: 36,
    primaryImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 39,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Indigo Blue", hex: "#1c3f60" },
      { name: "Natural Ecru", hex: "#f5f5f4" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 25,
    description: "Sleeveless square-neck summer sundress with smocked back bodice for flexible fit and side pockets for everyday functionality.",
  },
  {
    name: "Rani Pink Flared Ethnic Midi Dress",
    slug: "rani-pink-flared-ethnic-midi-dress",
    categorySlug: "dresses",
    fabric: "100% Jaipur Cambric Cotton",
    sellingPrice: 1299,
    compareAtPrice: 1999,
    discountPercent: 35,
    primaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 51,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Rani Pink", hex: "#fd4c8b" },
      { name: "Burgundy Wine", hex: "#5f0d24" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: false,
    stock: 30,
    description: "Vibrant ethnic midi dress with mandarin collar and shell-button front placket. Styled with an adjustable matching fabric waist belt.",
  },
  {
    name: "Champa Floral Smocked Empire Dress",
    slug: "champa-floral-smocked-empire-dress",
    categorySlug: "dresses",
    fabric: "Featherlight Cotton Voile",
    sellingPrice: 1599,
    compareAtPrice: 2499,
    discountPercent: 36,
    primaryImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 34,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Sand Beige", hex: "#f2e4d8" },
      { name: "Olive Green", hex: "#166534" },
    ],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    stock: 18,
    description: "Feminine empire cut dress with a delicate smocked bust and bishop sleeves. Stamped with delicate champa blossom hand-block motifs.",
  },
  {
    name: "Kashmiri Embroidered Fusion Tunic Dress",
    slug: "kashmiri-embroidered-fusion-tunic-dress",
    categorySlug: "dresses",
    fabric: "Soft Rayon Cotton Slub",
    sellingPrice: 1199,
    compareAtPrice: 1899,
    discountPercent: 37,
    primaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    reviewsCount: 27,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Teal Green", hex: "#115e59" },
      { name: "Burgundy Wine", hex: "#5f0d24" },
    ],
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    stock: 20,
    description: "Versatile knee-length tunic dress with intricate Kashmiri chain-stitch needlework framing the neckline and sleeve cuffs.",
  },
  {
    name: "Marigold Hand-Block Wrap Maxi Dress",
    slug: "marigold-hand-block-wrap-maxi-dress",
    categorySlug: "dresses",
    fabric: "100% Pure Mulmul Cotton",
    sellingPrice: 1699,
    compareAtPrice: 2699,
    discountPercent: 37,
    primaryImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 63,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Marigold Yellow", hex: "#f59e0b" },
      { name: "Off White", hex: "#f9f8f6" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 22,
    description: "Flattering true wrap silhouette featuring marigold botanical woodblock prints, tie closure at the waist, and a ruffled asymmetrical hem.",
  },

  // ---------------- CO-ORD SETS (6 items) ----------------
  {
    name: "Jaipuri Block Print Casual Co-ord Lounge Set",
    slug: "jaipuri-block-print-casual-coord-lounge-set",
    categorySlug: "coord-sets",
    fabric: "100% Breathable Cotton Poplin",
    sellingPrice: 1299,
    compareAtPrice: 2199,
    discountPercent: 41,
    primaryImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 61,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Sand Almond", hex: "#f2e4d8" },
      { name: "Midnight Charcoal", hex: "#222222" },
      { name: "Clay Brick", hex: "#b45341" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 30,
    description: "Relaxed silhouette notch-collar shirt paired with high-waisted wide-leg trousers. Designed for all-day work-from-home comfort and casual weekend brunches.",
  },
  {
    name: "Boho Resort Kimono & Shorts Co-ord Set",
    slug: "boho-resort-kimono-shorts-coord-set",
    categorySlug: "coord-sets",
    fabric: "Lightweight Cotton Rayon Blend",
    sellingPrice: 1199,
    compareAtPrice: 1999,
    discountPercent: 40,
    primaryImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviewsCount: 38,
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Sage Olive", hex: "#7a8b6e" },
      { name: "Terracotta Red", hex: "#d0473e" },
    ],
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    stock: 22,
    description: "Vacation-ready open-front kimono jacket paired with elasticated waist shorts featuring deep pockets. Crafted in breathable geometric print fabric.",
  },
  {
    name: "Dabu Indigo Shirt & Culottes Co-ord Set",
    slug: "dabu-indigo-shirt-culottes-coord-set",
    categorySlug: "coord-sets",
    fabric: "100% Dabu Hand-Block Cotton",
    sellingPrice: 1499,
    compareAtPrice: 2499,
    discountPercent: 40,
    primaryImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 54,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Indigo Blue", hex: "#1c3f60" },
      { name: "Ecru White", hex: "#f5f5f4" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 28,
    description: "Artisanal hand-printed button-down shirt paired with cropped wide-leg culottes. Natural indigo mud-resist print ensures each set has distinct charm.",
  },
  {
    name: "Gulmohar Floral Peplum & Flared Pants Set",
    slug: "gulmohar-floral-peplum-flared-pants-set",
    categorySlug: "coord-sets",
    fabric: "100% Breathable Cambric Cotton",
    sellingPrice: 1399,
    compareAtPrice: 2299,
    discountPercent: 39,
    primaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 47,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Coral Peach", hex: "#fb923c" },
      { name: "Burgundy Wine", hex: "#5f0d24" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: false,
    stock: 20,
    description: "Sweetheart neckline peplum top with back tie-ups matched with high-rise flared trousers. Adorned with vibrant Gulmohar botanical prints.",
  },
  {
    name: "Ikat Woven Collar Top & Trousers Set",
    slug: "ikat-woven-collar-top-trousers-set",
    categorySlug: "coord-sets",
    fabric: "Handloom Cotton Ikat",
    sellingPrice: 1599,
    compareAtPrice: 2699,
    discountPercent: 41,
    primaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviewsCount: 29,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Charcoal Grey", hex: "#374151" },
      { name: "Mustard Gold", hex: "#eab308" },
    ],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: false,
    stock: 18,
    description: "Structured collared top paired with tapered pleated trousers. Woven on traditional handlooms with geometric double-ikat patterning.",
  },
  {
    name: "Zari Edge Chanderi Silk Festive Co-ord Set",
    slug: "zari-edge-chanderi-silk-festive-coord-set",
    categorySlug: "coord-sets",
    fabric: "Chanderi Silk with Shantoon Lining",
    sellingPrice: 1899,
    compareAtPrice: 3199,
    discountPercent: 41,
    primaryImage: "https://images.unsplash.com/photo-1589810635657-23295960413a?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 36,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Emerald Forest", hex: "#14854e" },
      { name: "Burgundy Wine", hex: "#5f0d24" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    stock: 15,
    description: "Festive Indo-western crop top and palazzo trousers duo trimmed with delicate antique zari piping. The ultimate cocktail and sangeet statement.",
  },

  // ---------------- BAGS & ACCESSORIES (6 items) ----------------
  {
    name: "Heritage Quilted Cotton Travel Tote Bag",
    slug: "heritage-quilted-cotton-travel-tote-bag",
    categorySlug: "bags",
    fabric: "Heavy Canvas Cotton with Hand Quilting",
    sellingPrice: 799,
    compareAtPrice: 1299,
    discountPercent: 38,
    primaryImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 78,
    sizes: ["Free Size"],
    colors: [
      { name: "Burgundy Floral", hex: "#5f0d24" },
      { name: "Indigo Motif", hex: "#1c3f60" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    stock: 40,
    description: "Spacious multi-utility tote handcrafted with double-quilted cotton layers. Features sturdy vegan-leather shoulder straps, zip closure, and interior laptop partition.",
  },
  {
    name: "Sanganeri Floral Quilted Duffle Bag",
    slug: "sanganeri-floral-quilted-duffle-bag",
    categorySlug: "bags",
    fabric: "Thick Handloom Quilted Canvas",
    sellingPrice: 1299,
    compareAtPrice: 1999,
    discountPercent: 35,
    primaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 44,
    sizes: ["Free Size"],
    colors: [
      { name: "Mustard Ochre", hex: "#d89e2e" },
      { name: "Burgundy Wine", hex: "#5f0d24" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 25,
    description: "Weekend getaway cylindrical duffle bag with padded handles and adjustable cross-body strap. Reinforced water-resistant lining and antique brass zippers.",
  },
  {
    name: "Royal Zardozi Festive Embroidered Potli Bag",
    slug: "royal-zardozi-festive-embroidered-potli-bag",
    categorySlug: "bags",
    fabric: "Plush Velvet with Golden Zari Tassels",
    sellingPrice: 699,
    compareAtPrice: 1199,
    discountPercent: 42,
    primaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 52,
    sizes: ["Free Size"],
    colors: [
      { name: "Burgundy Wine", hex: "#5f0d24" },
      { name: "Emerald Green", hex: "#14854e" },
      { name: "Golden Mustard", hex: "#eab308" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: false,
    stock: 35,
    description: "Drawstring potli with heavy seed pearl and zardozi needlework. Adorned with handcrafted bell tassels and braided wristlet strap.",
  },
  {
    name: "Bagru Indigo Quilted Laptop Sleeve 15-inch",
    slug: "bagru-indigo-quilted-laptop-sleeve",
    categorySlug: "bags",
    fabric: "Quilted Cotton with Foam Cushioning",
    sellingPrice: 599,
    compareAtPrice: 999,
    discountPercent: 40,
    primaryImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviewsCount: 33,
    sizes: ["Free Size"],
    colors: [
      { name: "Indigo Blue", hex: "#1c3f60" },
      { name: "Sand Almond", hex: "#f2e4d8" },
    ],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: false,
    stock: 30,
    description: "Protective padded sleeve designed to safeguard 13 to 15.6 inch laptops. Features soft fleece inner lining and smooth dual zipper closure.",
  },
  {
    name: "Jaipur Floral Quilted Cosmetic Vanity Pouch",
    slug: "jaipur-floral-quilted-cosmetic-vanity-pouch",
    categorySlug: "bags",
    fabric: "Waterproof-Lined Cotton Canvas",
    sellingPrice: 449,
    compareAtPrice: 799,
    discountPercent: 44,
    primaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 67,
    sizes: ["Free Size"],
    colors: [
      { name: "Powder Pink", hex: "#e8a598" },
      { name: "Sage Olive", hex: "#7a8b6e" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: false,
    stock: 50,
    description: "Compact boxy vanity pouch with side handle. Waterproof wipe-clean interior lining keeps makeup and toiletries neatly organized.",
  },
  {
    name: "Gota Border Embroidered Raw Silk Clutch",
    slug: "gota-border-embroidered-raw-silk-clutch",
    categorySlug: "bags",
    fabric: "Raw Silk with Magnetic Clasp",
    sellingPrice: 899,
    compareAtPrice: 1499,
    discountPercent: 40,
    primaryImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 26,
    sizes: ["Free Size"],
    colors: [
      { name: "Burgundy Wine", hex: "#5f0d24" },
      { name: "Champagne Gold", hex: "#fde047" },
    ],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    stock: 20,
    description: "Sleek envelope clutch detailed with fine gota patti ribbon borders and a detachable golden chain sling for versatile cross-body wear.",
  },

  // ---------------- MENSWEAR (6 items) ----------------
  {
    name: "Classic Men's Hand-Block Cotton Short Kurta",
    slug: "classic-mens-hand-block-cotton-short-kurta",
    categorySlug: "menswear",
    fabric: "100% Khadi Cotton",
    sellingPrice: 849,
    compareAtPrice: 1399,
    discountPercent: 39,
    primaryImage: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 29,
    sizes: ["M", "L", "XL", "XXL"],
    colors: [
      { name: "Indigo Blue", hex: "#1c3f60" },
      { name: "Earth Sand", hex: "#f2e4d8" },
      { name: "Black Charcoal", hex: "#111111" },
    ],
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: true,
    stock: 25,
    description: "Breezy hand-block printed short kurta tailored for Indian summers. Mandarin collar, side welt pockets, and rolled-up sleeve tabs.",
  },
  {
    name: "Men's Lucknowi Chikan Embroidered Kurta",
    slug: "mens-lucknowi-chikan-embroidered-kurta",
    categorySlug: "menswear",
    fabric: "Pure Cotton Mulmul",
    sellingPrice: 1199,
    compareAtPrice: 1999,
    discountPercent: 40,
    primaryImage: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 41,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Ivory White", hex: "#f9fafb" },
      { name: "Powder Blue", hex: "#bae6fd" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 22,
    description: "Timeless Chikankari tone-on-tone embroidery across the chest and collar. Ultra-breathable mulmul cotton guarantees all-day comfort.",
  },
  {
    name: "Men's Sanganeri Printed Long Kurta",
    slug: "mens-sanganeri-printed-long-kurta",
    categorySlug: "menswear",
    fabric: "100% Breathable Cambric Cotton",
    sellingPrice: 999,
    compareAtPrice: 1699,
    discountPercent: 41,
    primaryImage: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviewsCount: 33,
    sizes: ["M", "L", "XL", "XXL"],
    colors: [
      { name: "Mustard Ochre", hex: "#d89e2e" },
      { name: "Burgundy Wine", hex: "#5f0d24" },
    ],
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    stock: 28,
    description: "Knee-length traditional straight kurta with wooden button placket and side pockets. Features delicate Sanganeri floral vines.",
  },
  {
    name: "Men's Nehru Jacket in Textured Silk Blend",
    slug: "mens-nehru-jacket-textured-silk-blend",
    categorySlug: "menswear",
    fabric: "Raw Silk Blend with Satin Lining",
    sellingPrice: 1499,
    compareAtPrice: 2499,
    discountPercent: 40,
    primaryImage: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 48,
    sizes: ["38", "40", "42", "44"],
    colors: [
      { name: "Burgundy Wine", hex: "#5f0d24" },
      { name: "Emerald Forest", hex: "#14854e" },
    ],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 18,
    description: "Tailored sleeveless bandhgala waistcoat jacket with metal crest buttons and chest pocket. Perfect layered over solid kurtas for weddings and pujas.",
  },
  {
    name: "Men's Bagru Dabu Mud-Resist Short Kurta",
    slug: "mens-bagru-dabu-short-kurta",
    categorySlug: "menswear",
    fabric: "100% Bagru Dabu Cotton",
    sellingPrice: 899,
    compareAtPrice: 1499,
    discountPercent: 40,
    primaryImage: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 24,
    sizes: ["M", "L", "XL", "XXL"],
    colors: [
      { name: "Indigo Blue", hex: "#1c3f60" },
      { name: "Charcoal Grey", hex: "#374151" },
    ],
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    stock: 20,
    description: "Casual everyday short kurta featuring geometric bootis stamped by Bagru artisans using organic mud-resist dye methods.",
  },
  {
    name: "Men's Festive Silk Blend Pathani Kurta Set",
    slug: "mens-festive-silk-blend-pathani-kurta-set",
    categorySlug: "menswear",
    fabric: "Dupion Silk Blend",
    sellingPrice: 1899,
    compareAtPrice: 3299,
    discountPercent: 42,
    primaryImage: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviewsCount: 37,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Deep Navy", hex: "#0f172a" },
      { name: "Burgundy Wine", hex: "#5f0d24" },
    ],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    stock: 16,
    description: "Two-piece Pathani kurta with flap chest pockets, shoulder epaulets, and loose-fitting matching salwar pants.",
  },
];

const couponsData = [
  {
    code: "WELCOME10",
    description: "10% off on your first order",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 999,
    maxDiscountAmount: 500,
    isActive: true,
  },
  {
    code: "FESTIVE20",
    description: "Flat 20% off on Festive Collection",
    discountType: "percentage",
    discountValue: 20,
    minOrderValue: 1999,
    maxDiscountAmount: 1000,
    isActive: true,
  },
  {
    code: "JAIPUR15",
    description: "Special 15% off Jaipur artisan edit",
    discountType: "percentage",
    discountValue: 15,
    minOrderValue: 1499,
    maxDiscountAmount: 600,
    isActive: true,
  },
  {
    code: "FREESHIP",
    description: "Free express shipping across India",
    discountType: "flat",
    discountValue: 99,
    minOrderValue: 799,
    maxDiscountAmount: 99,
    isActive: true,
  },
];

const bannersData = [
  {
    title: "The Royal Festive Edit 2026",
    subtitle: "Hand-loomed Chanderi Silk & Zari Booti with Pure Organza Dupattas",
    desktopImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85",
    mobileImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    link: "/collections/festive-edit",
    ctaText: "Explore Festive Edit",
    displayOrder: 1,
    isActive: true,
  },
  {
    title: "Jaipur Loom Cotton Symphony",
    subtitle: "Authentic Sanganeri & Bagru Hand-Block Printed Everyday & Occasion Wear",
    desktopImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=85",
    mobileImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    link: "/collections/suit-sets",
    ctaText: "Shop Suit Sets",
    displayOrder: 2,
    isActive: true,
  },
  {
    title: "Artisan Quilted Bag Edit",
    subtitle: "Double-Quilted Heritage Totes, Potlis & Travel Duffles",
    desktopImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=85",
    mobileImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    link: "/collections/bags",
    ctaText: "Shop Quilted Bags",
    displayOrder: 3,
    isActive: true,
  },
];

const homepageSectionsData = [
  {
    key: "hero_carousel",
    title: "Hero Banner Carousel",
    subtitle: "High impact visual storytelling slides",
    isEnabled: true,
    displayOrder: 1,
  },
  {
    key: "featured_categories",
    title: "Curated Collections",
    subtitle: "Handcrafted categories designed for effortless discovery",
    isEnabled: true,
    displayOrder: 2,
  },
  {
    key: "trending_now",
    title: "Trending & New Arrivals",
    subtitle: "The freshest silhouettes straight from our Jaipur atelier",
    isEnabled: true,
    displayOrder: 3,
  },
  {
    key: "festive_spotlight",
    title: "Festive Spotlight",
    subtitle: "Chanderi silks, zari booti work, and regal anarkalis",
    isEnabled: true,
    displayOrder: 4,
  },
  {
    key: "trust_pillars",
    title: "Why House of Laado",
    subtitle: "100% Authentic Hand-Block • Ethically Sourced • Fast Pan-India Shipping",
    isEnabled: true,
    displayOrder: 5,
  },
];

const settingsData = [
  {
    key: "store_profile",
    isPublic: true,
    description: "Store branding and contact information",
    value: {
      storeName: "House of Laado",
      tagline: "Inspired by Mom. Crafted for Every Woman.",
      email: "support@houseoflaado.com",
      phone: "+91 98765 43210",
      whatsappNumber: "919876543210",
      address: "108, Heritage Crafts Lane, C-Scheme, Jaipur, Rajasthan 302001, India",
      currency: "INR",
      currencySymbol: "₹",
    },
  },
  {
    key: "shipping_rules",
    isPublic: true,
    description: "Shipping fee calculations and thresholds",
    value: {
      freeShippingThreshold: 999,
      standardShippingFee: 99,
      codFee: 50,
      estimatedDeliveryDaysMin: 3,
      estimatedDeliveryDaysMax: 6,
    },
  },
  {
    key: "tax_rules",
    isPublic: false,
    description: "Indian GST and invoicing configuration",
    value: {
      gstin: "08AAAAA0000A1Z5",
      apparelGstUnder1000: 5,
      apparelGstOver1000: 12,
      pricesIncludeGst: true,
    },
  },
  {
    key: "social_links",
    isPublic: true,
    description: "Official brand social media channels",
    value: {
      instagram: "https://www.instagram.com/house.of.laado/",
      whatsapp: "https://wa.me/919876543210",
    },
  },
  {
    key: "storefront_config",
    isPublic: true,
    description: "Storefront operational policies and configuration",
    value: {
      brandName: "House of Laado",
      tagline: "Inspired by Mom. Crafted for Every Woman.",
      freeShippingThreshold: 999,
      returnWindowDays: 7,
      codAvailable: true,
      codMaxThreshold: 5000,
    },
  },
];

const pagesData = [
  {
    slug: "about-us",
    title: "About House of Laado",
    metaTitle: "Our Story | House of Laado Handcrafted Ethnic Wear",
    metaDescription: "Learn about House of Laado's dedication to handcrafted ethnic fashion - Inspired by Mom, Crafted for Every Woman.",
    content: `
      <h2>The Heritage of House of Laado</h2>
      <p>Inspired by Mom. Crafted for Every Woman. House of Laado was born from a desire to bring genuine, artisanal handcrafted textiles into contemporary wardrobes.</p>
      <p>Every garment begins with seasoned teakwood blocks carved meticulously by master woodcarvers. In artisan workshops, master drapers press natural vegetable and mineral dyes onto pure mulmul cotton, Chanderi silk, and organic cotton.</p>
      <h3>Ethical Craftsmanship</h3>
      <p>We work directly with artisan families, guaranteeing fair living wages, safe working conditions, and preserving century-old block-printing lineages.</p>
    `,
    isPublished: true,
    needsLegalReview: false,
  },
  {
    slug: "shipping-policy",
    title: "Shipping & Delivery Policy",
    metaTitle: "Shipping Policy | Fast Pan-India Delivery | House of Laado",
    metaDescription: "All orders are dispatched within 24-48 business hours. Free express shipping on all prepaid orders over ₹999.",
    content: `
      <h2>Pan-India Shipping</h2>
      <p>We deliver to 26,000+ Indian postal pincodes in partnership with leading express logistics couriers including Delhivery, Blue Dart, and DTDC.</p>
      <ul>
        <li><strong>Dispatch Time:</strong> Orders are dispatched within 24 to 48 business hours from our atelier.</li>
        <li><strong>Delivery Timeline:</strong> Metro cities: 2-4 business days. Rest of India: 4-6 business days.</li>
        <li><strong>Shipping Charges:</strong> Free shipping across India on orders of ₹999 and above. A nominal shipping fee of ₹99 applies on orders below ₹999.</li>
        <li><strong>Cash on Delivery (COD):</strong> COD is available for select pincodes up to ₹5,000 order value with a flat verification fee of ₹50.</li>
      </ul>
    `,
    isPublished: true,
    needsLegalReview: false,
  },
  {
    slug: "return-exchange-policy",
    title: "Returns & Exchange Policy",
    metaTitle: "7-Day Hassle-Free Returns & Exchange | House of Laado",
    metaDescription: "We offer an easy 7-day exchange or store credit return policy for unworn items with original tags.",
    content: `
      <h2>7-Day Return & Exchange Guarantee</h2>
      <p>We take immense pride in our craftsmanship. If you face any size issue or fit problem, we offer a hassle-free 7-day exchange from the date of delivery.</p>
      <ul>
        <li><strong>Size Exchange:</strong> Free one-time size exchange on all standard apparel.</li>
        <li><strong>Condition:</strong> Items must be unused, unwashed, unaltered, and with all original tags and packaging intact.</li>
        <li><strong>Reverse Pickup:</strong> Our courier partners will arrange a doorstep pickup from your address within 48 hours of approval.</li>
        <li><strong>Refunds:</strong> For returns, refunds are credited to original payment source (online payments) or issued as store credits (COD).</li>
      </ul>
    `,
    isPublished: true,
    needsLegalReview: false,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy (DPDP Act 2023 Compliant)",
    metaTitle: "Privacy Policy | House of Laado",
    metaDescription: "How House of Laado collects, protects, and respects your personal data under the Digital Personal Data Protection Act 2023.",
    content: `
      <h2>Privacy & Data Protection</h2>
      <p>House of Laado values your trust. This Privacy Policy details how we handle personal data in strict compliance with the Indian Digital Personal Data Protection (DPDP) Act, 2023.</p>
      <p>We collect only the minimum data required to process orders, fulfill shipments, and provide customer support (such as your name, shipping address, email, and phone number).</p>
      <p>We never sell your data to third parties. Sensitive payment credentials (card numbers, UPI PINs) are processed directly through PCI-DSS Level 1 compliant gateways (Razorpay) and are never stored on our servers.</p>
    `,
    isPublished: true,
    needsLegalReview: false,
  },
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    metaTitle: "Terms of Service | House of Laado",
    metaDescription: "Terms of service and legal agreement for shopping on House of Laado.",
    content: `
      <h2>Terms and Conditions</h2>
      <p>Welcome to House of Laado. By accessing and using our website, you agree to be bound by these Terms of Service.</p>
      <p>All content, designs, prints, and imagery are intellectual property of House of Laado. Any unauthorized reproduction is strictly prohibited.</p>
      <p>Jurisdiction: All disputes shall be subject to the exclusive jurisdiction of the competent courts in Ahmedabad, Gujarat, India.</p>
    `,
    isPublished: true,
    needsLegalReview: false,
  },
];

const blogPostsData = [
  {
    title: "The Living Heritage of Jaipur Hand-Block Printing: Sanganer to Bagru",
    slug: "living-heritage-jaipur-hand-block-printing",
    excerpt: "Discover the centuries-old alchemy of vegetable dyes, teakwood blocks, and the artisan families preserving India's textile legacy.",
    coverImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    author: "House of Laado Heritage Team",
    tags: ["Hand-Block", "Artisan Craft", "Rajasthan Heritage"],
    readTimeMinutes: 5,
    isPublished: true,
    content: `
      <p>Wandering through the bylanes of Sanganer and Bagru on the outskirts of Jaipur, the rhythmic thud-thud of wooden blocks meeting stretched mulmul fabric is the heartbeat of Rajasthan's textile empire.</p>
      <p>Unlike mechanized roller printing, authentic block printing requires laser-sharp precision. The printer aligns the registration pins by hand, dipping the carved block into natural gum and dye solutions before pressing it firmly onto the cloth.</p>
      <p>At House of Laado, every suit set, kurta, and tiered dress celebrates this tactile human touch.</p>
    `,
  },
  {
    title: "How to Care for Pure Jaipur Mulmul Cotton and Chanderi Silk",
    slug: "how-to-care-mulmul-cotton-chanderi-silk",
    excerpt: "Essential care instructions to maintain the vivid hues, delicate weaves, and longevity of your artisanal ethnic garments.",
    coverImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    author: "Master Textile Care Lead",
    tags: ["Garment Care", "Mulmul Cotton", "Chanderi Silk"],
    readTimeMinutes: 4,
    isPublished: true,
    content: `
      <p>Hand-block printed textiles made with natural dyes thrive with gentle care. For the first two washes, dry cleaning or gentle hand-washing in cold water with mild liquid detergent is recommended.</p>
      <p>Avoid harsh chemical detergents, bleach, and direct midday sunlight drying, which can fade natural vegetable indigo and madder reds. Iron on the reverse side on medium heat.</p>
    `,
  },
  {
    title: "5 Effortless Ways to Style Ethnic Co-ord Sets for Work and Occasion",
    slug: "5-ways-to-style-ethnic-coord-sets",
    excerpt: "From boardroom elegance to breezy Sunday brunches, master the versatile art of contemporary ethnic matching sets.",
    coverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    author: "Vastra Style Desk",
    tags: ["Styling Guide", "Co-ord Sets", "Indo-Western"],
    readTimeMinutes: 4,
    isPublished: true,
    content: `
      <p>The contemporary co-ord set has redefined Indian ethnic wear. By pairing clean modern tailoring with traditional hand-block prints, you get an outfit that transitions effortlessly from morning meetings to evening dinners.</p>
      <p>Pair your printed shirt-trousers duo with minimal juttis and silver jhumkas for work, or layer a structured blazer on top for formal occasions.</p>
    `,
  },
];

async function seed() {
  try {
    console.log("[Seed] Connecting to MongoDB...");
    await connectDB();

    console.log("\n===============================================");
    console.log("  STARTING COMPREHENSIVE SEEDING (PHASE 3)");
    console.log("===============================================\n");

    // 1. Seed Roles & Users
    console.log("[Seed] Seeding Roles & Core Users...");
    const secureAdminPassword = process.env.ADMIN_PASSWORD || env.adminPassword;
    const configuredAdminEmail = (env.adminEmail || "admin@houseoflaado.com").toLowerCase();

    // Check if an administrative account already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: configuredAdminEmail },
        { email: "admin@houseoflaado.com" },
        { role: "admin" },
        { role: "owner" },
      ],
    });

    if (!existingAdmin && (!secureAdminPassword || secureAdminPassword.length < 8)) {
      throw new Error(
        "[Seed Error] Cannot provision administrative accounts: ADMIN_PASSWORD is not configured in the environment (must be at least 8 characters). Please set ADMIN_PASSWORD before running the seeder."
      );
    }

    const usersToSeed = [
      ...(secureAdminPassword
        ? [
            ...(configuredAdminEmail !== "admin@houseoflaado.com"
              ? [
                  {
                    name: "Store Administrator",
                    email: configuredAdminEmail,
                    password: secureAdminPassword,
                    role: "admin",
                    phone: "+91 98765 43210",
                  },
                ]
              : []),
            {
              name: "House of Laado Owner",
              email: "owner@houseoflaado.com",
              password: process.env.OWNER_PASSWORD || secureAdminPassword,
              role: "owner",
              phone: "+91 98765 43210",
            },
            {
              name: "House of Laado Administrator",
              email: "admin@houseoflaado.com",
              password: secureAdminPassword,
              role: "admin",
              phone: "+91 98765 43210",
            },
            {
              name: "House of Laado Staff Lead",
              email: "staff@houseoflaado.com",
              password: process.env.STAFF_PASSWORD || secureAdminPassword,
              role: "staff",
              phone: "+91 98765 43210",
            },
            {
              name: "Pooja Sharma",
              email: "customer@houseoflaado.com",
              password: process.env.CUSTOMER_SEED_PASSWORD || secureAdminPassword,
              role: "customer",
              phone: "+91 98765 43210",
              addresses: [
                {
                  fullName: "Pooja Sharma",
                  phone: "+91 98765 43210",
                  streetAddress: "108, Heritage Crafts Lane, C-Scheme",
                  city: "Jaipur",
                  state: "Rajasthan",
                  pincode: "302001",
                  isDefault: true,
                },
              ],
            },
          ]
        : []),
    ];

    for (const u of usersToSeed) {
      const existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        await User.create(u);
        console.log(`  ✓ Created user: ${u.email} (${u.role})`);
      } else {
        existingUser.name = u.name;
        existingUser.role = u.role;
        existingUser.phone = u.phone;
        await existingUser.save();
        console.log(`  ✓ Updated user: ${u.email} (${u.role})`);
      }
    }

    // 2. Seed Categories
    console.log("\n[Seed] Seeding Categories...");
    const categoryMap = {};
    for (const cat of categoriesData) {
      const existing = await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      categoryMap[cat.slug] = existing._id;
      console.log(`  ✓ Category: ${cat.name} (${cat.slug})`);
    }

    // 3. Seed Products with Variants
    console.log(`\n[Seed] Seeding ${productsData.length} Products with Variants...`);
    let productCount = 0;
    for (const prod of productsData) {
      const categoryId = categoryMap[prod.categorySlug];
      if (!categoryId) {
        console.warn(`[Seed Warning] Category slug ${prod.categorySlug} not found for product ${prod.name}`);
        continue;
      }

      // Generate realistic variants for each size and primary color
      const variants = [];
      const primaryColorName = prod.colors?.[0]?.name || "Standard";
      const slugPrefix = prod.slug.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, "");

      for (const size of prod.sizes) {
        variants.push({
          sku: `HOL-${slugPrefix}-${size}`,
          size,
          color: primaryColorName,
          stock: Math.floor(prod.stock / prod.sizes.length) + 5,
          reservedStock: 0,
          barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
          price: prod.sellingPrice,
          image: prod.primaryImage,
        });
      }

      await Product.findOneAndUpdate(
        { slug: prod.slug },
        {
          ...prod,
          sku: `HOL-${slugPrefix}`,
          tags: [prod.categorySlug, prod.fabric, "Handcrafted", "House of Laado"],
          category: categoryId,
          variants,
          images: prod.images && prod.images.length ? prod.images : [prod.primaryImage, prod.secondaryImage].filter(Boolean),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      productCount++;
    }
    console.log(`  ✓ Successfully seeded ${productCount} products across ${Object.keys(categoryMap).length} categories.`);

    // 4. Seed Coupons
    console.log("\n[Seed] Seeding Coupons...");
    for (const coupon of couponsData) {
      await Coupon.findOneAndUpdate(
        { code: coupon.code },
        coupon,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`  ✓ Coupon: ${coupon.code}`);
    }

    // 5. Seed Banners
    console.log("\n[Seed] Seeding Promotional Banners...");
    for (const banner of bannersData) {
      await Banner.findOneAndUpdate(
        { title: banner.title },
        banner,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`  ✓ Banner: ${banner.title}`);
    }

    // 6. Seed Homepage Sections
    console.log("\n[Seed] Seeding Homepage Sections...");
    for (const sec of homepageSectionsData) {
      await HomepageSection.findOneAndUpdate(
        { key: sec.key },
        sec,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`  ✓ Section: ${sec.key}`);
    }

    // 7. Seed Settings
    console.log("\n[Seed] Seeding Store Settings...");
    for (const setting of settingsData) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`  ✓ Setting: ${setting.key}`);
    }

    // 8. Seed Legal and Informational Pages
    console.log("\n[Seed] Seeding Informational & Legal Pages...");
    for (const page of pagesData) {
      await Page.findOneAndUpdate(
        { slug: page.slug },
        page,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`  ✓ Page: ${page.title} (/${page.slug})`);
    }

    // 9. Seed Blog Posts
    console.log("\n[Seed] Seeding Heritage Blog Posts...");
    for (const post of blogPostsData) {
      await BlogPost.findOneAndUpdate(
        { slug: post.slug },
        post,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`  ✓ Blog: ${post.title}`);
    }

    console.log("\n===============================================");
    console.log("  PHASE 3 DATABASE SEED COMPLETED SUCCESSFULLY!");
    console.log(`  Total Products: ${productCount}`);
    console.log(`  Total Categories: ${categoriesData.length}`);
    console.log(`  Total Users: ${usersToSeed.length}`);
    console.log(`  Total Coupons: ${couponsData.length}`);
    console.log(`  Total Banners: ${bannersData.length}`);
    console.log(`  Total Pages: ${pagesData.length}`);
    console.log(`  Total Blog Posts: ${blogPostsData.length}`);
    console.log("===============================================\n");
  } catch (err) {
    console.error("[Seed Error]:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

seed();
