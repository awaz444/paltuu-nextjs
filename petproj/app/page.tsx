import { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import AppSection from "@/components/home/AppSection";
import PlatformPillars from "@/components/home/PlatformPillars";
import AdoptionPathsSection from "@/components/home/AdoptionPathsSection";
import RecentPetsSection from "@/components/home/RecentPetsSection";
import VetDirectorySection from "@/components/home/VetDirectorySection";
import VetsAtHomeSection from "@/components/home/VetsAtHomeSection";
import ImpactStats from "@/components/home/ImpactStats";
import VisionPetIdSection from "@/components/home/VisionPetIdSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CityKeywordLinks from "@/components/home/CityKeywordLinks";
import MotionProvider from "@/components/home/MotionProvider";
import HomeJsonLd from "@/components/home/HomeJsonLd";
import LatestBlogsSection from "@/components/LatestBlogsSection";
import HomepageFAQ from "@/components/HomepageFAQ";
import AppPromoBanner from "@/components/AppPromoBanner";
import AppDownloadBanner from "@/components/app-promo/AppDownloadBanner";
import { APP_PROMOS } from "@/lib/appPromo";
import { getAllBlogsMetadata } from "@/lib/mdx";
import { getRecentPets } from "@/lib/recentPets";
import { SITE_URL } from "@/lib/site";

/**
 * ISR. The page is generated once and served from the CDN, refreshed every 15
 * minutes so the "recently listed" pets stay current without paying for a
 * server render on every request.
 *
 * Keep this page statically renderable: nothing in this tree may call headers()
 * or cookies(). Visitor-specific behaviour (the Karachi banner) goes through
 * /api/v1/geo from the client instead.
 */
export const revalidate = 900;

export const metadata: Metadata = {
  title: "Paltuu — Pet Adoption Platform & Vets Near Me in Pakistan",
  description:
    "Paltuu is Pakistan's pet adoption platform — not a shelter. Adopt a dog or cat listed by owners and registered shelters, list your own pet for adoption, and find vets near you in Karachi, Lahore and Islamabad. Vets at Home available in Karachi.",
  keywords: [
    "paltuu",
    "paltu",
    "paaltuu",
    "paltuu.pk",
    "pets pakistan",
    "pets in pakistan",
    "pet website pakistan",
    "pet platform pakistan",
    "pet adoption platform pakistan",
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
    // Vets near me — the directory's commercial cluster.
    "vets near me karachi",
    "vets near me lahore",
    "vets near me islamabad",
    "vet clinic near me",
    "animal hospital near me pakistan",
    "veterinary doctor near me",
    "pet hospital karachi",
    // Vets at Home — Paltuu's own service, Karachi only.
    "vet at home karachi",
    "home vet visit karachi",
    "at home vet service pakistan",
    "pet vaccination at home karachi",
    // Rehoming — the other half of the platform, and the query behind most of
    // the "do you take cats?" phone calls.
    "list my pet for adoption",
    "rehome my pet pakistan",
    "give my cat for adoption",
    "give my dog for adoption karachi",
  ],
  openGraph: {
    title: "Paltuu — Pet Adoption Platform & Vets Near Me in Pakistan",
    description:
      "Adopt a pet listed by owners and registered shelters, list your own pet for adoption, and find vets near you. Paltuu is Pakistan's pet platform — serving Karachi, Lahore, and Islamabad.",
    url: SITE_URL,
    siteName: "Paltuu.pk",
    type: "website",
    // No `images` here on purpose: app/opengraph-image.tsx supplies it by file
    // convention, and an explicit entry would override it.
  },
  twitter: {
    card: "summary_large_image",
    title: "Paltuu — Pet Adoption Platform & Vets Near Me in Pakistan",
    description:
      "Adopt a pet, list one for adoption, and find a vet near you. Pakistan's pet platform.",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function HomePage() {
  const latestPosts = getAllBlogsMetadata().slice(0, 3);
  const recentPets = await getRecentPets(3);

  return (
    <main className="overflow-hidden bg-white">
      <HomeJsonLd />

      {/* White first: the navbar above is maroon with a rounded bottom edge. */}
      <HeroSection />

      {/* Vets at Home, in the highest slot on the page after the hero.
          VetsAtHomeSection further down is the full pitch — this is the strip
          that catches visitors who never scroll that far. gray-50 on purpose:
          white hero above, maroon AppSection below, so a maroon strip here
          would run straight into the section under it. */}
      <AppDownloadBanner
        promo={APP_PROMOS.vetsAtHome}
        wrapperClassName="bg-gray-50 px-6 py-6 lg:px-12"
        className="mx-auto max-w-6xl"
      />

      {/* One framer-motion boundary. Everything inside stays server-rendered. */}
      <MotionProvider>
        {/* The app sits second because it is the part of Paltuu most visitors
            don't know exists, and downloads are the goal it feeds. */}
        <AppSection />                            {/* primary */}
        <PlatformPillars />                       {/* white   */}
        <AdoptionPathsSection />                  {/* gray-50 */}
        <RecentPetsSection pets={recentPets} />   {/* primary */}
        <VetDirectorySection />                   {/* white   */}
        <VetsAtHomeSection />                     {/* primary */}
        <ImpactStats />                           {/* white   */}
        <VisionPetIdSection />                    {/* gray-50 */}
        <TestimonialsSection />                   {/* primary */}
      </MotionProvider>

      <LatestBlogsSection posts={latestPosts} />  {/* white   */}
      <HomepageFAQ />                             {/* gray-50 */}

      {/* White last: the footer below is maroon with a rounded top edge. */}
      <CityKeywordLinks />

      <AppPromoBanner />
    </main>
  );
}
