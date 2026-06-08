import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: "#6B0F2B",
          deep: "#4A0A1E",
          light: "#8B1A3A",
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C97A",
          pale: "#F5E6C0",
        },
        surface: {
          1: "#110810",
          2: "#1C1018",
          3: "#261620",
          4: "#321E28",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
