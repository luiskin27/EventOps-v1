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
      keyframes: {
        // новое пожелание «прилетает» на доску
        pop: {
          "0%": { opacity: "0", transform: "scale(.6) translateY(24px)" },
          "60%": { opacity: "1", transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(251,113,133,0)" },
          "50%": { boxShadow: "0 0 0 10px rgba(251,113,133,.45)" },
        },
      },
      animation: {
        pop: "pop .7s cubic-bezier(.2,.8,.2,1) both",
        glow: "glow 1.6s ease-in-out 3",
      },
    },
  },
  plugins: [],
};
