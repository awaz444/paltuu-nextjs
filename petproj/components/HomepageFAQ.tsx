import Link from "next/link";

const FAQS = [
    {
        q: "Is Paltuu free to use for adopting a pet in Pakistan?",
        a: (
            <>
                Yes. Browsing pets and applying to adopt through{" "}
                <Link href="/browse-pets" className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium">
                    Paltuu's adoption listings
                </Link>{" "}
                is completely free, whether you're adopting from a shelter, rescue, or individual owner.
            </>
        ),
    },
    {
        q: "Which cities in Pakistan does Paltuu serve?",
        a: (
            <>
                Paltuu is most active in Karachi, Lahore, and Islamabad, with growing listings across
                Rawalpindi, Faisalabad, and other cities nationwide. Pet product orders on the{" "}
                <Link href="/marketplace" className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium">
                    marketplace
                </Link>{" "}
                ship across Pakistan.
            </>
        ),
    },
    {
        q: "How do I adopt a dog or cat on Paltuu?",
        a: (
            <>
                Browse{" "}
                <Link href="/browse-pets" className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium">
                    pets available for adoption
                </Link>
                , message the shelter or owner directly, and arrange to meet the pet before bringing them
                home. Verified shelters and rescue partners are marked on each listing.
            </>
        ),
    },
    {
        q: "Can I find a verified vet near me on Paltuu?",
        a: (
            <>
                Yes.{" "}
                <Link href="/pet-care" className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium">
                    Paltuu's vet directory
                </Link>{" "}
                lists verified veterinarians in Karachi, Lahore, and Islamabad with clinic details,
                consultation fees, and patient reviews.
            </>
        ),
    },
    {
        q: "Does Paltuu deliver pet food and products nationwide?",
        a: (
            <>
                Yes. The{" "}
                <Link href="/marketplace" className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium">
                    Paltuu marketplace
                </Link>{" "}
                ships pet food, litter, and accessories from trusted brands like Royal Canin, Pedigree,
                and Whiskas across Pakistan.
            </>
        ),
    },
];

const HomepageFAQ = () => {
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: {
                "@type": "Answer",
                text: nodeToPlainText(a),
            },
        })),
    };

    return (
        <section className="py-16 px-6 lg:px-20 bg-white border-t border-gray-100">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-10 text-center">
                    Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                    {FAQS.map(({ q, a }) => (
                        <details
                            key={q}
                            className="group bg-gray-50 rounded-2xl border border-gray-100 p-6 open:shadow-sm"
                        >
                            <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-gray-900 text-lg">
                                {q}
                                <span className="ml-4 shrink-0 text-primary transition-transform group-open:rotate-45 text-2xl leading-none">
                                    +
                                </span>
                            </summary>
                            <p className="mt-4 text-gray-600 leading-relaxed">{a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Flattens the JSX answer (plain text + <Link> children) into plain text for JSON-LD,
// since schema.org Answer.text must be a string, not markup.
function nodeToPlainText(node: React.ReactNode): string {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(nodeToPlainText).join("");
    if (
        node &&
        typeof node === "object" &&
        "props" in node &&
        (node as any).props?.children
    ) {
        return nodeToPlainText((node as any).props.children);
    }
    return "";
}

export default HomepageFAQ;
