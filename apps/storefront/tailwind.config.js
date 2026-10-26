/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./config/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luxury Palette Tokens (Image Spec: Navy #1F2A44, Warm Beige #E8DCC8, Soft Gold #C6A75E)
        navy: {
          DEFAULT: "#1F2A44",
          dark: "#141C2E",
          light: "#2C3A5E",
          50: "rgba(31, 42, 68, 0.50)",
          70: "rgba(31, 42, 68, 0.70)",
          85: "rgba(31, 42, 68, 0.85)",
        },
        warmBeige: {
          DEFAULT: "#E8DCC8",
          light: "#FAF7F2",
          card: "#F5ECE0",
          dark: "#D6C5A9",
          border: "#E8DCC8",
          subtle: "rgba(232, 220, 200, 0.35)",
        },
        softGold: {
          DEFAULT: "#C6A75E",
          dark: "#A6883F",
          light: "#E2CA8E",
          subtle: "rgba(198, 167, 94, 0.25)",
        },

        // Backward-Compatible Semantic Bindings (All mapped to the luxury palette)
        burgundy: {
          DEFAULT: "#1F2A44", // Navy
          dark: "#141C2E",
          light: "#2C3A5E",
          50: "rgba(31, 42, 68, 0.50)",
          70: "rgba(31, 42, 68, 0.70)",
          85: "rgba(31, 42, 68, 0.85)",
        },
        rose: {
          DEFAULT: "#C6A75E", // Soft Gold
          dark: "#A6883F",
          light: "#E2CA8E",
        },
        blush: {
          DEFAULT: "#E8DCC8", // Warm Beige
          light: "#FAF7F2",
          border: "#E8DCC8",
          subtle: "rgba(232, 220, 200, 0.35)",
        },
        olive: {
          DEFAULT: "#C6A75E", // Soft Gold
          dark: "#A6883F",
          light: "#E2CA8E",
        },
        ivory: {
          DEFAULT: "#E8DCC8",
          light: "#FAF7F2",
          soft: "#FDFBF8",
        },

        // Semantic Aliases & Application Tokens
        primary: {
          DEFAULT: "#1F2A44", // Luxury Navy
          dark: "#141C2E",
          light: "#2C3A5E",
        },
        secondary: {
          DEFAULT: "#C6A75E", // Soft Gold
          dark: "#A6883F",
          light: "#E2CA8E",
        },
        sand: {
          DEFAULT: "#FAF7F2", // Soft Ivory/Beige
          light: "#F5ECE0",
          dark: "#E8DCC8",
        },
        dark: {
          DEFAULT: "#1F2A44", // Midnight Navy (No pure black)
          subtle: "#141C2E",
        },
        muted: {
          DEFAULT: "#384561", // Elegant muted slate-navy
          light: "#5D6A87",
          subtle: "#8D9AB5",
        },
        border: {
          DEFAULT: "#E8DCC8", // Warm Beige Border
          dark: "#D6C5A9",
        },
        forest: "#1F2A44",
        peacock: "#1F2A44",
        badge: {
          new: "#1F2A44",     // Navy
          sale: "#C6A75E",    // Soft Gold
          preorder: "#C6A75E",
          soldout: "#141C2E",
        },
        pink: {
          DEFAULT: "#E8DCC8", // Warm Beige
          dark: "#C6A75E",    // Soft Gold
        },
        gold: {
          DEFAULT: "#C6A75E",
          light: "#E2CA8E",
          dark: "#A6883F",
          star: "#C6A75E",
        },
        black: "#1F2A44", // Strict policy: Navy instead of pure black
        neutral: {
          50: "#FAF7F2",
          100: "#F5ECE0",
          200: "#E8DCC8",
          300: "#D6C5A9",
          400: "#A99981",
          500: "#5D6A87",
          600: "#384561",
          700: "#2C3A5E",
          800: "#1F2A44",
          900: "#141C2E",
        },
        gray: {
          50: "#FAF7F2",
          100: "#F5ECE0",
          200: "#E8DCC8",
          300: "#D6C5A9",
          400: "#A99981",
          500: "#5D6A87",
          600: "#384561",
          700: "#2C3A5E",
          800: "#1F2A44",
          900: "#141C2E",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-dmsans)", "DM Sans", "system-ui", "-apple-system", "sans-serif"],
      },
      letterSpacing: {
        heading: "-0.034em",
      },
      borderRadius: {
        pill: "30px",
        card: "15px",
        badge: "5px",
      },
      aspectRatio: {
        "3/4": "3 / 4",
      },
      maxWidth: {
        container: "1200px",
        fluid: "1410px",
      },
    },
  },
  plugins: [],
};
