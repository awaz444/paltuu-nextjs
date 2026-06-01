import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Brit Care Pet Food Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy Brit Care cat food and dog food in Pakistan. Grain-free, high-protein formulas for cats and dogs. Shop Brit Care with nationwide delivery from Paltuu.pk.",
    keywords: [
        "brit care pakistan",
        "brit care cat food pakistan",
        "brit care dog food pakistan",
        "grain free cat food pakistan",
        "premium pet food pakistan",
        "brit care karachi",
    ],
    openGraph: {
        title: "Brit Care Pet Food Pakistan | Paltuu.pk",
        description: "Shop Brit Care grain-free cat and dog food with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/brit-care",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/brit-care" },
};

export default function BritCareLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
