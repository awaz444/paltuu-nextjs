import Link from "next/link";
import { getCommunityForListing, postPath, postTitle } from "@/lib/community";
import Avatar from "./Avatar";

/**
 * Pet page panel: the listing's breed community (or species community when the
 * breed isn't known), with a few recent posts. Renders nothing if the pet's
 * species has no community.
 */
export default async function BreedCommunityPanel({ petId }: { petId: number }) {
    const community = await getCommunityForListing(petId);
    if (!community) return null;

    return (
        <section aria-labelledby="breed-community-heading" className="mt-10 rounded-xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id="breed-community-heading" className="text-lg font-bold text-gray-900">
                        {community.name} community
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        {community.postCount > 0
                            ? `See what ${community.name === community.speciesName ? `${community.speciesName.toLowerCase()} owners` : `${community.name} owners`} are sharing and asking on Paltuu.`
                            : `Ask other ${community.speciesName.toLowerCase()} owners on Paltuu before you bring this pet home.`}
                    </p>
                </div>
                <Link
                    href={community.href}
                    className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                    Visit community →
                </Link>
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
