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

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});
