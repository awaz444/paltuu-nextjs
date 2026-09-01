import { Metadata } from "next";
import HeroSection from "../components/HeroSection";
import LatestBlogsSection from "@/components/LatestBlogsSection";
import HomepageFAQ from "@/components/HomepageFAQ";
import { getAllBlogsMetadata } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "Pet Adoption Pakistan — Adopt Dogs & Cats",
  description:
    "Paltuu is Pakistan's first pet super app and #1 pet adoption platform. Adopt dogs, cats, puppies, and kittens, connect with verified home vets, and join Pakistan's largest pet community in Karachi, Lahore, Islamabad, and across Pakistan. Download the app on Android now.",
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
    "puppy adoption pakistan",
    "kitten adoption pakistan",
    "adopt puppy",
    "adopt kitten",
    "puppy karachi",
    "kitten karachi",
    "puppies for adoption lahore",
    "kittens for adoption lahore",
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
    "paltuu app",
    "pet community app pakistan",
  ],
  openGraph: {
    title: "Pet Adoption Pakistan — Adopt Dogs & Cats | Paltuu",
    description:
      "Adopt pets, find verified home vets, and join Pakistan's largest pet community. Paltuu.pk is Pakistan's first pet super app — serving Karachi, Lahore, and Islamabad.",
    url: "https://www.paltuu.pk",
    siteName: "Paltuu.pk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pet Adoption Pakistan — Adopt Dogs & Cats | Paltuu",
    description:
      "Adopt pets, find vets, and join Pakistan's largest pet community. Download Pakistan's first pet super app.",
  },
  alternates: {
    canonical: "https://www.paltuu.pk",
  },
};

export default function HomePage() {
  const latestPosts = getAllBlogsMetadata().slice(0, 3);

  return (
    <main className="overflow-hidden bg-white">
      <HeroSection />
      <LatestBlogsSection posts={latestPosts} />
      <HomepageFAQ />
    </main>
  );
}
