import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "var(--ink-50)",
          100: "var(--ink-100)",
          200: "var(--ink-200)",
          300: "var(--ink-300)",
          400: "var(--ink-400)",
          500: "var(--ink-500)",
          600: "var(--ink-600)",
          700: "var(--ink-700)",
          800: "var(--ink-800)",
          900: "var(--ink-900)",
          DEFAULT: "var(--ink-900)",
        },
        cream: {
          50: "var(--cream-50)",
          100: "var(--cream-100)",
          200: "var(--cream-200)",
          300: "var(--cream-300)",
          400: "var(--cream-400)",
          DEFAULT: "var(--cream-50)",
        },
        brick: {
          50: "var(--brick-50)",
          100: "var(--brick-100)",
          200: "var(--brick-200)",
          300: "var(--brick-300)",
          500: "var(--brick-500)",
          600: "var(--brick-600)",
          700: "var(--brick-700)",
          DEFAULT: "var(--brick-500)",
        },
        green: { 50: "var(--green-50)", 500: "var(--green-500)" },
        amber: { 50: "var(--amber-50)", 500: "var(--amber-500)" },
        plum: { 50: "var(--plum-50)", 500: "var(--plum-500)" },
        slate: { 50: "var(--slate-50)", 500: "var(--slate-500)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Times New Roman", "Georgia", "serif"],
        sans: [
          "var(--font-geist-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        "subtle-sm": "var(--shadow-sm)",
        "subtle-md": "var(--shadow-md)",
        "subtle-lg": "var(--shadow-lg)",
      },
      letterSpacing: {
        tightest: "-0.02em",
        tighter: "-0.015em",
        tight: "-0.01em",
        wide: "0.04em",
        wider: "0.08em",
        widest: "0.12em",
        "ultra-wide": "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
