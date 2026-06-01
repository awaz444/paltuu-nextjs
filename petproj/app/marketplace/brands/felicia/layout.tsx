import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Felicia Cat Food Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy Felicia cat food in Pakistan. Complete nutrition for adult cats and kittens. Shop Felicia with nationwide delivery from Paltuu.pk.",
    keywords: [
        "felicia cat food pakistan",
        "buy felicia pakistan",
        "cat food pakistan",
        "felicia kitten food",
        "affordable cat food pakistan",
    ],
    openGraph: {
        title: "Felicia Cat Food Pakistan | Paltuu.pk",
        description: "Buy Felicia cat food with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/felicia",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/felicia" },
};

export default function FeliciaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
