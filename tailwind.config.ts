import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        surface: "#12161F",
        "surface-alt": "#1A1F2B",
        border: "#232838",
        primary: {
          DEFAULT: "#3B82F6",
          dark: "#2563EB",
        },
        positive: "#22C55E",
        negative: "#EF4444",
        warning: "#F59E0B",
        muted: "#8891A5",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
