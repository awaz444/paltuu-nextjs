import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Lost & Found Pets in Pakistan — Report or Find Missing Animals | Paltuu.pk",
    description:
        "Help reunite lost pets with their families across Pakistan. Report a missing pet or search for found animals in Karachi, Lahore, Islamabad and beyond. Paltuu.pk — Pakistan's pet community.",
    keywords: [
        "lost pets pakistan",
        "found pets pakistan",
        "missing pet karachi",
        "lost dog pakistan",
        "lost cat pakistan",
        "missing animal pakistan",
        "report lost pet pakistan",
        "paltuu",
    ],
    openGraph: {
        title: "Lost & Found Pets in Pakistan | Paltuu.pk",
        description:
            "Report or find lost and missing pets across Pakistan. Help reunite animals with their families.",
        url: "https://paltuu.pk/lost-and-found",
        type: "website",
        images: [{ url: "https://paltuu.pk/paltu_logo.svg", width: 800, height: 400, alt: "Lost & Found Pets — Paltuu.pk" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Lost & Found Pets in Pakistan | Paltuu.pk",
        description: "Report or find lost pets across Pakistan on Paltuu.pk.",
    },
    alternates: { canonical: "https://paltuu.pk/lost-and-found" },
};

export default function LostAndFoundLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
