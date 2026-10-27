import Link from "next/link";
import AppStoreBadges from "@/components/home/AppStoreBadges";
import { COMMUNITY_SPECIES, type BreedCommunity } from "@/lib/community";

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

/** White band at the top of every community page, matching the adopt landing pages. */
export function CommunityHeader({
    crumbs,
    title,
    intro,
    stat,
}: {
    crumbs: Crumb[];
    title: React.ReactNode;
    intro: string;
    stat?: string;
}) {
    return (
        <section className="bg-white px-6 py-10 md:py-14 lg:px-20">
            <div className="mx-auto max-w-6xl">
                <Breadcrumbs crumbs={crumbs} />
                <h1 className="mb-4 text-3xl font-extrabold text-gray-900 md:text-5xl">{title}</h1>
                <p className="max-w-3xl text-lg text-gray-600">{intro}</p>
                {stat && <p className="mt-4 text-sm font-medium text-primary">{stat}</p>}
            </div>
        </section>
    );
}

/** Species list, plus the breeds of the current species. Desktop sidebar; chips on mobile. */
export function CommunityNav({
    activeSpecies,
    activeBreed,
    breeds = [],
    speciesCounts = {},
}: {
    activeSpecies?: string;
    activeBreed?: string;
    breeds?: BreedCommunity[];
    speciesCounts?: Record<string, number>;
}) {
    const itemClass = (active: boolean) =>
        `flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
            active ? "bg-primary text-white" : "text-gray-700 hover:bg-primary/10 hover:text-primary"
        }`;
    const chipClass = (active: boolean) =>
        `shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
            active ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-gray-700"
        }`;
    const species = COMMUNITY_SPECIES.find((s) => s.slug === activeSpecies);

    return (
        <>
            {/* Mobile: two scrolling chip rows */}
            <div className="min-w-0 space-y-2 lg:hidden">
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                    <Link href="/community" className={chipClass(!activeSpecies)}>All</Link>
                    {COMMUNITY_SPECIES.map((s) => (
                        <Link key={s.slug} href={`/community/${s.slug}`} className={chipClass(s.slug === activeSpecies)}>
                            {s.name}
                        </Link>
                    ))}
                </div>
                {breeds.length > 0 && (
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                        {breeds.map((b) => (
                            <Link
                                key={b.slug}
                                href={`/community/${activeSpecies}/${b.slug}`}
                                className={chipClass(b.slug === activeBreed)}
                            >
                                {b.communityName}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden w-1/4 shrink-0 lg:block">
                <div className="sticky top-24 space-y-4">
                    <div className="rounded-3xl bg-white p-5 shadow-sm">
                        <h2 className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-gray-400">Communities</h2>
                        <ul className="space-y-1">
                            <li>
                                <Link href="/community" className={itemClass(!activeSpecies)}>All posts</Link>
                            </li>
                            {COMMUNITY_SPECIES.map((s) => (
                                <li key={s.slug}>
                                    <Link
                                        href={`/community/${s.slug}`}
                                        className={itemClass(s.slug === activeSpecies && !activeBreed)}
                                    >
                                        <span>{s.name}</span>
                                        {speciesCounts[s.slug] ? (
                                            <span className="text-xs opacity-70">{speciesCounts[s.slug]}</span>
                                        ) : null}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {species && breeds.length > 0 && (
                        <div className="rounded-3xl bg-white p-5 shadow-sm">
                            <h2 className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                                {species.singular} breeds
                            </h2>
                            <ul className="space-y-1">
                                {breeds.map((b) => (
                                    <li key={b.slug}>
                                        <Link
                                            href={`/community/${species.slug}/${b.slug}`}
                                            className={itemClass(b.slug === activeBreed)}
                                        >
                                            <span className="truncate">{b.communityName}</span>
                                            {b.postCount > 0 && <span className="text-xs opacity-70">{b.postCount}</span>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <AppCta compact />
                </div>
            </aside>
        </>
    );
}

/** Posting happens in the app; the web is read-only for now. */
export function AppCta({ compact = false, communityName }: { compact?: boolean; communityName?: string }) {
    return (
        <div className={`rounded-3xl bg-primary text-white shadow-sm ${compact ? "p-5" : "p-6 md:p-8"}`}>
            <h2 className={`font-bold ${compact ? "mb-2 text-base" : "mb-2 text-xl md:text-2xl"}`}>
                {communityName ? `Post in ${communityName}` : "Join the conversation"}
            </h2>
            <p className={`mb-4 text-white/90 ${compact ? "text-sm" : "text-base"}`}>
                Share photos, ask other owners and reply to posts in the free Paltuu app. Tag your pet&apos;s
                profile and your post shows up in its breed community.
            </p>
            <AppStoreBadges />
        </div>
    );
}

export function TopicList({ topics, title }: { topics: string[]; title: string }) {
    if (topics.length === 0) return null;
    return (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-gray-900">{title}</h2>
            <ul className="flex flex-wrap gap-2">
                {topics.map((t) => (
                    <li key={t} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{t}</li>
                ))}
            </ul>
        </div>
    );
}
