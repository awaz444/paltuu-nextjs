import Link from "next/link";
import { Home } from "lucide-react";
import AppStoreBadges from "@/components/home/AppStoreBadges";
import { COMMUNITY_SPECIES, type BreedCommunity, type CommunityPost } from "@/lib/community";
import FeedPost from "./FeedPost";
import { speciesEmoji } from "./forumMeta";

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
    emoji,
    name,
    parent,
    postCount,
    intro,
}: {
    emoji: string;
    name: string;
    parent?: { name: string; href: string };
    postCount: number;
    intro: string;
}) {
    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="h-14 bg-primary md:h-20" />
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex items-end gap-3 pb-4 md:gap-4">
                    <span
                        aria-hidden
                        className="-mt-8 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-white text-3xl shadow-sm md:-mt-10 md:h-20 md:w-20 md:text-4xl"
                    >
                        {emoji}
                    </span>
                    <div className="min-w-0 pb-1">
                        <h1 className="truncate text-2xl font-extrabold text-gray-900 md:text-3xl">{name}</h1>
                        <p className="text-sm text-gray-500">
                            {parent && (
                                <>
                                    <Link href={parent.href} className="font-medium text-gray-700 hover:underline">{parent.name}</Link>
                                    <span className="mx-1.5" aria-hidden>•</span>
                                </>
                            )}
                            {postCount} {postCount === 1 ? "post" : "posts"}
                        </p>
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
    speciesCounts?: Record<string, number>;
};

/** Mobile: scrolling chips above the feed. */
function ForumChips({ activeSpecies, activeBreed, breeds = [] }: NavProps) {
    const chip = (active: boolean) =>
        `shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
            active ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-gray-700"
        }`;
    return (
        <div className="min-w-0 space-y-2 lg:hidden">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                <Link href="/feed" className={chip(!activeSpecies)}>All</Link>
                {COMMUNITY_SPECIES.map((s) => (
                    <Link key={s.slug} href={`/${s.slug}`} className={chip(s.slug === activeSpecies && !activeBreed)}>
                        {speciesEmoji(s.slug)} {s.name}
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

/** Desktop: forum list on the left, breeds nested under the open species. */
function ForumList({ activeSpecies, activeBreed, breeds = [], speciesCounts = {} }: NavProps) {
    const item = (active: boolean) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            active ? "bg-gray-200 font-semibold text-gray-900" : "text-gray-700 hover:bg-gray-100"
        }`;
    return (
        <nav aria-label="Forums" className="sticky top-24 space-y-1">
            <Link href="/feed" className={item(!activeSpecies)}>
                <Home size={18} /> Feed
            </Link>
            <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Pets</p>
            {COMMUNITY_SPECIES.map((s) => (
                <div key={s.slug}>
                    <Link href={`/${s.slug}`} className={item(s.slug === activeSpecies && !activeBreed)}>
                        <span aria-hidden className="text-base">{speciesEmoji(s.slug)}</span>
                        <span className="flex-1">{s.name}</span>
                        {speciesCounts[s.slug] ? <span className="text-xs text-gray-400">{speciesCounts[s.slug]}</span> : null}
                    </Link>
                    {s.slug === activeSpecies && breeds.length > 0 && (
                        <div className="ml-5 mt-1 space-y-0.5 border-l border-gray-200 pl-2">
                            {breeds.map((b) => (
                                <Link key={b.slug} href={`/${s.slug}/${b.slug}`} className={item(b.slug === activeBreed)}>
                                    <span className="flex-1 truncate">{b.communityName}</span>
                                    {b.postCount > 0 && <span className="text-xs text-gray-400">{b.postCount}</span>}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );
}

/** Three columns on desktop (forums · feed · about), one column with chips on mobile. */
export function CommunityLayout({ nav, aside, children }: { nav: NavProps; aside: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="mx-auto max-w-7xl px-4 py-5 md:py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
                <ForumChips {...nav} />
                <aside className="hidden w-56 shrink-0 lg:block">
                    <ForumList {...nav} />
                </aside>
                <div className="min-w-0 flex-1 lg:max-w-2xl">{children}</div>
                <aside className="hidden w-80 shrink-0 space-y-4 lg:block">{aside}</aside>
            </div>
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

/** Right-hand "About" box, Reddit style. */
export function AboutCard({
    title,
    intro,
    stats,
    topics = [],
    children,
}: {
    title: string;
    intro: string;
    stats?: { label: string; value: string }[];
    topics?: string[];
    children?: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="px-4 py-3">
                <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{intro}</p>
                {stats && stats.length > 0 && (
                    <dl className="mt-3 flex gap-6">
                        {stats.map((s) => (
                            <div key={s.label}>
                                <dt className="sr-only">{s.label}</dt>
                                <dd className="text-base font-bold text-gray-900">{s.value}</dd>
                                <dd className="text-xs text-gray-500">{s.label}</dd>
                            </div>
                        ))}
                    </dl>
                )}
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

/** Posting happens in the app; the web is read-only for now. */
export function AppCta({ compact = false, forumName }: { compact?: boolean; forumName?: string }) {
    return (
        <div className={`rounded-2xl bg-primary text-white ${compact ? "p-4" : "p-5 md:p-6"}`}>
            <h2 className={`font-bold ${compact ? "mb-1.5 text-sm" : "mb-2 text-lg"}`}>
                {forumName ? `Post in ${forumName}` : "Join the conversation"}
            </h2>
            <p className={`mb-3 text-white/90 ${compact ? "text-xs leading-relaxed" : "text-sm"}`}>
                Share photos, ask other owners and reply to posts in the free Paltuu app. Tag your pet&apos;s profile and
                your post shows up in its breed&apos;s forum.
            </p>
            <AppStoreBadges />
        </div>
    );
}
