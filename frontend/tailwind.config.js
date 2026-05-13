/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1faec",
          100: "#dcf3cf",
          200: "#bbe79f",
          300: "#92d667",
          400: "#6ac23a",
          500: "#14a800", // Upwork-inspired primary
          600: "#108a00",
          700: "#0d6e00",
          800: "#0a5800",
          900: "#063f00",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f7f8f4", // body background — warm light
          muted: "#eef0ea",
        },
        ink: {
          DEFAULT: "#0f172a",
          muted: "#475569",
          soft: "#64748b",
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
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.05)",
        lift: "0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)",
        focus: "0 0 0 4px rgba(20, 168, 0, 0.18)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};
