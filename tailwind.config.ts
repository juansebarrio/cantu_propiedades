import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "serif"],
      },
      colors: {
        ink: "#1a1a1a",
        paper: "#F7F7F7",
        line: "#e3e3e3",
        accent: "#6B8CFF",
      },
    },
  },
  plugins: [],
};

export default config;
