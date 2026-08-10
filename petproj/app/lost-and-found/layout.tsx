import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Lost & Found Pets in Pakistan — Report or Find Missing Animals",
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
        title: "Lost & Found Pets in Pakistan | Paltuu",
        description:
            "Report or find lost and missing pets across Pakistan. Help reunite animals with their families.",
        url: "https://www.paltuu.pk/lost-and-found",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Lost & Found Pets in Pakistan | Paltuu",
        description: "Report or find lost pets across Pakistan on Paltuu.pk.",
    },
    alternates: { canonical: "https://www.paltuu.pk/lost-and-found" },
};

export default function LostAndFoundLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
