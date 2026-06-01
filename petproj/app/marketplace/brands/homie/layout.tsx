import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Homie Pet Products Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy Homie pet products in Pakistan. Quality pet food, accessories, and care products for cats and dogs. Shop Homie with nationwide delivery from Paltuu.pk.",
    keywords: [
        "homie pet products pakistan",
        "homie pet food pakistan",
        "buy homie pakistan",
        "pet accessories pakistan",
        "affordable pet products pakistan",
    ],
    openGraph: {
        title: "Homie Pet Products Pakistan | Paltuu.pk",
        description: "Shop Homie pet products with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/homie",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/homie" },
};

export default function HomieLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
