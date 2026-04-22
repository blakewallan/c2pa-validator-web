import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        serif: ["ui-serif", "Georgia", "Cambria", "serif"],
      },
      colors: {
        ink: {
          50: "#fafaf9",
          100: "#f4f4f3",
          200: "#e7e7e5",
          300: "#d1d1ce",
          400: "#a3a29e",
          500: "#6b6a66",
          600: "#4a4945",
          700: "#2f2e2b",
          800: "#1b1a18",
          900: "#0e0d0c",
        },
        accent: {
          DEFAULT: "#d97706",
          soft: "#fef3c7",
        },
        error: {
          DEFAULT: "#b91c1c",
          soft: "#fee2e2",
        },
        warn: {
          DEFAULT: "#b45309",
          soft: "#fef3c7",
        },
        ok: {
          DEFAULT: "#166534",
          soft: "#dcfce7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
