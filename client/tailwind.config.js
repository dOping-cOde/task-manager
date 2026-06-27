import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        hand: ['"Caveat"', '"Segoe Print"', "cursive"],
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slam-in": {
          "0%": { opacity: "0", transform: "translateY(-120%) scale(0.8)" },
          "60%": { opacity: "1", transform: "translateY(8%) scale(1.04)" },
          "80%": { transform: "translateY(-2%) scale(0.99)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-5px)" },
          "40%, 80%": { transform: "translateX(5px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.5)" },
          "50%": { boxShadow: "0 0 28px 6px rgba(239,68,68,0.35)" },
        },
        // Floating praise: starts at center, rises toward the top, fades out.
        praise: {
          "0%": { opacity: "0", transform: "translateX(-50%) translateY(0) scale(0.8)" },
          "15%": { opacity: "1", transform: "translateX(-50%) translateY(0) scale(1)" },
          "70%": { opacity: "1", transform: "translateX(-50%) translateY(-30vh) scale(1.02)" },
          "100%": { opacity: "0", transform: "translateX(-50%) translateY(-42vh) scale(1.05)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
        "slam-in": "slam-in 0.55s cubic-bezier(0.22,1.4,0.36,1)",
        shake: "shake 0.5s ease-in-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        praise: "praise 2s ease-out forwards",
      },
    },
  },
  plugins: [typography],
};