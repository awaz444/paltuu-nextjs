import type { Metadata } from "next";
import LandingHero from "@/components/landing/LandingHero";
import PakistanStory from "@/components/landing/PakistanStory";
import PetsForAdoption from "@/components/landing/PetsForAdoption";
import AdoptionFlow from "@/components/landing/AdoptionFlow";
import CommunityShowcase from "@/components/landing/CommunityShowcase";
import GlobalAim from "@/components/landing/GlobalAim";
import OrgFAQ from "@/components/landing/OrgFAQ";
import { getLandingPets } from "@/lib/landingData";
import { ORG_URL } from "@/lib/site";

/**
 * paltuu.org's homepage (PALTU-124). middleware.ts rewrites "/" on the .org
 * host here; direct visits to /lp/* go back to "/".
 *
 * The paltuu.pk page minus everything Pakistan-only (pet care, vets, Vets at
 * Home, blog, city links, PKR, .pk links), plus the Pakistan story and the
 * plan to go worldwide. Its message follows the international business card:
 * "Adopt your new best friend."
 */
export const revalidate = 900;

const TITLE = "Paltuu — Adopt a Pet and Meet Other Pet Parents";
const DESCRIPTION =
    "Paltuu is the pet super app. Adopt a pet from the family or shelter rehoming them, list your own and choose their new home, and meet other pet parents. Free on iOS and Android.";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: { title: TITLE, description: DESCRIPTION, url: ORG_URL, siteName: "Paltuu", type: "website" },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
    alternates: { canonical: ORG_URL },
};

export default async function InternationalHomePage() {
    const pets = await getLandingPets(3);

    return (
        <main className="overflow-hidden bg-white">
            <LandingHero
                eyebrow="The pet super app"
                title={
                    <>
                        Adopt your new <span className="text-primary">best friend</span>
                    </>
                }
                body="Find a pet from a family or shelter rehoming them, or list your own and choose their new home. Free, either way."
                primary={{ label: "Adopt a pet", href: "/browse-pets", cta: "org_hero_browse_pets" }}
                secondary={{ label: "Find your pet the perfect home", href: "/create-listing", cta: "org_hero_list_pet" }}
                tertiary={{ label: "Join the community", href: "/home", cta: "org_hero_community" }}
                appLine="Free on iOS and Android."
            />
            <PakistanStory />
            <PetsForAdoption
                pets={pets}
                tone="white"
                title="Pets looking for a home"
                subtitle="Listed this week. Most are in Pakistan for now, where Paltuu started."
                countrySuffix=", Pakistan"
            />
            <AdoptionFlow />
            <CommunityShowcase />
            <GlobalAim />
            {/* White last: the footer below is maroon with a rounded top edge. */}
            <OrgFAQ />
        </main>
    );
}
