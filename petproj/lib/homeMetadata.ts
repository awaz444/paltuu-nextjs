import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Metadata for paltuu.pk's "/". Shared by app/page.tsx (the Pakistan page) and
 * app/lp/karachi/page.tsx (the same URL for visitors in Karachi, chosen in
 * middleware.ts), so both carry the same title, description and canonical.
 */
export const homeMetadata: Metadata = {
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
