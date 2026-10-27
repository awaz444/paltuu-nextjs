import Link from "next/link";
import AppStoreBadges from "@/components/home/AppStoreBadges";
import { COMMUNITY_SPECIES, type BreedCommunity, type CommunityPost } from "@/lib/community";
import { VETS_AT_HOME } from "@/lib/homeContent";
import FeedPost from "./FeedPost";
import MobileActions from "./MobileActions";
import ForumIcon from "./ForumIcon";

export type Crumb = { name: string; href?: string };

export function JsonLd({ data }: { data: object }) {
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
            {crumbs.map((c, i) => (
                <span key={`${c.name}-${i}`}>
                    {i > 0 && <span className="mx-2">/</span>}
                    {c.href ? (
                        <Link href={c.href} className="hover:text-primary">{c.name}</Link>
                    ) : (
                        <span className="text-gray-700">{c.name}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}

/** Forum banner: a short colour band, the forum's icon and name. Only on species and breed pages. */
export function ForumHeader({
    speciesSlug,
    name,
    parent,
    intro,
}: {
    speciesSlug: string;
    name: string;
    parent?: { name: string; href: string };
    intro: string;
}) {
    return (
        <header className="border-b border-gray-200 bg-white">
            {/* Starts 1rem up, behind the navbar, so the navbar's rounded corners sit on maroon instead of white. */}
            <div className="hidden h-24 -mt-4 bg-primary md:block" />
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex items-center gap-3 pb-4 pt-4 md:items-end md:gap-4 md:pt-3">
                    <span
                        aria-hidden
                        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white text-2xl md:-mt-14 md:h-20 md:w-20 md:border-4 md:border-white md:text-4xl md:shadow-sm"
                    >
                        <ForumIcon speciesSlug={speciesSlug} size={80} />
                    </span>
                    <div className="min-w-0 pb-1">
                        <h1 className="truncate text-2xl font-extrabold text-gray-900 md:text-3xl">{name}</h1>
                        {parent && (
                            <p className="text-sm text-gray-500">
                                <Link href={parent.href} className="font-medium text-gray-700 hover:underline">{parent.name}</Link>
                            </p>
                        )}
                    </div>
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-gray-600 lg:hidden">{intro}</p>
            </div>
        </header>
    );
}

type NavProps = {
    activeSpecies?: string;
    activeBreed?: string;
    breeds?: BreedCommunity[];
};

/** Mobile: scrolling chips above the posts. */
function ForumChips({ activeSpecies, activeBreed, breeds = [] }: NavProps) {
    const chip = (active: boolean) =>
        `shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
            active ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-gray-700"
        }`;
    return (
        <div className="min-w-0 space-y-2 lg:hidden">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                <Link href="/home" className={chip(!activeSpecies)}>Home</Link>
                {COMMUNITY_SPECIES.map((s) => (
                    <Link key={s.slug} href={`/${s.slug}`} className={chip(s.slug === activeSpecies && !activeBreed)}>
                        {s.name}
                    </Link>
                ))}
            </div>
            {breeds.length > 0 && (
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                    {breeds.map((b) => (
                        <Link key={b.slug} href={`/${activeSpecies}/${b.slug}`} className={chip(b.slug === activeBreed)}>
                            {b.communityName}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Desktop left column: the forums, with breeds nested under the open species. */
function ForumList({ activeSpecies, activeBreed, breeds = [] }: NavProps) {
    const item = (active: boolean) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            active ? "bg-gray-200 font-semibold text-gray-900" : "text-gray-700 hover:bg-gray-100"
        }`;
    return (
        <nav aria-label="Forums" className="sticky top-4 max-h-[calc(100vh-2rem)] space-y-1 overflow-y-auto pb-4">
            <Link href="/home" className={item(!activeSpecies)}>
                {/* Same home icon as the app's tab bar (paltuu-reactnative/assets/icons). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/icons/social/home-${!activeSpecies ? "select" : "unselect"}.svg`} alt="" aria-hidden width={18} height={18} className="h-[18px] w-[18px]" /> Home
            </Link>
            <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Pets</p>
            {COMMUNITY_SPECIES.map((s) => (
                <div key={s.slug}>
                    <Link href={`/${s.slug}`} className={item(s.slug === activeSpecies && !activeBreed)}>
                        <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-base">
                            <ForumIcon speciesSlug={s.slug} size={24} />
                        </span>
                        {s.name}
                    </Link>
                    {s.slug === activeSpecies && breeds.length > 0 && (
                        <div className="ml-5 mt-1 space-y-0.5 border-l border-gray-200 pl-2">
                            {breeds.map((b) => (
                                <Link key={b.slug} href={`/${s.slug}/${b.slug}`} className={item(b.slug === activeBreed)}>
                                    <span className="truncate">{b.communityName}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );
}

/**
 * Three columns on desktop: forums on the left, posts in the middle, the rest
 * of Paltuu on the right. On mobile the forums become chips above the posts
 * and the right column follows them.
 */
export function CommunityLayout({ nav, aside, children }: { nav: NavProps; aside: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="mx-auto max-w-7xl px-4 py-5 md:py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
                <ForumChips {...nav} />
                <aside className="hidden w-56 shrink-0 self-stretch lg:block">
                    <ForumList {...nav} />
                </aside>
                <div className="min-w-0 flex-1 lg:max-w-2xl">{children}</div>
                <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-80 lg:overflow-y-auto lg:pb-4">{aside}</aside>
            </div>
            <MobileActions />
        </div>
    );
}

export function Feed({ posts, showForum = true, empty }: { posts: CommunityPost[]; showForum?: boolean; empty: { title: string; body: string } }) {
    if (posts.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                <div className="mb-3 text-4xl" aria-hidden>🐾</div>
                <h2 className="mb-1 text-base font-bold text-gray-900">{empty.title}</h2>
                <p className="mx-auto max-w-sm text-sm text-gray-500">{empty.body}</p>
            </div>
        );
    }
    return (
        <div className="-mx-4 divide-y divide-gray-200 border-y border-gray-200 bg-white sm:mx-0 sm:overflow-hidden sm:rounded-2xl sm:border">
            {posts.map((p) => (
                <FeedPost key={p.id} post={p} showForum={showForum} />
            ))}
        </div>
    );
}

/** Short description of the forum you're in. */
export function AboutCard({ title, intro, topics = [], children }: { title: string; intro: string; topics?: string[]; children?: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="px-4 py-3">
                <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{intro}</p>
            </div>
            {topics.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-3">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Owners talk about</h3>
                    <ul className="flex flex-wrap gap-1.5">
                        {topics.map((t) => (
                            <li key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">{t}</li>
                        ))}
                    </ul>
                </div>
            )}
            {children && <div className="border-t border-gray-100 px-4 py-3">{children}</div>}
        </div>
    );
}

const FEATURES = [
    { emoji: "🏡", title: "Adopt a pet", body: "Dogs, cats and more, listed by owners and shelters across Pakistan.", href: "/browse-pets" },
    { emoji: "🩺", title: "Find a vet", body: "Vets and clinics near you in Karachi, Lahore, Islamabad and more.", href: "/pet-care" },
    { emoji: "🚗", title: "Vets at Home", body: `A vet at your door in ${VETS_AT_HOME.city}. Book in the Paltuu app.`, href: VETS_AT_HOME.deepLink },
    { emoji: "🔎", title: "Lost & Found", body: "Report a lost pet or help one find its way home.", href: "/lost-and-found" },
    { emoji: "📖", title: "Pet care guides", body: "Food, health and care advice written for Pakistan.", href: "/blogs" },
];

/** The right column: everything else Paltuu does, as link cards. */
export function FeatureCards() {
    return (
        <nav aria-label="More on Paltuu" className="space-y-2">
            {FEATURES.map((f) => (
                <Link
                    key={f.title}
                    href={f.href}
                    className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 transition-colors hover:border-primary"
                >
                    <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
                        {f.emoji}
                    </span>
                    <span className="min-w-0">
                        <span className="block text-sm font-bold text-gray-900">{f.title}</span>
                        <span className="block text-xs leading-relaxed text-gray-500">{f.body}</span>
                    </span>
                </Link>
            ))}
        </nav>
    );
}

/** Posting happens in the app; the web is read-only for now. */
export function AppCta() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="flex flex-wrap items-center gap-1.5 text-base font-bold text-gray-900">
                Download the
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/paltuu%20bilkul%20tight.svg" alt="Paltuu" width={45} height={24} className="h-6 w-auto -translate-y-[3px]" />
                app
            </h2>
            <p className="mb-3 mt-1.5 text-xs leading-relaxed text-gray-600">
                Share photos, ask other owners and reply to posts. Tag your pet&apos;s profile and your post shows up in
                its breed&apos;s forum.
            </p>
            <AppStoreBadges />
        </div>
    );
}
