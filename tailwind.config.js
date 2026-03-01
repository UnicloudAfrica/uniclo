/* eslint-env node */
/** @type {import('tailwindcss').Config} */

const plugin = require("tailwindcss/plugin");

const withAlpha = (cssVar) => `rgb(var(${cssVar}) / <alpha-value>)`;
const themeScale = (prefix) => ({
  50: withAlpha(`--${prefix}-50`),
  100: withAlpha(`--${prefix}-100`),
  200: withAlpha(`--${prefix}-200`),
  300: withAlpha(`--${prefix}-300`),
  400: withAlpha(`--${prefix}-400`),
  500: withAlpha(`--${prefix}-500`),
  600: withAlpha(`--${prefix}-600`),
  700: withAlpha(`--${prefix}-700`),
  800: withAlpha(`--${prefix}-800`),
  900: withAlpha(`--${prefix}-900`),
  DEFAULT: withAlpha(`--${prefix}-500`),
});
const neutralScale = themeScale("theme-neutral");

module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "Inter", "SF Pro Display", "system-ui", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        "unicloud-blue": "rgb(var(--theme-color-rgb) / <alpha-value>)",
        primary: themeScale("theme-color"),
        secondary: themeScale("secondary-color"),
        success: themeScale("theme-success"),
        warning: themeScale("theme-warning"),
        danger: themeScale("theme-danger"),
        gray: neutralScale,
        slate: neutralScale,
        zinc: neutralScale,
        neutral: neutralScale,
        stone: neutralScale,
        blue: themeScale("theme-color"),
        sky: themeScale("theme-color"),
        indigo: themeScale("theme-color"),
        cyan: themeScale("secondary-color"),
        teal: themeScale("secondary-color"),
        emerald: themeScale("theme-success"),
        green: themeScale("theme-success"),
        lime: themeScale("theme-success"),
        amber: themeScale("theme-warning"),
        yellow: themeScale("theme-warning"),
        orange: themeScale("theme-warning"),
        red: themeScale("theme-danger"),
        rose: themeScale("theme-danger"),
        purple: themeScale("theme-color"),
        violet: themeScale("theme-color"),
        fuchsia: themeScale("theme-color"),
        pink: themeScale("theme-color"),
        surface: {
          page: "var(--surface-page)",
          card: "var(--surface-card)",
          alt: "var(--theme-surface-alt)",
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
