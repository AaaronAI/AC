import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0b0f0c",
          panel: "#11171392",
          card: "#141b16",
          ridge: "#1a221c",
        },
        topo: {
          line: "#2a3a2e",
          accent: "#4ade80",
          ember: "#f97316",
          danger: "#ef4444",
          warn: "#eab308",
          ok: "#22c55e",
        },
        ink: {
          base: "#e6f0ea",
          mute: "#8a9c91",
          dim: "#5b6e64",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        topo: "radial-gradient(circle at 20% 10%, rgba(74,222,128,0.06), transparent 50%), radial-gradient(circle at 80% 70%, rgba(249,115,22,0.05), transparent 50%)",
      },
    },
  },
  plugins: [],
};
export default config;
