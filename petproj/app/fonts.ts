import localFont from "next/font/local";
import { DM_Sans } from "next/font/google";

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

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});
