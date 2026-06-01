import { Metadata } from "next";

export const metadata: Metadata = {
    title: "La Mito Pet Products Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy La Mito pet products in Pakistan. Premium pet care, accessories, and nutrition for your cats and dogs. Shop La Mito with nationwide delivery from Paltuu.pk.",
    keywords: [
        "la mito pakistan",
        "la mito pet products pakistan",
        "premium pet accessories pakistan",
        "buy la mito pakistan",
        "cat accessories pakistan",
    ],
    openGraph: {
        title: "La Mito Pet Products Pakistan | Paltuu.pk",
        description: "Shop La Mito premium pet products with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/la-mito",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/la-mito" },
};

export default function LaMitoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
