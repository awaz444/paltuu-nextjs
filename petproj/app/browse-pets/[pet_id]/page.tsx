import { Metadata } from "next";
import { notFound } from "next/navigation";
import PetDetailsClient from "./PetDetailsClient";
import PetPageExtras from "./PetPageExtras";
import BreedCommunityPanel from "@/components/community/BreedCommunityPanel";
import { getCommunityForListing } from "@/lib/community";
import { getPetDetails } from "@/lib/petDetails";

export const dynamic = "force-dynamic";

// null only when the listing really is gone. The page answers that with a 404,
// so a database blip must not look like one or Google drops live listings:
// getPetDetails throws on database errors.
async function getPet(petId: string) {
    if (!/^\d+$/.test(petId)) return null;
    const pet = await getPetDetails(Number(petId));
    // Same JSON shape the client used to get from the API (dates as strings).
    return pet ? JSON.parse(JSON.stringify(pet)) : null;
}

export async function generateMetadata({
    params,
}: {
    params: { pet_id: string };
}): Promise<Metadata> {
    const pet = await getPet(params.pet_id);

    if (!pet) {
        return {
            title: "Pet Not Found | Paltuu.pk",
            description: "Browse pets available for adoption across Pakistan on Paltuu.pk.",
            robots: { index: false },
        };
    }

    const breed = pet.pet_breed || "Mixed Breed";
    const city = pet.city || "Pakistan";
    const action =
        pet.listing_type === "sell" || pet.listing_type === "shop"
            ? "Buy"
            : "Adopt";

    const title = `${action} ${pet.pet_name} — ${breed} in ${city} | Paltuu.pk`;
    const description = pet.description
        ? `${pet.description.slice(0, 150)}…`
        : `${action} ${pet.pet_name}, a ${breed} in ${city}, Pakistan. Find pets for adoption, rescue, and sale on Paltuu.pk — Pakistan's #1 pet adoption platform.`;

    const firstImage =
        pet.images && pet.images.length > 0
            ? [...pet.images].sort((a: any, b: any) => a.order - b.order)[0]?.image_url
            : null;

    return {
        title,
        description,
        keywords: [
            "pet adoption pakistan",
            `adopt ${breed.toLowerCase()} pakistan`,
            `${breed.toLowerCase()} ${city.toLowerCase()}`,
            "paltuu",
            "pet pakistan",
        ],
        openGraph: {
            title,
            description,
            url: `https://www.paltuu.pk/browse-pets/${params.pet_id}`,
            type: "website",
            images: firstImage
                ? [{ url: firstImage, width: 800, height: 800, alt: `${pet.pet_name} — ${breed}` }]
                : [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: firstImage ? [firstImage] : [],
        },
        alternates: {
            canonical: `https://www.paltuu.pk/browse-pets/${params.pet_id}`,
        },
    };
}

export default async function PetPage({
    params,
}: {
    params: { pet_id: string };
}) {
    const [pet, community] = await Promise.all([
        getPet(params.pet_id),
        getCommunityForListing(Number(params.pet_id)),
    ]);

    if (!pet) {
        notFound();
    }

    const firstImage =
        pet.images?.length > 0
            ? [...pet.images].sort((a: any, b: any) => a.order - b.order)[0]?.image_url
            : null;

    const petJsonLd = {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": `${pet.pet_name} — ${pet.pet_breed || "Mixed Breed"} for ${pet.listing_type === "adoption" || pet.listing_type === "rescue" ? "adoption" : "sale"} in ${pet.city || "Pakistan"}`,
              "description": pet.description || `${pet.pet_name} is a ${pet.pet_breed || "mixed breed"} ${pet.listing_type === "adoption" ? "available for adoption" : "pet"} in ${pet.city || "Pakistan"}, Pakistan.`,
              "image": firstImage ? [firstImage] : [],
              "url": `https://www.paltuu.pk/browse-pets/${params.pet_id}`,
              "offers": {
                  "@type": "Offer",
                  "availability":
                      pet.adoption_status === "available"
                          ? "https://schema.org/InStock"
                          : "https://schema.org/SoldOut",
                  "price": pet.price ?? 0,
                  "priceCurrency": "PKR",
                  "seller": {
                      "@type": "Organization",
                      "name": "Paltuu.pk",
                      "url": "https://www.paltuu.pk"
                  }
              },
              "additionalProperty": [
                  { "@type": "PropertyValue", "name": "Species", "value": pet.pet_type },
                  { "@type": "PropertyValue", "name": "Breed", "value": pet.pet_breed || "Mixed Breed" },
                  { "@type": "PropertyValue", "name": "Sex", "value": pet.sex },
                  { "@type": "PropertyValue", "name": "City", "value": pet.city },
                  { "@type": "PropertyValue", "name": "Vaccinated", "value": pet.vaccinated ? "Yes" : "No" },
              ].filter((p) => p.value),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(petJsonLd) }}
            />
            <PetDetailsClient
                params={params}
                initialPet={pet}
                forums={community ? { species: community.species, breed: community.breed } : null}
                extras={
                    <>
                        <BreedCommunityPanel community={community} />
                        <PetPageExtras listingType={pet.listing_type} />
                    </>
                }
            />
        </>
    );
}
