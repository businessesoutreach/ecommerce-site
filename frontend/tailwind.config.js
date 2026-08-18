/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Archivo", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        fire: {
          DEFAULT: "#FF3B30",
          hover: "#E03126",
          subtle: "#FFF1F0",
        },
        obsidian: "#0A0A0A",
        canvas: "#FAFAFA",
        ink: {
          900: "#0A0A0A",
          700: "#27272A",
          500: "#52525B",
          400: "#71717A",
          200: "#E5E7EB",
          100: "#F4F4F5",
        },
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
