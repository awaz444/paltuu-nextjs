import { Metadata } from "next";

export const metadata: Metadata = {
    title: "ProChoice Pet Food Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy ProChoice dog food and cat food in Pakistan. Premium locally-made pet nutrition formulated for Pakistan's climate. Shop with nationwide delivery from Paltuu.pk.",
    keywords: [
        "prochoice pakistan",
        "prochoice dog food pakistan",
        "prochoice cat food pakistan",
        "local pet food pakistan",
        "prochoice puppy food",
        "best dog food pakistan",
    ],
    openGraph: {
        title: "ProChoice Pet Food Pakistan | Paltuu.pk",
        description: "Buy ProChoice premium pet food — made for Pakistan — with nationwide delivery.",
        url: "https://paltuu.pk/marketplace/brands/prochoice",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/prochoice" },
};

export default function ProChoiceLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
