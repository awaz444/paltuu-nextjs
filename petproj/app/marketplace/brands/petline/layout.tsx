import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Petline Pet Food Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy Petline dog food and cat food in Pakistan. Quality nutrition for cats and dogs at affordable prices. Shop Petline with nationwide delivery from Paltuu.pk.",
    keywords: [
        "petline pakistan",
        "petline dog food pakistan",
        "petline cat food pakistan",
        "affordable pet food pakistan",
        "dog food online pakistan",
    ],
    openGraph: {
        title: "Petline Pet Food Pakistan | Paltuu.pk",
        description: "Shop Petline cat and dog food with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/petline",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/petline" },
};

export default function PetlineLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
