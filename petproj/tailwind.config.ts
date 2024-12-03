import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-color)", // Use the CSS variable
      },
    },
    backgroundColor: {
      "gray-100": "#f7fafc", // Tailwind's default gray-100
    },
  },
  plugins: [],
};

export default config;