import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pedigree Dog Food Pakistan — Buy Online | Paltuu.pk",
    description:
        "Buy Pedigree dog food in Pakistan. Dry kibble, wet food, and treats for adult dogs and puppies. Shop Pedigree online with nationwide delivery from Paltuu.pk.",
    keywords: [
        "pedigree pakistan",
        "pedigree dog food pakistan",
        "buy pedigree pakistan",
        "pedigree puppy food pakistan",
        "dog food pakistan",
        "pedigree karachi",
        "pedigree lahore",
    ],
    openGraph: {
        title: "Pedigree Dog Food Pakistan | Paltuu.pk",
        description: "Buy Pedigree dog food and treats with delivery across Pakistan.",
        url: "https://paltuu.pk/marketplace/brands/pedigree",
        type: "website",
    },
    alternates: { canonical: "https://paltuu.pk/marketplace/brands/pedigree" },
};

export default function PedigreeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
