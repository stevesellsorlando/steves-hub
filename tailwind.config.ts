import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: { DEFAULT: "#1f2023", light: "#2b2c30", lighter: "#3a3b40" },
        gold: { DEFAULT: "#c9a24a", light: "#e3c77f", dark: "#a8842f" },
        paper: "#f6f5f2",
      },
    },
  },
  plugins: [],
};
export default config;
