import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Jungle Pet Food Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy Jungle cat food and dog food in Pakistan. Natural ingredients, complete nutrition for your pets. Shop Jungle pet food with nationwide delivery from Paltuu.pk.",
    keywords: [
        "jungle pet food pakistan",
        "jungle cat food pakistan",
        "jungle dog food pakistan",
        "natural pet food pakistan",
        "buy jungle pakistan",
    ],
    openGraph: {
        title: "Jungle Pet Food Pakistan | Paltuu.pk",
        description: "Shop Jungle natural pet food with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/jungle",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/jungle" },
};

export default function JungleLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
