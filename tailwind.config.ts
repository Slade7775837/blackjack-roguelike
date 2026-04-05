/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-crimson)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      colors: {
        bg: "#0a0a0f",
        surface: "#12121c",
        "surface-high": "#1a1a28",
        border: "#252535",
        "border-light": "#2f2f45",
        text: "#e8e6f0",
        "text-dim": "#6a6880",
        gold: "#c4973a",
        "gold-dim": "#5e4820",
        crimson: "#c44040",
        "crimson-dim": "#5e2020",
        emerald: "#3a9a68",
        "emerald-dim": "#1e4f35",
        sapphire: "#3a68c4",
      },
      animation: {
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "card-deal": "cardDeal 0.4s ease-out",
        "damage": "damage 0.5s ease-out",
        "pulse-gold": "pulseGold 2s infinite",
      },
      keyframes: {
        slideIn: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        cardDeal: {
          "0%": { opacity: 0, transform: "translateY(-20px) scale(0.9)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        damage: {
          "0%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
          "100%": { transform: "translateX(0)" },
        },
        pulseGold: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [],
};
