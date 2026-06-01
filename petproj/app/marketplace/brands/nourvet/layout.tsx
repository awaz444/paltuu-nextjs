import { Metadata } from "next";

export const metadata: Metadata = {
    title: "NourVet Pet Food Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy NourVet veterinary nutrition and pet food in Pakistan. Vet-recommended formulas for cats and dogs. Shop NourVet with nationwide delivery from Paltuu.pk.",
    keywords: [
        "nourvet pakistan",
        "nourvet cat food pakistan",
        "nourvet dog food pakistan",
        "vet recommended cat food pakistan",
        "veterinary pet food pakistan",
    ],
    openGraph: {
        title: "NourVet Pet Food Pakistan | Paltuu.pk",
        description: "Shop NourVet vet-recommended pet nutrition with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/nourvet",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/nourvet" },
};

export default function NourVetLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
