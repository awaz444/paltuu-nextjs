import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Royal Canin Pakistan — Buy Cat & Dog Food Online | Paltuu.pk",
    description:
        "Buy Royal Canin cat food and dog food in Pakistan. Breed-specific and life-stage formulas for cats and dogs. Shop Royal Canin online with nationwide delivery from Paltuu.pk.",
    keywords: [
        "royal canin pakistan",
        "royal canin cat food pakistan",
        "royal canin dog food pakistan",
        "buy royal canin pakistan",
        "royal canin karachi",
        "royal canin lahore",
        "premium cat food pakistan",
    ],
    openGraph: {
        title: "Royal Canin Pakistan | Buy Online | Paltuu.pk",
        description: "Shop Royal Canin cat and dog food with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/royal-canin",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/royal-canin" },
};

export default function RoyalCaninLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
