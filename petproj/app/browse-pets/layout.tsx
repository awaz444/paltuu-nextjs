import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Adopt Pets in Pakistan — Dogs, Cats & More | Paltuu.pk",
    description:
        "Browse pets available for adoption in Pakistan. Find dogs, cats, and other animals from verified shelters and trusted owners in Karachi, Lahore, Islamabad and across Pakistan. Paltuu.pk — Pakistan's #1 pet adoption platform.",
    keywords: [
        "pet adoption pakistan",
        "adopt dog pakistan",
        "adopt cat pakistan",
        "pets for adoption karachi",
        "pets for adoption lahore",
        "pets for adoption islamabad",
        "adopt pets online pakistan",
        "paltuu",
        "paltu",
    ],
    openGraph: {
        title: "Adopt Pets in Pakistan — Dogs, Cats & More | Paltuu.pk",
        description:
            "Find dogs, cats and other pets for adoption from verified shelters and owners across Pakistan.",
        url: "https://paltuu.pk/browse-pets",
        type: "website",
        images: [{ url: "https://paltuu.pk/paltu_logo.svg", width: 800, height: 400, alt: "Paltuu — Adopt Pets in Pakistan" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Adopt Pets in Pakistan | Paltuu.pk",
        description: "Find pets for adoption from verified shelters and owners across Pakistan.",
    },
    alternates: { canonical: "https://paltuu.pk/browse-pets" },
};

export default function BrowsePetsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
