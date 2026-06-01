import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Fluff N Bluff Pet Products Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy Fluff N Bluff pet products in Pakistan. Premium grooming, accessories, and nutrition for cats and dogs. Shop with nationwide delivery from Paltuu.pk.",
    keywords: [
        "fluff n bluff pakistan",
        "fluff n bluff pet products",
        "premium pet products pakistan",
        "pet grooming pakistan",
        "buy fluff n bluff pakistan",
    ],
    openGraph: {
        title: "Fluff N Bluff Pet Products Pakistan | Paltuu.pk",
        description: "Shop Fluff N Bluff premium pet products with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/fluff-n-bluff",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/fluff-n-bluff" },
};

export default function FluffNBluffLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
