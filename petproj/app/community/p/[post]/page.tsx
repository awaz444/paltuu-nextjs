import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { format } from "date-fns";
import { BadgeCheck, Heart, MessageCircle } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import {
    getCommunityComments,
    getCommunityPost,
    isIndexablePost,
    listCommunityPosts,
    parsePostParam,
    placeHref,
    placeLabel,
    postBody,
    postPath,
    postTitle,
    primaryPlace,
    findSpecies,
    type CommunityComment,
    type CommunityPost,
} from "@/lib/community";
import { breadcrumbJsonLd, postJsonLd } from "@/lib/communitySeo";
import { AppCta, Breadcrumbs, JsonLd, type Crumb } from "@/components/community/CommunityChrome";
import Avatar from "@/components/community/Avatar";
import PostGrid from "@/components/community/PostGrid";

export const revalidate = 600;
export const dynamicParams = true;

// No posts are prebuilt; each is rendered on first visit and then cached for `revalidate`.
export async function generateStaticParams() {
    return [];
}

// generateMetadata and the page both need the post; cache() makes it one query per request.
const loadPost = cache(async (param: string) => {
    const id = parsePostParam(param);
    return id ? getCommunityPost(id) : null;
});

function excerpt(post: CommunityPost): string {
    const text = post.content.replace(/\s+/g, " ").trim();
    if (text) return text.length > 155 ? `${text.slice(0, 152).trimEnd()}…` : text;
    return `${postTitle(post)} on the Paltuu community.`;
}

export async function generateMetadata({ params }: { params: { post: string } }): Promise<Metadata> {
    const post = await loadPost(params.post);
    if (!post) return { title: "Post not found", robots: { index: false, follow: false } };

    const title = postTitle(post);
    const description = excerpt(post);
    const url = `${SITE_URL}${postPath(post)}`;
    const image = post.media[0] ? post.media[0].thumb || post.media[0].url : undefined;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: "article",
            siteName: "Paltuu.pk",
            publishedTime: post.createdAt,
            ...(image ? { images: [{ url: image }] } : {}),
        },
        twitter: { card: image ? "summary_large_image" : "summary", title, description, ...(image ? { images: [image] } : {}) },
        robots: isIndexablePost(post) ? undefined : { index: false, follow: true },
    };
}

function AuthorLine({ author, date }: { author: CommunityPost["author"]; date: string }) {
    return (
        <div className="flex items-center gap-3">
            <Avatar src={author.avatar} name={author.name} size={40} />
            <div className="min-w-0">
                <p className="flex items-center gap-1 truncate font-semibold text-gray-900">
                    {author.name}
                    {author.verified && <BadgeCheck size={16} className="shrink-0 text-primary" aria-label="Verified" />}
                </p>
                <p className="text-xs text-gray-500">
                    {author.username && <span>@{author.username} · </span>}
                    <time dateTime={date}>{format(new Date(date), "d MMM yyyy")}</time>
                </p>
            </div>
        </div>
    );
}

function Comment({ c, isReply = false }: { c: CommunityComment; isReply?: boolean }) {
    return (
        <li className={isReply ? "ml-10 mt-3" : "border-t border-gray-100 py-4 first:border-t-0"}>
            <div className="flex gap-3">
                <Avatar src={c.author.avatar} name={c.author.name} size={isReply ? 28 : 32} />
                <div className="min-w-0 flex-1">
                    <p className="text-sm">
                        <span className="font-semibold text-gray-900">{c.author.name}</span>{" "}
                        <time dateTime={c.createdAt} className="text-xs text-gray-400">
                            {format(new Date(c.createdAt), "d MMM yyyy")}
                        </time>
                    </p>
                    <p className="mt-0.5 whitespace-pre-line break-words text-sm text-gray-700">{c.content}</p>
                    {c.likeCount > 0 && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400">
                            <Heart size={12} /> {c.likeCount}
                        </p>
                    )}
                </div>
            </div>
            {c.replies.length > 0 && (
                <ul>
                    {c.replies.map((r) => (
                        <Comment key={r.id} c={r} isReply />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default async function CommunityPostPage({ params }: { params: { post: string } }) {
    const post = await loadPost(params.post);
    if (!post) notFound();

    const canonicalPath = postPath(post);
    if (`/community/p/${params.post}` !== canonicalPath) permanentRedirect(canonicalPath);

    const place = primaryPlace(post);
    const species = place ? findSpecies(place.species) : undefined;
    const breedSpecies = place?.breedSlug ? species : undefined;
    const [comments, related] = await Promise.all([
        getCommunityComments(post.id),
        listCommunityPosts({ excludePostId: post.id, limit: 3, species: species?.slug }),
    ]);

    const title = postTitle(post);
    const crumbs: Crumb[] = [
        { name: "Home", href: "/" },
        { name: "Community", href: "/community" },
        ...(breedSpecies ? [{ name: breedSpecies.name, href: `/community/${breedSpecies.slug}` }] : []),
        ...(place ? [{ name: placeLabel(place), href: placeHref(place) }] : []),
        { name: title.length > 40 ? `${title.slice(0, 37)}…` : title },
    ];
    const visibleComments = comments.reduce((n, c) => n + 1 + c.replies.length, 0);

    return (
        <main className="bg-gray-100">
            <JsonLd data={postJsonLd(post, comments, place ? { name: placeLabel(place), path: placeHref(place) } : undefined)} />
            <JsonLd data={breadcrumbJsonLd(crumbs, canonicalPath)} />

            <div className="mx-auto max-w-3xl px-4 py-8">
                <Breadcrumbs crumbs={crumbs} />

                <article className="overflow-hidden rounded-3xl bg-white shadow-sm">
                    <div className="p-5 md:p-7">
                        <AuthorLine author={post.author} date={post.createdAt} />
                        <h1 className="mt-5 text-2xl font-extrabold leading-snug text-gray-900 md:text-3xl">{title}</h1>
                        {postBody(post) && (
                            <p className="mt-3 whitespace-pre-line break-words text-base leading-relaxed text-gray-700">
                                {postBody(post)}
                            </p>
                        )}
                    </div>

                    {post.media.length > 0 && (
                        <div className="space-y-2 bg-gray-50">
                            {post.media.map((m, i) =>
                                m.type === "video" ? (
                                    <video
                                        key={m.url}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        poster={m.thumb ?? undefined}
                                        src={m.url}
                                        className="max-h-[80vh] w-full bg-black"
                                    />
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        key={m.url}
                                        src={m.url}
                                        alt={post.media.length > 1 ? `${title} (photo ${i + 1})` : title}
                                        className="max-h-[80vh] w-full object-contain"
                                        loading={i === 0 ? "eager" : "lazy"}
                                    />
                                )
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-5 border-t border-gray-100 px-5 py-4 text-sm text-gray-500 md:px-7">
                        <span className="inline-flex items-center gap-1.5">
                            <Heart size={16} /> {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MessageCircle size={16} /> {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
                        </span>
                        {place && (
                            <Link
                                href={placeHref(place)}
                                className="ml-auto rounded-full bg-primary/10 px-3 py-1 font-medium text-primary hover:bg-primary hover:text-white"
                            >
                                {placeLabel(place)}
                            </Link>
                        )}
                    </div>
                </article>

                <section aria-labelledby="comments-heading" className="mt-6 rounded-3xl bg-white p-5 shadow-sm md:p-7">
                    <h2 id="comments-heading" className="mb-2 text-lg font-bold text-gray-900">
                        {visibleComments > 0 ? `Replies (${visibleComments})` : "Replies"}
                    </h2>
                    {comments.length > 0 ? (
                        <ul>
                            {comments.map((c) => (
                                <Comment key={c.id} c={c} />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No replies yet. Be the first to reply in the Paltuu app.</p>
                    )}
                </section>

                <div className="mt-6">
                    <AppCta communityName={place ? placeLabel(place) : undefined} />
                </div>

                {related.length > 0 && (
                    <section aria-labelledby="related-heading" className="mt-10">
                        <h2 id="related-heading" className="mb-4 text-xl font-bold text-gray-900">
                            {species ? `More from the ${species.name} community` : "More from the community"}
                        </h2>
                        <PostGrid posts={related} emptyTitle="" emptyBody="" />
                    </section>
                )}
            </div>
        </main>
    );
}
