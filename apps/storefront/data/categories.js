/**
 * Hierarchical Category Structure matching The Jaipur Loom (thejaipurloom.com)
 */
export const categories = [
  {
    id: "womens-wear",
    name: "Women’s Wear",
    slug: "womens-wear",
    image: "https://thejaipurloom.com/cdn/shop/files/Banner_600_x_480_px.png",
    subcategories: [
      {
        id: "kurtas",
        name: "Kurtas",
        slug: "kurtas",
        items: [
          { name: "A-line", slug: "a-line" },
          { name: "Straight", slug: "straight" },
          { name: "Under 699", slug: "under-700" },
        ],
      },
      {
        id: "suit-sets",
        name: "Suit Sets",
        slug: "suit-sets",
        items: [
          { name: "2-Piece Sets", slug: "2-piece-sets" },
          { name: "3-Piece Sets", slug: "3-piece-sets" },
        ],
      },
      {
        id: "lounge-coord-sets",
        name: "Lounge/ Co-ord Sets",
        slug: "lounge-co-ord-sets",
        items: [
          { name: "Lounge Sets", slug: "lounge-sets" },
          { name: "Co-ord Sets", slug: "co-ord-sets" },
        ],
      },
      {
        id: "tops-short-kurtis",
        name: "Tops/ Short Kurtis",
        slug: "tops-short-kurtis",
        items: [
          { name: "Casual Kurtis", slug: "casual-kurtis" },
          { name: "Printed Tops", slug: "printed-tops" },
        ],
      },
      {
        id: "dresses",
        name: "Dresses",
        slug: "dresses",
        items: [
          { name: "Ethnic", slug: "ethnic" },
          { name: "Fusion", slug: "fusion" },
          { name: "Others", slug: "others" },
        ],
      },
      {
        id: "bottoms-jackets",
        name: "Bottoms & Jackets",
        slug: "bottoms",
        items: [
          { name: "Bottoms", slug: "bottoms" },
          { name: "Reversible Quilted Jackets", slug: "reversible-quilted-jackets" },
        ],
      },
    ],
  },
  {
    id: "bags",
    name: "Bags",
    slug: "bags",
    image: "https://thejaipurloom.com/cdn/shop/files/Bags_banner.png",
    subcategories: [
      {
        id: "bag-types",
        name: "Artisanal Bags",
        slug: "bags",
        items: [
          { name: "Tote Bags", slug: "tote-bags" },
          { name: "Vanity Bags", slug: "vanity-bags" },
          { name: "Toiletry Bags", slug: "toiletry-bags" },
          { name: "Laptop Sleeves", slug: "laptop-sleeves" },
        ],
      },
    ],
  },
  {
    id: "special-prices",
    name: "Special Prices",
    slug: "special-prices",
    isSale: true,
    image: "https://thejaipurloom.com/cdn/shop/files/festiv8.jpg",
    subcategories: [
      {
        id: "sale-categories",
        name: "Sale Categories",
        slug: "special-prices",
        items: [
          { name: "Dresses - Sale", slug: "dresses-sale" },
          { name: "Kurtas - Sale", slug: "kurta-sale" },
          { name: "Lounge/ Co-ord Sets - Sale", slug: "lounge-co-ord-sets-sale" },
          { name: "Suit Sets - Sale", slug: "suit-set-sale" },
          { name: "Tops/ Short Kurtis - Sale", slug: "tops-short-kurtis-sale" },
        ],
      },
    ],
  },
  {
    id: "festive-edit",
    name: "Festive Edit",
    slug: "festive-edit",
    isFeatured: true,
    image: "https://thejaipurloom.com/cdn/shop/files/WhatsApp_Image_2026-10-01_at_16.23.18.jpg",
  },
  {
    id: "kids-wear",
    name: "Kids",
    slug: "kids-wear",
    image: "https://thejaipurloom.com/cdn/shop/files/img_0496.jpg",
    subcategories: [
      {
        id: "kids-types",
        name: "Kids Collection",
        slug: "kids-wear",
        items: [
          { name: "Girls", slug: "girls" },
          { name: "Boys", slug: "boys" },
        ],
      },
    ],
  },
  {
    id: "menswear",
    name: "Menswear",
    slug: "menswear",
    image: "https://thejaipurloom.com/cdn/shop/files/IMG_8077.jpg",
  },
];

// Collection shortcuts for Homepage (matching reference banner cards: Suit Sets, Dresses, Bags, Kurtas, Co-ords, Kids)
export const categoryShortcuts = [
  {
    id: "suit-sets",
    name: "Suit Sets",
    href: "/collections/suit-sets",
    image: "https://thejaipurloom.com/cdn/shop/files/Banner_600_x_480_px.png",
    badge: "Best Seller",
  },
  {
    id: "dresses",
    name: "Dresses",
    href: "/collections/dresses",
    image: "https://thejaipurloom.com/cdn/shop/files/Banner_600_x_480_px_2.png",
    badge: "Trending",
  },
  {
    id: "bags",
    name: "Bags",
    href: "/collections/bags",
    image: "https://thejaipurloom.com/cdn/shop/files/Bags_banner.png",
  },
  {
    id: "kurtas",
    name: "Kurtas",
    href: "/collections/kurtas",
    image: "https://thejaipurloom.com/cdn/shop/files/IMG_6599.png",
  },
  {
    id: "coord-sets",
    name: "Co-ord Sets",
    href: "/collections/lounge-co-ord-sets",
    image: "https://thejaipurloom.com/cdn/shop/files/IMG_6966.jpg",
  },
  {
    id: "kids-wear",
    name: "Kids Wear",
    href: "/collections/kids-wear",
    image: "https://thejaipurloom.com/cdn/shop/files/img_0496.jpg",
  },
];
