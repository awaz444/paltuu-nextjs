/** paltuu.org FAQ, with its own FAQPage JSON-LD. Nothing Pakistan-only. */

const FAQS = [
    {
        q: "Is Paltuu only in Pakistan?",
        a: "Paltuu started in Pakistan, and most listings are there today. The app and the community are open to pet parents everywhere.",
    },
    {
        q: "Does Paltuu take in or sell pets?",
        a: "No. Paltuu is a platform, not a shelter. Owners and shelters list pets, and you talk to them directly. Paltuu never takes custody of an animal.",
    },
    {
        q: "Is it free to adopt or list a pet?",
        a: "Yes. Browsing, applying and listing a pet for adoption are all free.",
    },
    {
        q: "Is the app available in my country?",
        a: "Paltuu is free on the App Store and Google Play. If it isn't in your country's store yet, you can still adopt and list on the website.",
    },
];

export default function OrgFAQ() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    };

    return (
        <section aria-labelledby="faq-heading" className="bg-white px-5 py-12 md:py-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div className="mx-auto max-w-3xl">
                <h2 id="faq-heading" className="mb-5 text-xl font-semibold text-gray-900 md:text-[28px]">
                    Questions
                </h2>
                <div className="space-y-2">
                    {FAQS.map(({ q, a }, i) => (
                        <details key={q} open={i === 0} className="group rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
                            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
                                {q}
                                <span className="ml-4 shrink-0 text-2xl leading-none text-primary transition-transform group-open:rotate-45">+</span>
                            </summary>
                            <p className="mt-3 text-sm leading-relaxed text-gray-600">{a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
