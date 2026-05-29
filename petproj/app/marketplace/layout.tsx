import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pet Products in Pakistan — Cat Food, Dog Food & Accessories | Paltuu.pk",
    description:
        "Browse premium pet products in Pakistan. Shop cat food, dog food, cat litter, pet accessories, grooming essentials and toys with nationwide delivery. Paltuu.pk — Pakistan's pet marketplace.",
    keywords: [
        "pet products pakistan",
        "cat food pakistan",
        "dog food pakistan",
        "cat litter pakistan",
        "pet accessories pakistan",
        "pet food online pakistan",
        "dog food online pakistan",
        "royal canin pakistan",
        "paltuu",
        "paltuu bazaar",
    ],
    openGraph: {
        title: "Pet Products in Pakistan | Cat Food, Dog Food & More | Paltuu.pk",
        description:
            "Shop cat food, dog food, litter, and pet accessories with nationwide delivery in Pakistan.",
        url: "https://paltuu.pk/marketplace",
        type: "website",
        images: [{ url: "https://paltuu.pk/paltu_logo.svg", width: 800, height: 400, alt: "Pet Products — Paltuu.pk" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Pet Products in Pakistan | Paltuu.pk",
        description: "Shop cat food, dog food, and pet accessories with nationwide delivery.",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace" },
};

export default function MarketplaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
