/**
 * Color Helper Utility for House of Laado Storefront
 * Maps fashion color names to hex codes and generates deterministic swatches for custom colors.
 */
export const COLOR_PALETTE = {
  "burgundy wine": "#5F0D24",
  "burgundy": "#5F0D24",
  "wine": "#5F0D24",
  "powder pink": "#E8A598",
  "pink": "#FFC0CB",
  "rose": "#C6A75E",
  "navy": "#1F2A44",
  "navy blue": "#1F2A44",
  "blue": "#1E3A8A",
  "royal blue": "#2563EB",
  "sky blue": "#38BDF8",
  "black": "#171717",
  "white": "#FFFFFF",
  "off white": "#F9F8F6",
  "ivory": "#FAF7F2",
  "cream": "#FFFDD0",
  "beige": "#E8DCC8",
  "warm beige": "#E8DCC8",
  "gold": "#C6A75E",
  "soft gold": "#C6A75E",
  "mustard": "#EAB308",
  "yellow": "#FDE047",
  "olive": "#556B2F",
  "olive green": "#556B2F",
  "green": "#15803D",
  "emerald": "#047857",
  "emerald green": "#047857",
  "teal": "#0D9488",
  "maroon": "#800000",
  "rust": "#B45309",
  "orange": "#F97316",
  "peach": "#FDBA74",
  "red": "#DC2626",
  "crimson": "#991B1B",
  "grey": "#6B7280",
  "gray": "#6B7280",
  "charcoal": "#374151",
  "purple": "#7E22CE",
  "lavender": "#C084FC",
  "brown": "#78350F",
  "indigo": "#4338CA",
  "standard": "#1F2A44",
  "default": "#1F2A44"
};

/**
 * Returns a valid hex color code for any given color name.
 */
export function getColorHex(name, fallbackHex = null) {
  if (fallbackHex && /^#([0-9a-fA-F]{3}){1,2}$/.test(fallbackHex)) {
    return fallbackHex;
  }
  if (!name || typeof name !== "string") {
    return "#1F2A44";
  }
  const clean = name.trim().toLowerCase();
  if (COLOR_PALETTE[clean]) {
    return COLOR_PALETTE[clean];
  }

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 55, 38);
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
