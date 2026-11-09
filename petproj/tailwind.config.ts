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
                primary: {
                    DEFAULT: "var(--primary-color)", // Use the CSS variable
                    dark: "var(--dark-color)",
                    light: "var(--light-color)",
                },
            },
            fontFamily: {
                // Vets at Home only, to match the app (app/fonts.ts).
                pixel: ["var(--font-pixel)", "ui-monospace", "monospace"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            backgroundColor: {
                "gray-100": "#f7fafc", // Tailwind's default gray-100
            },
        },
    },
    plugins: [
        require('tailwind-scrollbar'),
    ],
};

export default config;
