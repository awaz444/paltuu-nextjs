import HomeJsonLd from "@/components/home/HomeJsonLd";
import CityKeywordLinks from "@/components/home/CityKeywordLinks";
import HomepageFAQ from "@/components/HomepageFAQ";
import AppPromoBanner from "@/components/AppPromoBanner";
import { getLandingPets, getLandingPosts, getTopClinics, getVetCityCounts } from "@/lib/landingData";
import { VETS_AT_HOME } from "@/lib/homeContent";
import LandingHero from "./LandingHero";
import VetsAtHomeShowcase from "./VetsAtHomeShowcase";
import VetsAtHomeCard from "./VetsAtHomeCard";
import PetsForAdoption from "./PetsForAdoption";
import AdoptionFlow from "./AdoptionFlow";
import VetsNearYou from "./VetsNearYou";
import Reviews from "./Reviews";
import Guides from "./Guides";
import PeekingStickers from "./PeekingStickers";

/**
 * paltuu.pk's "/". Two versions of one page, picked in middleware.ts from the
 * visitor's IP city (Vercel's x-vercel-ip-city), so both stay static:
 * - Karachi (app/lp/karachi): Vets at Home is the second section, in their face.
 * - Everyone else (app/page.tsx): Vets at Home sits in the vets section,
 *   marked Karachi only.
 *
 * Phone first. Background rhythm W · (W) · P · G · W · P · G · W · W: first and
 * last are white because the navbar above and the footer below are maroon with
 * rounded edges. Never hardcode the maroon: use bg-primary (ApplyThemeColor
 * re-themes it per role).
 */
export default async function PakistanLanding({ karachi = false }: { karachi?: boolean }) {
    const city = VETS_AT_HOME.city;
    const [pets, vetCounts, clinics] = await Promise.all([
        getLandingPets(3, karachi ? city : undefined),
        getVetCityCounts(),
        karachi ? getTopClinics(city, 3) : Promise.resolve(undefined),
    ]);
    const posts = getLandingPosts(3);
    const cityCount = vetCounts.find((c) => c.city === city)?.count ?? 0;

    return (
        <main className="relative overflow-hidden bg-white">
            <HomeJsonLd />
            <PeekingStickers />

            <LandingHero
                eyebrow="Adopt · Rehome · Vets · Community"
                title={
                    <>
                        Pakistan&apos;s first <span className="text-primary">pet super app</span>
                    </>
                }
                body="Find a pet from a family or shelter rehoming them, or list your own and choose their new home. Free, either way."
                primary={{ label: "Adopt a pet", href: "/browse-pets", cta: "home_hero_browse_pets" }}
                secondary={{ label: "List your pet for adoption", href: "/create-listing", cta: "home_hero_list_pet" }}
                tertiary={{ label: "Find a vet near you", href: "/pet-care", cta: "home_action_pet_care" }}
                appLine="The whole community lives in the Paltuu app."
            />

            {karachi && <VetsAtHomeShowcase />}

            <PetsForAdoption
                pets={pets}
                title={karachi ? `Pets looking for a home in ${city}` : "Pets looking for a home"}
                subtitle={karachi ? "Listed this week by owners and shelters." : "Listed this week by owners and shelters across Pakistan."}
                chips={
                    karachi
                        ? [
                              { label: `Cats in ${city}`, href: "/adopt/cats/karachi" },
                              { label: `Dogs in ${city}`, href: "/adopt/dogs/karachi" },
                              { label: `All pets in ${city}`, href: "/adopt/karachi" },
                          ]
                        : [
                              { label: "Cats", href: "/adopt/cats" },
                              { label: "Dogs", href: "/adopt/dogs" },
                              { label: "Karachi", href: "/adopt/karachi" },
                              { label: "Lahore", href: "/adopt/lahore" },
                              { label: "Islamabad", href: "/adopt/islamabad" },
                          ]
                }
            />

            <AdoptionFlow />

            {karachi ? (
                <VetsNearYou
                    subtitle={`${cityCount > 0 ? `${cityCount} verified clinics` : "Verified clinics"} in ${city}. Direct contact, no booking fees.`}
                    clinics={clinics}
                    city={city}
                />
            ) : (
                <VetsNearYou subtitle="Verified clinics and animal hospitals. Direct contact, no booking fees." cities={vetCounts}>
                    <VetsAtHomeCard />
                </VetsNearYou>
            )}

            <Reviews subtitle="From people who adopted, rehomed and booked on Paltuu." />
            <Guides posts={posts} />
            <HomepageFAQ />

            {/* White last: the footer below is maroon with a rounded top edge. */}
            <CityKeywordLinks />

            <AppPromoBanner />
        </main>
    );
}
