import { queryClinics } from "@/lib/clinicsQuery";
import PetCareClient from "./PetCareClient";

export const revalidate = 300;

// Matches PetCareClient's default filter state (city: "Karachi", listing_type:
// "all", page 1) so the server-rendered first paint and the client's own
// mount-time fetch return the same data — no visible jump when Redux
// state takes over.
export default async function PetCarePage() {
    const result = await queryClinics({ city: "Karachi", page: 1 });

    const jsonLdItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Vets Near You in Pakistan",
        numberOfItems: result.data.length,
        itemListElement: result.data.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
                "@type": "VeterinaryCare",
                name: c.name,
                url: `https://www.paltuu.pk/pet-care/clinic/${c.slug || c.clinic_id}`,
                ...(c.listing_type === "home_vet"
                    ? { areaServed: { "@type": "City", name: c.coverage_area || c.city || "Pakistan" } }
                    : {
                          address: {
                              "@type": "PostalAddress",
                              streetAddress: c.address,
                              addressLocality: c.city,
                              addressCountry: "PK",
                          },
                      }),
                ...(c.rating
                    ? {
                          aggregateRating: {
                              "@type": "AggregateRating",
                              ratingValue: c.rating,
                              reviewCount: c.total_reviews || 1,
                          },
                      }
                    : {}),
                ...(c.latitude && c.longitude
                    ? { geo: { "@type": "GeoCoordinates", latitude: c.latitude, longitude: c.longitude } }
                    : {}),
            },
        })),
    };

    const jsonLdFaq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "How do I find a vet near me in Pakistan?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Paltuu automatically sorts verified vet clinics and home-visit vets by distance from your location as soon as you allow location access, so the nearest options appear first.",
                },
            },
            {
                "@type": "Question",
                name: "Can I find a home vet near me instead of a clinic?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes — use the Type filter on Paltuu's pet care page to switch between clinics, home-visit vets, or both, ranked by distance and verification status.",
                },
            },
            {
                "@type": "Question",
                name: "Are the vets near me on Paltuu verified?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Paltuu highlights verified vet clinics and home vets first, and you can filter to show verified listings only.",
                },
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdItemList) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
            />
            <PetCareClient
                initialClinics={result.data}
                initialPagination={result.pagination}
                initialCities={result.cities}
            />
        </>
    );
}
