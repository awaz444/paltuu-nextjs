import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Paltuu — Pakistan's First Pet Adoption & Care Platform",
    description:
        "Learn about Paltuu.pk — Pakistan's first and largest pet adoption and care platform. Our mission is to connect every pet with a loving home and make pet care accessible across Pakistan.",
    keywords: [
        "paltuu",
        "paltu",
        "paltuu.pk",
        "about paltuu",
        "pet adoption pakistan",
        "pakistan pet platform",
        "pet community pakistan",
        "paltuu mission",
    ],
    openGraph: {
        title: "About Paltuu | Pakistan's First Pet Adoption & Care Platform",
        description:
            "Paltuu.pk — Pakistan's first pet adoption and care platform, connecting pets with loving homes since day one.",
        url: "https://paltuu.pk/about-us",
        type: "website",
        images: [{ url: "https://paltuu.pk/paltu_logo.svg", width: 800, height: 400, alt: "About Paltuu.pk" }],
    },
    twitter: {
        card: "summary",
        title: "About Paltuu | Pakistan's First Pet Platform",
        description: "Paltuu.pk — connecting pets with loving homes across Pakistan.",
    },
    alternates: { canonical: "https://paltuu.pk/about-us" },
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
