import { Metadata } from "next";
import RescuePetClient, { RescuePet } from "./RescuePetClient";

export const dynamic = "force-dynamic";

async function getRescuePet(rescueId: string): Promise<RescuePet | null> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
        const res = await fetch(`${apiUrl}/api/v1/rescue/pets/${rescueId}`, {
            cache: "no-store",
        });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error("Rescue pet SSR fetch error:", e);
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: { rescue_id: string };
}): Promise<Metadata> {
    const pet = await getRescuePet(params.rescue_id);

    if (!pet) {
        return {
            title: "Rescue Pet | Paltuu.pk",
            description: "Browse rescue pets available for adoption across Pakistan on Paltuu.pk.",
        };
    }

    const shelterLocation = pet.shelter?.location || "Pakistan";
    const urgencyPrefix =
        pet.urgency_level === "critical"
            ? "URGENT — "
            : pet.urgency_level === "high"
            ? "Urgent — "
            : "";

    const title = `${urgencyPrefix}Rescue ${pet.pet_name} — ${pet.shelter?.name || "Shelter"} in ${shelterLocation} | Paltuu.pk`;

    const description = (pet.rescue_story || pet.description || "")
        .replace(/\s+/g, " ")
        .slice(0, 155)
        .trim();

    const metaDescription = description
        ? `${description}…`
        : `Help ${pet.pet_name} find a loving home. ${pet.urgency_level === "critical" || pet.urgency_level === "high" ? "Urgent adoption needed. " : ""}Adopt or foster through ${pet.shelter?.name || "a verified shelter"} on Paltuu.pk.`;

    const firstImage = pet.images?.[0] ?? null;

    return {
        title,
        description: metaDescription,
        keywords: [
            "rescue pets pakistan",
            `rescue ${pet.pet_name.toLowerCase()}`,
            "adopt rescue animal pakistan",
            shelterLocation.toLowerCase(),
            "foster pets pakistan",
            "paltuu",
        ],
        openGraph: {
            title,
            description: metaDescription,
            url: `https://paltuu.pk/rescue-pets/${params.rescue_id}`,
            type: "website",
            images: firstImage
                ? [{ url: firstImage, width: 800, height: 600, alt: `${pet.pet_name} — rescue pet in Pakistan` }]
                : [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: metaDescription,
            images: firstImage ? [firstImage] : [],
        },
        alternates: {
            canonical: `https://paltuu.pk/rescue-pets/${params.rescue_id}`,
        },
    };
}

export default async function RescuePetPage({
    params,
}: {
    params: { rescue_id: string };
}) {
    const pet = await getRescuePet(params.rescue_id);
    return <RescuePetClient params={params} initialPet={pet ?? undefined} />;
}
