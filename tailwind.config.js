/* eslint-env node */
/** @type {import('tailwindcss').Config} */

const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "Inter", "SF Pro Display", "system-ui", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        "unicloud-blue": "rgb(var(--theme-color-rgb) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--theme-color-rgb) / <alpha-value>)",
          50: "rgb(var(--theme-color-50) / <alpha-value>)",
          100: "rgb(var(--theme-color-100) / <alpha-value>)",
          200: "rgb(var(--theme-color-200) / <alpha-value>)",
          300: "rgb(var(--theme-color-300) / <alpha-value>)",
          400: "rgb(var(--theme-color-400) / <alpha-value>)",
          500: "rgb(var(--theme-color-500) / <alpha-value>)",
          600: "rgb(var(--theme-color-600) / <alpha-value>)",
          700: "rgb(var(--theme-color-700) / <alpha-value>)",
          800: "rgb(var(--theme-color-800) / <alpha-value>)",
          900: "rgb(var(--theme-color-900) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      });
    }),
  ],
};
