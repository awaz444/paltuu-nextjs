import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Rescue Pets in Pakistan — Adopt or Foster Animals in Need",
    description:
        "Help rescue animals across Pakistan. Browse rescue pets from verified shelters — adopt a dog or cat in need, or offer to foster. Paltuu.pk connects you with rescue organizations in Karachi, Lahore, and Islamabad.",
    keywords: [
        "rescue pets pakistan",
        "adopt rescue dog pakistan",
        "rescue cats pakistan",
        "animal shelter pakistan",
        "foster pets pakistan",
        "rescue animals karachi",
        "rescue animals lahore",
        "paltuu",
    ],
    openGraph: {
        title: "Rescue Pets in Pakistan | Paltuu",
        description:
            "Adopt or foster rescue animals from verified shelters across Pakistan. Give a rescued pet a loving home.",
        url: "https://www.paltuu.pk/rescue-pets",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Rescue Pets in Pakistan | Paltuu",
        description: "Adopt or foster rescue animals from verified shelters across Pakistan.",
    },
    alternates: { canonical: "https://www.paltuu.pk/rescue-pets" },
};

export default function RescuePetsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
