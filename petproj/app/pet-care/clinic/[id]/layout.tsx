import { Metadata } from "next";
import { getClinicDetail } from "./data";

export async function generateMetadata({
    params,
}: {
    params: { id: string };
}): Promise<Metadata> {
    const c = await getClinicDetail(String(params.id));

    if (!c) {
        return {
            title: "Vet Clinic | Paltuu.pk",
            description: "Find trusted veterinary clinics across Pakistan on Paltuu.pk.",
        };
    }

    const isHomeVet = c.listing_type === "home_vet";
    const title = isHomeVet
        ? `${c.name} — Home Vet${c.city ? ` in ${c.city}` : ""} | Paltuu.pk`
        : `${c.name} — Vet Clinic in ${c.city} | Paltuu.pk`;
    const description = isHomeVet
        ? `${c.name} is a verified home-visit vet service${c.coverage_area ? ` covering ${c.coverage_area}` : ""}${c.city ? ` in ${c.city}, Pakistan` : ""}${c.contact_number ? `. Phone: ${c.contact_number}` : ""}. View vets, availability, and contact info on Paltuu.pk.`
        : `${c.name} is a verified veterinary clinic in ${c.city}, Pakistan. Address: ${c.address}${c.contact_number ? `. Phone: ${c.contact_number}` : ""}. View vets, hours, and contact info on Paltuu.pk.`;
    const canonicalId = c.slug || params.id;

    return {
        title,
        description,
        keywords: [
            c.name.toLowerCase(),
            `${c.name.toLowerCase()} ${c.city?.toLowerCase() ?? ""}`,
            `vet clinic ${c.city?.toLowerCase() ?? ""}`,
            `veterinarian ${c.city?.toLowerCase() ?? ""}`,
            "paltuu",
        ],
        openGraph: {
            title,
            description,
            url: `https://www.paltuu.pk/pet-care/clinic/${canonicalId}`,
            type: "website",
            images: [
                {
                    url: c.logo_url || "https://www.paltuu.pk/paltu_logo.svg",
                    width: 800,
                    height: 400,
                    alt: c.name,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
        alternates: { canonical: `https://www.paltuu.pk/pet-care/clinic/${canonicalId}` },
    };
}

export default async function ClinicDetailLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { id: string };
}) {
    const c = await getClinicDetail(String(params.id));
    const canonicalId = c?.slug || params.id;
    const isHomeVet = c?.listing_type === "home_vet";

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paltuu.pk" },
            { "@type": "ListItem", position: 2, name: "Pet Care", item: "https://www.paltuu.pk/pet-care" },
            {
                "@type": "ListItem",
                position: 3,
                name: c?.city ? `Vets in ${c.city}` : "Clinics",
                item: c?.city
                    ? `https://www.paltuu.pk/pet-care/${c.city.toLowerCase()}`
                    : "https://www.paltuu.pk/pet-care",
            },
            {
                "@type": "ListItem",
                position: 4,
                name: c?.name ?? "Clinic",
                item: `https://www.paltuu.pk/pet-care/clinic/${canonicalId}`,
            },
        ],
    };

    const localBusiness = c
        ? {
              "@context": "https://schema.org",
              "@type": "VeterinaryCare",
              "@id": `https://www.paltuu.pk/pet-care/clinic/${canonicalId}`,
              name: c.name,
              image: c.logo_url || undefined,
              url: `https://www.paltuu.pk/pet-care/clinic/${canonicalId}`,
              telephone: c.contact_number || undefined,
              ...(isHomeVet
                  ? {
                        areaServed: {
                            "@type": "City",
                            name: c.coverage_area || c.city || "Pakistan",
                        },
                    }
                  : {
                        address: {
                            "@type": "PostalAddress",
                            streetAddress: c.address,
                            addressLocality: c.city,
                            addressRegion: c.city,
                            addressCountry: "PK",
                        },
                    }),
              ...(c.latitude && c.longitude
                  ? {
                        geo: {
                            "@type": "GeoCoordinates",
                            latitude: c.latitude,
                            longitude: c.longitude,
                        },
                    }
                  : {}),
              ...(c.rating
                  ? {
                        aggregateRating: {
                            "@type": "AggregateRating",
                            ratingValue: Number(c.rating).toFixed(1),
                            reviewCount: c.total_reviews || 1,
                            bestRating: 5,
                            worstRating: 1,
                        },
                    }
                  : {}),
              ...(c.operating_hours ? { openingHours: c.operating_hours } : {}),
              ...(c.website ? { sameAs: c.website } : {}),
              priceRange: c.discount_details ? "$$" : undefined,
          }
        : null;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
            />
            {localBusiness && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
                />
            )}
            {children}
        </>
    );
}
