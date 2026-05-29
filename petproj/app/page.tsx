import { Metadata } from "next";
import HeroSection from "../components/HeroSection";

export const metadata: Metadata = {
  title: {
    absolute: "Paltuu — Pakistan's #1 Pet Adoption & Care Platform | Paltuu.pk",
  },
  description:
    "Paltuu (also spelled Paltu) is Pakistan's first pet adoption platform. Adopt dogs and cats, connect with verified vets, and shop pet products in Karachi, Lahore, and Islamabad. Join Pakistan's largest pet community.",
  keywords: [
    "paltuu",
    "paltu",
    "paltuu.pk",
    "pet adoption pakistan",
    "adopt dog pakistan",
    "adopt cat pakistan",
    "pets for adoption karachi",
    "pets for adoption lahore",
    "vet pakistan",
    "pet care pakistan",
    "pakistan pet app",
    "pet community pakistan",
  ],
  openGraph: {
    title: "Paltuu — Pakistan's #1 Pet Adoption & Care Platform",
    description:
      "Adopt pets, find vets, and shop pet products across Pakistan. Paltuu.pk is Pakistan's first pet super app — connecting pet lovers in Karachi, Lahore, and Islamabad.",
    url: "https://paltuu.pk",
    siteName: "Paltuu.pk",
    type: "website",
    images: [
      {
        url: "https://paltuu.pk/paltu_logo.svg",
        width: 800,
        height: 400,
        alt: "Paltuu — Pakistan's First Pet Adoption Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paltuu — Pakistan's #1 Pet Adoption & Care Platform",
    description:
      "Adopt pets, find vets, and shop pet products across Pakistan. Pakistan's first pet super app.",
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
