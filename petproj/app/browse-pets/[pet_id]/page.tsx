import { Metadata } from "next";
import { notFound } from "next/navigation";
import PetDetailsClient from "./PetDetailsClient";

export const dynamic = "force-dynamic";

async function getPet(petId: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
        const res = await fetch(`${apiUrl}/api/v1/pets/${petId}`, {
            cache: "no-store",
        });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error("Pet SSR fetch error:", e);
        return null;
    }
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
            url: `https://paltuu.pk/browse-pets/${params.pet_id}`,
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
            canonical: `https://paltuu.pk/browse-pets/${params.pet_id}`,
        },
    };
}

export default async function PetPage({
    params,
}: {
    params: { pet_id: string };
}) {
    const pet = await getPet(params.pet_id);

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
              "url": `https://paltuu.pk/browse-pets/${params.pet_id}`,
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
                      "url": "https://paltuu.pk"
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
            <PetDetailsClient params={params} initialPet={pet} />
        </>
    );
}
