/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        // только для свадебных экранов: стена поздравлений
        display: ["Cormorant Garamond", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
