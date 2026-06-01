import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pet Food Brands in Pakistan — Royal Canin, Pedigree, Whiskas & More | Paltuu.pk",
    description:
        "Shop all major pet food brands available in Pakistan. Royal Canin, Pedigree, Whiskas, Brit Care, ProChoice, Gourmet and more — with nationwide delivery from Paltuu.pk.",
    keywords: [
        "pet food brands pakistan",
        "royal canin pakistan",
        "pedigree pakistan",
        "whiskas pakistan",
        "cat food brands pakistan",
        "dog food brands pakistan",
        "pet food online pakistan",
        "paltuu",
    ],
    openGraph: {
        title: "Pet Food Brands in Pakistan | Paltuu.pk",
        description: "Shop Royal Canin, Pedigree, Whiskas and all major pet food brands with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands" },
};

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
