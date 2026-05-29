import { Metadata } from "next";
import { db } from "@/db/index";
import VetDetailsClient from "./VetDetailsClient";

async function getVet(vetId: string) {
    try {
        const vetResult = await db.query(
            `SELECT
                v.vet_id,
                v.user_id,
                v.clinic_id,
                v.minimum_fee,
                v.contact_details,
                v.created_at,
                v.bio,
                v.schedule,
                v.qualifications,
                u.name         AS vet_name,
                u.dob,
                u.email,
                u.profile_image_url,
                cl.name        AS clinic_name,
                cl.address     AS location,
                cl.whatsapp_number AS clinic_whatsapp,
                cl.google_maps_link,
                cl.is_paltuu_partner,
                c.city_name    AS city
            FROM vets v
            JOIN users u  ON v.user_id   = u.user_id
            LEFT JOIN clinics cl ON v.clinic_id  = cl.clinic_id
            LEFT JOIN cities  c  ON u.city_id    = c.city_id
            WHERE v.vet_id = $1 AND v.approved = true`,
            [vetId]
        );

        if (vetResult.rowCount === 0) return null;
        const vet = vetResult.rows[0];

        const reviewsResult = await db.query(
            `SELECT
                vr.review_id,
                vr.rating,
                vr.review_content,
                vr.review_date,
                u.profile_image_url AS review_maker_profile_image_url,
                u.name              AS review_maker_name
            FROM vet_reviews vr
            JOIN users u ON vr.user_id = u.user_id
            WHERE vr.vet_id = $1 AND vr.is_approved = true
            ORDER BY vr.review_date DESC`,
            [vetId]
        );

        return { ...vet, reviews: reviewsResult.rows };
    } catch (e) {
        console.error("Vet SSR fetch error:", e);
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: { "vet-id": string };
}): Promise<Metadata> {
    const vet = await getVet(params["vet-id"]);

    if (!vet) {
        return {
            title: "Vet Not Found | Paltuu.pk",
            description: "Find and connect with trusted veterinarians across Pakistan on Paltuu.pk.",
        };
    }

    const title = `${vet.vet_name} — Vet${vet.city ? ` in ${vet.city}` : ""} | Paltuu.pk`;
    const description = vet.bio
        ? `${vet.bio.slice(0, 150)}…`
        : `Connect with ${vet.vet_name}${vet.clinic_name ? ` at ${vet.clinic_name}` : ""}${vet.city ? ` in ${vet.city}` : ""} on Paltuu.pk — Pakistan's #1 pet care platform.`;

    return {
        title,
        description,
        keywords: [
            "vet pakistan",
            "veterinarian pakistan",
            vet.city ? `vet ${vet.city.toLowerCase()}` : "",
            vet.clinic_name || "",
            "pet care pakistan",
            "paltuu",
        ].filter(Boolean),
        openGraph: {
            title,
            description,
            url: `https://paltuu.pk/pet-care/${params["vet-id"]}`,
            type: "profile",
            images: vet.profile_image_url
                ? [{ url: vet.profile_image_url, width: 400, height: 400, alt: vet.vet_name }]
                : [],
        },
        twitter: {
            card: "summary",
            title,
            description,
            images: vet.profile_image_url ? [vet.profile_image_url] : [],
        },
        alternates: {
            canonical: `https://paltuu.pk/pet-care/${params["vet-id"]}`,
        },
    };
}

export default async function VetPage({
    params,
}: {
    params: { "vet-id": string };
}) {
    const vet = await getVet(params["vet-id"]);

    const vetJsonLd = vet
        ? {
              "@context": "https://schema.org",
              "@type": ["Veterinarian", "MedicalBusiness"],
              "name": vet.vet_name,
              "description": vet.bio || `Veterinarian at ${vet.clinic_name || "a clinic"} in ${vet.city || "Pakistan"}`,
              "image": vet.profile_image_url || undefined,
              "url": `https://paltuu.pk/pet-care/${params["vet-id"]}`,
              "telephone": vet.contact_details || undefined,
              "email": vet.email || undefined,
              "priceRange": vet.minimum_fee ? `PKR ${vet.minimum_fee}+` : "PKR",
              "address": {
                  "@type": "PostalAddress",
                  "streetAddress": vet.location || undefined,
                  "addressLocality": vet.city || undefined,
                  "addressCountry": "PK"
              },
              ...(vet.clinic_name && {
                  "parentOrganization": {
                      "@type": "MedicalClinic",
                      "name": vet.clinic_name,
                      ...(vet.google_maps_link && { "hasMap": vet.google_maps_link })
                  }
              }),
              "knowsAbout": ["Veterinary medicine", "Pet care", "Animal health"],
              "areaServed": {
                  "@type": "City",
                  "name": vet.city || "Pakistan"
              },
              ...(vet.reviews?.length > 0 && {
                  "aggregateRating": {
                      "@type": "AggregateRating",
                      "ratingValue": (
                          vet.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
                          vet.reviews.length
                      ).toFixed(1),
                      "reviewCount": vet.reviews.length,
                      "bestRating": 5,
                      "worstRating": 1
                  }
              })
          }
        : null;

    return (
        <>
            {vetJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(vetJsonLd) }}
                />
            )}
            <VetDetailsClient params={params} initialVet={vet ?? undefined} />
        </>
    );
}
