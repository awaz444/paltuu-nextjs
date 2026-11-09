import localFont from "next/font/local";

// Fonts used by the Pet Identity Card, matched to the mobile app's PetIdCard
// (paltuu-reactnative/src/components/pets/PetIdCard.tsx): Cheese Milky for the
// card title and field values, DM Sans Medium for the field labels.
export const cheeseMilky = localFont({
  src: "./fonts/Cheese-Milky.otf",
  variable: "--font-cheese-milky",
  display: "swap",
  // The card values are short (names, dates, ID numbers) and the fallback needs
  // similar metrics so nothing reflows once the real face lands.
  fallback: ["Montserrat", "system-ui", "sans-serif"],
});

// The mobile app's pixel face (paltuu-reactnative/assets/pixel/Pixeled.ttf).
// The app sets Vets at Home in it, so the website does too, and nowhere else.
// Only the homepage sections use it, so it isn't preloaded on every page.
export const pixeled = localFont({
  src: "./fonts/Pixeled.ttf",
  variable: "--font-pixel",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

// Self-hosted (the same files the mobile app ships) rather than next/font/google:
// a bad Google Fonts response at build time fails the whole Vercel deploy
// ("An error occurred in next/font", PR #58), and this font only serves the
// Pet Identity Card.
export const dmSans = localFont({
  src: [
    { path: "./fonts/DMSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/DMSans-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/DMSans-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
});
