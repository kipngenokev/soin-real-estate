/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Single confident accent — used sparingly, never as a wash.
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#172554",
        },
        // Type scale — near-black for headings, muted for body, soft for support.
        ink: {
          DEFAULT: "#0a0a0a",
          muted: "#3f3f46",
          soft: "#71717a",
        },
        // Surface scale — off-white background, hairline borders.
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#fafafa",
          muted: "#f4f4f5",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      letterSpacing: {
        // Slightly tighter than default for large headings.
        tightish: "-0.015em",
      },
      boxShadow: {
        // Almost imperceptible — minimal aesthetic.
        card: "0 1px 0 0 rgba(10, 10, 10, 0.04)",
        lift: "0 8px 24px -8px rgba(10, 10, 10, 0.10), 0 2px 6px -1px rgba(10, 10, 10, 0.04)",
        focus: "0 0 0 3px rgba(37, 99, 235, 0.20)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};
