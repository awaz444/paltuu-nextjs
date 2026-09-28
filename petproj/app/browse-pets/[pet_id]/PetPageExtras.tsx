import Image from "next/image";
import Link from "next/link";
import BlogCard from "@/components/blog/BlogCard";
import AppStoreBadges from "@/components/home/AppStoreBadges";
import { APP_SCREENS } from "@/lib/homeContent";
import { getAllBlogsMetadata } from "@/lib/mdx";

type ListingType = "adoption" | "sell" | "shop" | "rescue";

// Blogs about adopting or bringing a pet home are the useful ones on a
// listing page, so they go first; the rest fill in by date.
function pickBlogs(limit: number) {
    const all = getAllBlogsMetadata();
    const matches = all.filter((b) => /adopt/i.test(`${b.slug} ${b.title}`));
    return [...matches, ...all.filter((b) => !matches.includes(b))].slice(0, limit);
}

function getSteps(listingType: ListingType) {
    const buying = listingType === "sell" || listingType === "shop";
    return [
        {
            title: buying ? "Send a request" : "Apply on Paltuu",
            body: buying
                ? `Tap "Buy" above and send a short request. You'll need to be logged in.`
                : `Tap "Apply for Adoption" above and fill in a short form about you and your home.`,
        },
        {
            title: "The lister reviews it",
            body: `They receive your application and accept or decline it. You'll get a notification, and you can track it under My Applications.`,
        },
        {
            title: "Or message them directly",
            body: `Prefer to talk first? Use "Contact" to reach them on WhatsApp and ask anything about the pet.`,
        },
        {
            title: "Meet and bring them home",
            body: buying
                ? "Meet in person, check their health and papers, and agree on the handover."
                : "Meet in person, check their health and vaccination record, and agree on the handover.",
        },
        {
            title: "Share them on the app",
            body: "Give your new pet their own profile on the Paltuu app and post their first days at home.",
        },
    ];
}

const APP_SCREEN_PICKS = ["/app-screens/pet-profile.png", "/app-screens/feed.png", "/app-screens/adopt.png"];

export default function PetPageExtras({
    listingType,
}: {
    listingType: ListingType;
}) {
    const steps = getSteps(listingType);
    const screens = APP_SCREENS.filter((s) => APP_SCREEN_PICKS.includes(s.src));
    const posts = pickBlogs(3);

    return (
        <div className="mt-10 space-y-10 md:mt-14 md:space-y-14">
            {/* How it works */}
            <section aria-labelledby="how-heading">
                <h2 id="how-heading" className="text-lg font-semibold text-gray-900 md:text-xl">
                    How {listingType === "sell" || listingType === "shop" ? "buying" : "adoption"} works on Paltuu
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    Paltuu isn&apos;t a shelter. Pets are listed by their owners and shelters, and you deal with them directly.
                </p>
                <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {steps.map((step, i) => (
                        <li key={step.title} className="rounded-xl border border-gray-200 bg-white p-4">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {i + 1}
                            </span>
                            <h3 className="mt-3 text-sm font-semibold text-gray-900">{step.title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.body}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* App plug */}
            <section
                aria-labelledby="app-plug-heading"
                className="overflow-hidden rounded-xl bg-primary px-5 pt-6 md:px-10 md:pt-10">
                <div className="grid items-end gap-6 md:grid-cols-2 md:gap-10">
                    <div className="pb-2 md:pb-10">
                        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">The Paltuu app</p>
                        <h2 id="app-plug-heading" className="mt-2 text-xl font-bold leading-snug text-white md:text-2xl">
                            Adopted? Give them an account of their own.
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-white/85 md:text-base">
                            Make a profile for your new pet, post their first days at home and tag them in your photos.
                            Adoption listings, vets and clinics are all in the app too.
                        </p>
                        <AppStoreBadges className="mt-5" />
                    </div>
                    <ul className="grid grid-cols-3 gap-3 md:gap-4">
                        {screens.map((screen, i) => (
                            <li
                                key={screen.src}
                                className={`list-none drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)] ${i === 1 ? "-mb-4 md:-mb-8" : "-mb-10 md:-mb-16"}`}>
                                <Image
                                    src={screen.src}
                                    alt={screen.alt}
                                    width={656}
                                    height={1224}
                                    className="block h-auto w-full"
                                    sizes="(max-width: 768px) 30vw, 16vw"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Blogs */}
            {posts.length > 0 && (
                <section aria-labelledby="blogs-heading">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 id="blogs-heading" className="text-lg font-semibold text-gray-900 md:text-xl">
                                Before you bring them home
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">Guides from the Paltuu blog.</p>
                        </div>
                        <Link href="/blogs" className="whitespace-nowrap text-sm font-semibold text-primary hover:underline">
                            All articles →
                        </Link>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
                        {posts.map((post) => (
                            <BlogCard key={post.slug} post={post} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
