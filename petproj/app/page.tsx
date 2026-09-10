import { Metadata } from "next";
import HeroSection from "../components/HeroSection";
import LatestBlogsSection from "@/components/LatestBlogsSection";
import HomepageFAQ from "@/components/HomepageFAQ";
import HomeSeoContent from "@/components/HomeSeoContent";
import { getAllBlogsMetadata } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "Pets in Pakistan — Pet Adoption, Vets Near You & Pet Care",
  description:
    "Paltuu.pk is the platform for pets in Pakistan — adopt dogs, cats, puppies, and kittens, find a verified vet near you, report lost pets, and join Pakistan's largest pet community in Karachi, Lahore, Islamabad, and nationwide. Download the app on Android now.",
  keywords: [
    "paltuu",
    "paltu",
    "paaltuu",
    "paltuu.pk",
    "pets pakistan",
    "pets in pakistan",
    "pet website pakistan",
    "pet platform pakistan",
    "vets near me",
    "vet near me pakistan",
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
    title: "Pets in Pakistan — Pet Adoption, Vets Near You & Pet Care | Paltuu",
    description:
      "Adopt pets, find a verified vet near you, and join Pakistan's largest pet community. Paltuu.pk is the platform for pets in Pakistan — serving Karachi, Lahore, and Islamabad.",
    url: "https://www.paltuu.pk",
    siteName: "Paltuu.pk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pets in Pakistan — Pet Adoption, Vets Near You & Pet Care | Paltuu",
    description:
      "Adopt pets, find a vet near you, and join Pakistan's largest pet community. Download the platform for pets in Pakistan.",
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
      <HomeSeoContent />
      <HomepageFAQ />
    </main>
  );
}
