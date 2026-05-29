import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Find Vets in Pakistan — Karachi, Lahore & Islamabad | Paltuu.pk",
    description:
        "Connect with trusted, verified veterinarians across Pakistan. Find vets in Karachi, Lahore, and Islamabad with clinic details, consultation fees, and real patient reviews. Paltuu.pk — Pakistan's #1 pet care platform.",
    keywords: [
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
        title: "Find Vets in Pakistan | Paltuu.pk",
        description:
            "Browse verified veterinarians in Karachi, Lahore, and Islamabad. Book consultations and connect with pet doctors across Pakistan.",
        url: "https://paltuu.pk/pet-care",
        type: "website",
        images: [{ url: "https://paltuu.pk/paltu_logo.svg", width: 800, height: 400, alt: "Find Vets in Pakistan — Paltuu.pk" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Find Vets in Pakistan | Paltuu.pk",
        description: "Browse verified vets in Karachi, Lahore, and Islamabad on Paltuu.pk.",
    },
    alternates: { canonical: "https://paltuu.pk/pet-care" },
};

export default function PetCareLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
