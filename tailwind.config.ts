import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-prompt)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        ap: {
          bg: "#f5f5f7",
          card: "#ffffff",
          blue: "#0071e3",
          "blue-h": "#0077ed",
          primary: "#1d1d1f",
          secondary: "#6e6e73",
          tertiary: "#aeaeb2",
          border: "rgba(0,0,0,0.08)",
          red: "#ff3b30",
          green: "#34c759",
          orange: "#ff9500",
        },
      },
      borderRadius: { "2xl": "18px", "3xl": "24px", "4xl": "32px" },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 28px rgba(0,0,0,0.09), 0 0 1px rgba(0,0,0,0.04)",
        "card-xl": "0 20px 60px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.06)",
        "focus-blue": "0 0 0 3px rgba(0,113,227,0.18)",
        "focus-red": "0 0 0 3px rgba(255,59,48,0.15)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "15%": { transform: "translateX(-7px)" },
          "45%": { transform: "translateX(7px)" },
          "65%": { transform: "translateX(-4px)" },
          "85%": { transform: "translateX(4px)" },
        },
        popIn: {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        marquee: {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(-100%)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.45s cubic-bezier(.25,.46,.45,.94) both",
        "fade-in": "fadeIn 0.3s ease both",
        "fade-in-slow": "fadeIn 1.2s ease both",
        shake: "shake 0.45s ease",
        "pop-in": "popIn 0.35s cubic-bezier(.34,1.56,.64,1) both",
        marquee: "marquee 20s linear 2s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
