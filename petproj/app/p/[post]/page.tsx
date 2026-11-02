import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { format } from "date-fns";
import { BadgeCheck } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import {
    renderMentions,
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
import { AppCta, Breadcrumbs, Feed, JsonLd, type Crumb } from "@/components/community/CommunityChrome";
import Avatar from "@/components/community/Avatar";
import LinkifiedText from "@/components/community/LinkifiedText";
import PostActions from "@/components/community/PostActions";
import MobileActions from "@/components/community/MobileActions";
import { PostThreadProvider } from "@/components/community/PostThreadContext";
import PostComments from "@/components/community/PostComments";

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

export default async function PostPage({ params }: { params: { post: string } }) {
    const post = await loadPost(params.post);
    if (!post) notFound();

    const canonicalPath = postPath(post);
    if (`/p/${params.post}` !== canonicalPath) permanentRedirect(canonicalPath);

    const place = primaryPlace(post);
    const species = place ? findSpecies(place.species) : undefined;
    const breedSpecies = place?.breedSlug ? species : undefined;
    const [comments, related] = await Promise.all([
        getCommunityComments(post.id),
        listCommunityPosts({ excludePostId: post.id, limit: 3, species: species?.slug }),
    ]);

    const title = postTitle(post);
    const crumbs: Crumb[] = [
        { name: "Home", href: "/home" },
        ...(breedSpecies ? [{ name: breedSpecies.name, href: `/${breedSpecies.slug}` }] : []),
        ...(place ? [{ name: placeLabel(place), href: placeHref(place) }] : []),
        { name: title.length > 40 ? `${title.slice(0, 37)}…` : title },
    ];
    const body = postBody(post);
    // When the title is the post's own first line, show it as the heading; a made-up title ("Photo by …") stays for screen readers only.
    const titleFromText = Boolean(post.content) && body !== post.content;

    return (
        <main className="min-h-screen bg-gray-100">
            <JsonLd data={postJsonLd(post, comments, place ? { name: placeLabel(place), path: placeHref(place) } : undefined)} />
            <JsonLd data={breadcrumbJsonLd(crumbs, canonicalPath)} />

            <div className="mx-auto max-w-2xl px-4 py-6">
                <Breadcrumbs crumbs={crumbs} />

                <PostThreadProvider
                    postId={post.id}
                    path={canonicalPath}
                    postAuthor={post.author}
                    postExcerpt={renderMentions(post.content)}
                    initialComments={comments}
                    initialCommentCount={post.commentCount}
                >
                    <article className="-mx-4 border-y border-gray-200 bg-white sm:mx-0 sm:overflow-hidden sm:rounded-2xl sm:border">
                        <div className="flex gap-3 px-4 pb-3 pt-4">
                            <Avatar src={post.author.avatar} name={post.author.name} size={44} />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
                                    <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                                        {post.author.name}
                                        {post.author.verified && <BadgeCheck size={15} className="text-primary" aria-label="Verified" />}
                                    </span>
                                    {place && (
                                        <>
                                            <span className="text-gray-300" aria-hidden>›</span>
                                            <Link href={placeHref(place)} className="font-medium text-gray-600 hover:text-primary hover:underline">
                                                {placeLabel(place)}
                                            </Link>
                                        </>
                                    )}
                                    <span className="text-gray-300" aria-hidden>·</span>
                                    <time dateTime={post.createdAt} className="text-gray-400">
                                        {format(new Date(post.createdAt), "d MMM yyyy")}
                                    </time>
                                </div>
                                {post.author.username && <p className="text-xs text-gray-400">@{post.author.username}</p>}

                                {titleFromText ? (
                                    <h1 className="mt-2 text-lg font-semibold leading-snug text-gray-900">{title}</h1>
                                ) : (
                                    <h1 className="sr-only">{title}</h1>
                                )}
                                {body && (
                                    <p className="mt-1 whitespace-pre-line break-words text-[15px] leading-relaxed text-gray-800"><LinkifiedText text={body} /></p>
                                )}

                                {post.media.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {post.media.map((m, i) =>
                                            m.type === "video" ? (
                                                <video
                                                    key={m.url}
                                                    controls
                                                    playsInline
                                                    preload="metadata"
                                                    poster={m.thumb ?? undefined}
                                                    src={m.url}
                                                    className="max-h-[75vh] w-full rounded-xl border border-gray-200 bg-black"
                                                />
                                            ) : (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    key={m.url}
                                                    src={m.url}
                                                    alt={post.media.length > 1 ? `${title} (photo ${i + 1})` : title}
                                                    className="block max-h-[75vh] w-auto max-w-full rounded-xl border border-gray-200 object-contain"
                                                    loading={i === 0 ? "eager" : "lazy"}
                                                />
                                            )
                                        )}
                                    </div>
                                )}

                                <div className="mt-3">
                                    <PostActions
                                        postId={post.id}
                                        author={post.author}
                                        excerpt={renderMentions(post.content)}
                                        likes={post.likeCount}
                                        comments={post.commentCount}
                                        reposts={post.repostCount}
                                        path={canonicalPath}
                                        title={title}
                                    />
                                </div>
                            </div>
                        </div>

                        <PostComments />
                    </article>
                </PostThreadProvider>

                <div className="mt-6">
                    <AppCta />
                </div>

                {related.length > 0 && (
                    <section aria-labelledby="related-heading" className="mt-10">
                        <h2 id="related-heading" className="mb-3 text-sm font-semibold text-gray-700">
                            {species ? `More in ${species.name}` : "More on Paltuu"}
                        </h2>
                        <Feed posts={related} empty={{ title: "", body: "" }} />
                    </section>
                )}
            </div>
            <MobileActions />
        </main>
    );
}
