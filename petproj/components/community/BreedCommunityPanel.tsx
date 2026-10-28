import Link from "next/link";
import { postPath, postTitle, type PetCommunity } from "@/lib/community";
import Avatar from "./Avatar";
import ForumIcon from "./ForumIcon";

/** A forum link with the species drawing, like the forum list in the community sidebar. */
function ForumChip({ speciesSlug, name, href }: { speciesSlug: string; name: string; href: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-sm font-medium text-gray-800 hover:border-primary hover:text-primary"
        >
            <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
                <ForumIcon speciesSlug={speciesSlug} size={28} />
            </span>
            {name}
        </Link>
    );
}

/**
 * Pet page panel: links to the pet's species and breed forums, and a few recent
 * posts from the closest one (breed, else species). Renders nothing if the
 * pet's species has no community.
 */
export default function BreedCommunityPanel({ community }: { community: PetCommunity | null }) {
    if (!community) return null;

    return (
        <section aria-labelledby="breed-community-heading" className="mt-10 rounded-xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span aria-hidden className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-200">
                        <ForumIcon speciesSlug={community.species.slug} size={48} />
                    </span>
                <div className="min-w-0">
                    <h2 id="breed-community-heading" className="text-lg font-bold text-gray-900">
                        {community.name} on Paltuu
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        {community.postCount > 0
                            ? `See what ${community.name === community.speciesName ? `${community.speciesName.toLowerCase()} owners` : `${community.name} owners`} are sharing and asking on Paltuu.`
                            : `Ask other ${community.speciesName.toLowerCase()} owners on Paltuu before you bring this pet home.`}
                    </p>
                </div>
                </div>
                <Link
                    href={community.href}
                    className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                    Open forum →
                </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <ForumChip speciesSlug={community.species.slug} name={community.species.name} href={community.species.href} />
                {community.breed && (
                    <ForumChip speciesSlug={community.species.slug} name={community.breed.name} href={community.breed.href} />
                )}
            </div>

            {community.posts.length > 0 && (
                <ul className="mt-5 divide-y divide-gray-100">
                    {community.posts.map((post) => {
                        const cover = post.media[0] ? post.media[0].thumb || post.media[0].url : null;
                        return (
                            <li key={post.id}>
                                <Link href={postPath(post)} className="group flex items-center gap-3 py-3">
                                    {cover ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={cover} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
                                    ) : (
                                        <Avatar src={post.author.avatar} name={post.author.name} size={56} />
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary">
                                            {postTitle(post)}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">
                                            {post.author.name} · {post.likeCount} likes · {post.commentCount} replies
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
