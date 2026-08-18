import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Vets Near Me — Find Verified Vet Clinics & Home Vets Near You | Paltuu.pk",
    description:
        "Find the nearest verified vet clinic or home-visit vet near you, automatically sorted by distance. Trusted veterinarians in Karachi, Lahore, Islamabad, and across Pakistan with clinic details, consultation fees, and real patient reviews. Paltuu.pk — Pakistan's #1 pet care platform.",
    keywords: [
        "vets near me",
        "vet near me",
        "veterinarian near me",
        "nearest vet clinic",
        "emergency vet near me",
        "home vet near me",
        "vet pakistan",
        "veterinarian pakistan",
        "vet karachi",
        "vet lahore",
        "vet islamabad",
        "pet doctor pakistan",
        "animal clinic pakistan",
        "pet care pakistan",
        "paltuu",
    ],
    openGraph: {
        title: "Vets Near Me — Find Verified Vet Clinics Near You | Paltuu",
        description:
            "Find the nearest verified vet clinic or home-visit vet near you, sorted by distance. Browse verified veterinarians in Karachi, Lahore, Islamabad, and across Pakistan.",
        url: "https://www.paltuu.pk/pet-care",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Vets Near Me | Paltuu",
        description: "Find the nearest verified vet clinic or home-visit vet near you on Paltuu.pk.",
    },
    alternates: { canonical: "https://www.paltuu.pk/pet-care" },
};

export default function PetCareLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
