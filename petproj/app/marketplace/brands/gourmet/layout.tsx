import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gourmet Cat Food Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy Gourmet cat food in Pakistan. Premium wet cat food with rich flavours for picky eaters. Shop Gourmet Pearl, Gold and more with nationwide delivery from Paltuu.pk.",
    keywords: [
        "gourmet cat food pakistan",
        "gourmet pearl pakistan",
        "buy gourmet pakistan",
        "premium cat food pakistan",
        "wet cat food pakistan",
        "gourmet gold pakistan",
    ],
    openGraph: {
        title: "Gourmet Cat Food Pakistan | Paltuu.pk",
        description: "Buy Gourmet premium wet cat food with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/gourmet",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/gourmet" },
};

export default function GourmetLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
