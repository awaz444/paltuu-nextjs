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
        primary: "#A03048",  // Add your custom primary color here
        dark: "#70223f",     // Add custom dark color
        light: "#ffd2e3",    // Add custom light color
        tertiary: "#ffa6c8", // Add custom tertiary color
        vetPrimary: "#6a398c", // Example for vet color scheme
        adminPrimary: "#02187b", // Example for admin color scheme
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // Add this part to extend base styles
      backgroundColor: {
        "gray-100": "#f7fafc", // Tailwind's default gray-100
      },
    },
  },
  plugins: [],
};

export default config;
