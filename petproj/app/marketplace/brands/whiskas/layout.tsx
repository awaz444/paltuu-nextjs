import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Whiskas Cat Food Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy Whiskas cat food in Pakistan. Wet pouches, dry kibble, and kitten food available online. Shop Whiskas with nationwide delivery from Paltuu.pk.",
    keywords: [
        "whiskas pakistan",
        "whiskas cat food pakistan",
        "buy whiskas pakistan",
        "whiskas kitten food pakistan",
        "cat food pakistan",
        "whiskas wet food pakistan",
        "whiskas karachi",
    ],
    openGraph: {
        title: "Whiskas Cat Food Pakistan | Paltuu.pk",
        description: "Buy Whiskas cat food — wet and dry — with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/whiskas",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/whiskas" },
};

export default function WhiskasLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
