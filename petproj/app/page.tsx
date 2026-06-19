import { Metadata } from "next";
import HeroSection from "../components/HeroSection";

export const metadata: Metadata = {
  title: {
    absolute: "Paltuu — Pakistan's First Pet Super App & #1 Pet Adoption Platform | Paltuu.pk",
  },
  description:
    "Paltuu (also spelled Paltu or Paaltuu) is Pakistan's first pet super app and #1 pet adoption platform. Adopt dogs and cats, connect with verified vets, and shop pet products in Karachi, Lahore, Islamabad, and across Pakistan. Join our growing pet community.",
  keywords: [
    "paltuu",
    "paltu",
    "paaltuu",
    "paltuu.pk",
    "pet adoption pakistan",
    "pet super app pakistan",
    "pakistan pet platform",
    "adopt dog pakistan",
    "adopt cat pakistan",
    "cat adoption karachi",
    "dog adoption karachi",
    "cat adoption lahore",
    "dog adoption lahore",
    "cat adoption islamabad",
    "dog adoption islamabad",
    "pet adoption karachi",
    "pet adoption lahore",
    "pet adoption islamabad",
    "vet pakistan",
    "pet care pakistan",
    "pakistan pet app",
    "pet community pakistan",
  ],
  openGraph: {
    title: "Paltuu — Pakistan's First Pet Super App & #1 Pet Adoption Platform",
    description:
      "Adopt pets, find verified vets, shop premium pet products, and connect with the pet community across Pakistan. Paltuu.pk is Pakistan's first pet super app — serving Karachi, Lahore, and Islamabad.",
    url: "https://paltuu.pk",
    siteName: "Paltuu.pk",
    type: "website",
    images: [
      {
        url: "https://paltuu.pk/paltu_logo.svg",
        width: 800,
        height: 400,
        alt: "Paltuu — Pakistan's First Pet Super App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paltuu — Pakistan's First Pet Super App & #1 Pet Adoption Platform",
    description:
      "Adopt pets, find vets, shop pet products, and join Pakistan's first pet super app.",
    images: ["https://paltuu.pk/paltu_logo.svg"],
  },
  alternates: {
    canonical: "https://paltuu.pk",
  },
};

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white">
      <HeroSection />
    </main>
  );
}
