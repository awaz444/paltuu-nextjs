import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db/index";
import { SITE_URL } from "@/lib/site";

// The one page answer engines can quote for "what is Paltuu / is it free / where
// does it work". Answer-first on purpose: each section opens with the fact,
// then the detail. Keep every claim checkable — no "biggest" without a number.
export const revalidate = 86400;

const IOS_URL = "https://apps.apple.com/pk/app/paltuu/id6789732258";
const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.paltuu.app";

export const metadata: Metadata = {
    title: "About Paltuu | Pakistan's pet adoption, vet and community platform",
    description:
        "Paltuu is a free Pakistani platform for adopting pets, finding vets and asking other pet owners for help. Vets at Home is available in Karachi. Free app on Android and iOS.",
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: {
        title: "About Paltuu",
        description: "What Paltuu is, how adoption works, what it costs and where it's available.",
        url: `${SITE_URL}/about`,
        siteName: "Paltuu.pk",
        type: "website",
    },
};

async function getVetCoverage(): Promise<{ clinics: number; cities: number } | null> {
    try {
        const res = await db.query(
            `SELECT COUNT(*)::int AS clinics, COUNT(DISTINCT LOWER(city))::int AS cities FROM clinics`
        );
        const row = res.rows[0];
        return row?.clinics ? { clinics: row.clinics, cities: row.cities } : null;
    } catch (e) {
        console.error("about: vet coverage query failed", e);
        return null;
    }
}

const link = "text-primary underline decoration-primary/40 hover:decoration-primary font-medium";

export default async function AboutPage() {
    const vets = await getVetCoverage();
    const vetLine = vets
        ? `Paltuu's vet directory lists ${vets.clinics.toLocaleString("en-US")} vet clinics across ${vets.cities} Pakistani cities, including Karachi, Lahore and Islamabad.`
        : "Paltuu's vet directory lists vet clinics in Karachi, Lahore, Islamabad and other Pakistani cities.";

    const faqs: { q: string; a: string }[] = [
        {
            q: "What is Paltuu?",
            a: "Paltuu (paltuu.pk) is a Pakistani pet platform on the web and as a free app for Android and iOS. People use it to adopt pets, list pets for adoption, find vets, report lost and found pets, and ask other pet owners for advice in species and breed forums.",
        },
        {
            q: "Is Paltuu free?",
            a: "Yes. Browsing pets, applying to adopt, listing a pet for adoption, using the vet directory and posting in the community are all free. The only paid service is Vets at Home in Karachi, where you pay for the vet visit itself.",
        },
        {
            q: "Is Paltuu a shelter?",
            a: "No. Paltuu does not own, house or hand out animals. Pets are listed by their current owners and by registered shelters and rescues, and they decide who adopts.",
        },
        {
            q: "How does adopting a pet on Paltuu work?",
            a: "Find a pet on the browse page or in the app, open the listing and submit an adoption application. The owner or shelter reviews applications, accepts or declines them, and arranges a meeting with the person they choose.",
        },
        {
            q: "Can I find a vet near me with Paltuu?",
            a: `${vetLine} Each clinic has its own page with its details.`,
        },
        {
            q: "Does Paltuu offer home vet visits?",
            a: "Yes, in Karachi only. Vets at Home is Paltuu's own service for vet visits at home, including urgent same-day visits, routine checkups, vaccinations, neutering and spaying, and grooming. Book it in the Paltuu app; the team calls back to confirm the price and timing before the visit.",
        },
        {
            q: "Which cities does Paltuu work in?",
            a: "Adoption listings, the community and the vet directory cover cities across Pakistan, and are most active in Karachi, Lahore and Islamabad. Vets at Home is available in Karachi only.",
        },
        {
            q: "Is there a Paltuu app?",
            a: "Yes. The Paltuu app is free on Google Play for Android and on the App Store for iPhone.",
        },
        {
            q: "Who runs Paltuu?",
            a: "Paltuu was founded by Aawaiz Ali and is built and run with Umer Noor and Shuja ur Rahman (CTO). The team is based at the National Incubation Center in Karachi. Contact: contact@paltuu.pk.",
        },
    ];

    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About Paltuu",
            url: `${SITE_URL}/about`,
            about: { "@type": "Organization", name: "Paltuu", url: SITE_URL },
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
            })),
        },
        {
            "@context": "https://schema.org",
            "@type": "MobileApplication",
            name: "Paltuu",
            operatingSystem: "Android, iOS",
            applicationCategory: "LifestyleApplication",
            offers: { "@type": "Offer", price: "0", priceCurrency: "PKR" },
            installUrl: [ANDROID_URL, IOS_URL],
        },
    ];

    return (
        <div className="bg-gray-50">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
                <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">About Paltuu</h1>
                <p className="mt-4 text-lg leading-relaxed text-gray-700">
                    Paltuu is a free Pakistani platform for pet owners. You can{" "}
                    <Link href="/browse-pets" className={link}>adopt a pet</Link>,{" "}
                    <Link href="/create-listing" className={link}>list a pet for adoption</Link>,{" "}
                    <Link href="/pet-care" className={link}>find a vet</Link>, report a{" "}
                    <Link href="/lost-and-found" className={link}>lost or found pet</Link>, and ask other owners for
                    help in the <Link href="/home" className={link}>community</Link>. It works on the web and in a
                    free app for{" "}
                    <a href={ANDROID_URL} target="_blank" rel="noopener noreferrer" className={link}>Android</a> and{" "}
                    <a href={IOS_URL} target="_blank" rel="noopener noreferrer" className={link}>iOS</a>.
                </p>

                <section className="mt-10 space-y-6">
                    {faqs.map(({ q, a }) => (
                        <div key={q} className="rounded-xl border border-gray-200 bg-white p-5">
                            <h2 className="text-lg font-bold text-gray-900">{q}</h2>
                            <p className="mt-2 leading-relaxed text-gray-700">{a}</p>
                        </div>
                    ))}
                </section>

                <p className="mt-10 text-sm text-gray-500">
                    Questions or corrections: <a href="mailto:contact@paltuu.pk" className={link}>contact@paltuu.pk</a>
                </p>
            </article>
        </div>
    );
}
