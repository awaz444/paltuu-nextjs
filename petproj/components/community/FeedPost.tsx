import Link from "@/components/Link";
import AuthorLink from "./AuthorLink";
import {
    renderMentions,
    findSpecies,
    placeHref,
    placeLabel,
    postBody,
    postPath,
    postTitle,
    primaryPlace,
    type CommunityPost,
} from "@/lib/community";
import { feedFrameRatio } from "@/lib/mediaFrame";
import ForumIcon from "./ForumIcon";
import { forumArtKey } from "./forumMeta";
import Avatar from "./Avatar";
import LinkifiedText from "./LinkifiedText";
import PostActions from "./PostActions";
import PostVideo from "./PostVideo";

// Tallest a media frame gets. On phones the width runs out first; on wider
// screens a tall frame narrows instead of growing past this (kept in step
// with the 520px in the unknown-size classes below).
const FRAME_MAX_H = 520;

/** "4m", "3h", "2d", "5w", "3mo", "1y". */
function shortAge(iso: string): string {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    const m = s / 60;
    if (m < 60) return `${Math.floor(m)}m ago`;
    const h = m / 60;
    if (h < 24) return `${Math.floor(h)}h ago`;
    const d = h / 24;
    if (d < 7) return `${Math.floor(d)}d ago`;
    if (d < 30) return `${Math.floor(d / 7)}w ago`;
    if (d < 365) return `${Math.floor(d / 30)}mo ago`;
    return `${Math.floor(d / 365)}y ago`;
}

/**
 * One post in the feed, Reddit style: forum and age on top, the title (the
 * post's first line), a text preview, full-width media and counts. Rows are
 * separated by the list's dividers, not drawn as cards. The whole row opens
 * the post; the forum link sits above that.
 */
export default function FeedPost({ post, showForum = true }: { post: CommunityPost; showForum?: boolean }) {
    const first = post.media[0];
    const cover = first ? (first.type === "video" ? first.thumb : first.url) : null;
    const ratio = first ? feedFrameRatio(first.w, first.h) : null;
    const place = showForum ? primaryPlace(post) : null;
    const title = postTitle(post);
    const body = postBody(post);
    // A made-up title ("Photo by …") isn't shown; the post's own first line is.
    const titleFromText = Boolean(post.content) && body !== post.content;

    return (
        <article className="relative px-4 py-3 transition-colors hover:bg-gray-50">
            <Link href={postPath(post)} className="absolute inset-0" aria-label={title} />

            <div className="flex gap-3">
                {/* Phones: thread layout, author avatar in its own column. */}
                <div className="shrink-0 sm:hidden">
                    <AuthorLink id={post.author.id} className="relative z-10 block">
                        <Avatar src={post.author.avatar} name={post.author.name} size={40} />
                    </AuthorLink>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5 text-sm sm:hidden">
                        <AuthorLink id={post.author.id} className="relative z-10 truncate font-semibold text-gray-900 hover:underline">{post.author.name}</AuthorLink>
                        {place && (
                            <>
                                <span className="text-gray-300" aria-hidden>›</span>
                                <Link href={placeHref(place)} className="relative z-10 truncate text-gray-500 hover:underline">
                                    {placeLabel(place)}
                                </Link>
                            </>
                        )}
                        <time dateTime={post.createdAt} className="ml-auto shrink-0 pl-2 text-xs text-gray-400">{shortAge(post.createdAt)}</time>
                    </div>

                    {/* Larger screens: author first, then the forum the post
                        landed in, same order as phones (PALTU-187). */}
                    <div className="hidden min-w-0 items-center gap-2 text-xs text-gray-500 sm:flex">
                        <AuthorLink id={post.author.id} className="relative z-10 shrink-0">
                            <Avatar src={post.author.avatar} name={post.author.name} size={24} />
                        </AuthorLink>
                        <AuthorLink id={post.author.id} className="relative z-10 truncate font-semibold text-gray-900 hover:underline">{post.author.name}</AuthorLink>
                        {place && (
                            <>
                                <span className="text-gray-300" aria-hidden>›</span>
                                <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                    <ForumIcon speciesSlug={forumArtKey(findSpecies(place.species)?.slug, place.breedSlug)} size={20} />
                                </span>
                                <Link href={placeHref(place)} className="relative z-10 truncate hover:underline">
                                    {placeLabel(place)}
                                </Link>
                            </>
                        )}
                        <span aria-hidden>•</span>
                        <time dateTime={post.createdAt} className="shrink-0">{shortAge(post.createdAt)}</time>
                    </div>

                    {titleFromText && <h3 className="mt-1 text-[15px] font-normal leading-snug text-gray-900 sm:mt-1.5 sm:text-base">{title}</h3>}
                    {(titleFromText ? body : post.content) && (
                        <p className="mt-1 line-clamp-3 whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">
                            <LinkifiedText text={titleFromText ? body : post.content} linkClassName="relative z-10" mentions={post.mentions} />
                        </p>
                    )}

                    {/* The frame takes the media's own shape, 4:5 to 16:9, and the
                        media fills it: no letterbox bars (PALTU-159). Size known:
                        the frame is drawn before the image loads. Not known yet:
                        the image sets its own height, clamped to the same range
                        against the frame's width (cqw). */}
                    {first?.type === "video" ? (
                        // A real player, above the row's link so pressing
                        // play doesn't open the post (PALTU-188).
                        <div
                            className="relative z-10 mt-2.5 overflow-hidden rounded-xl border border-gray-200 bg-black"
                            style={ratio ? { aspectRatio: String(ratio), maxWidth: Math.round(FRAME_MAX_H * ratio) } : { maxWidth: FRAME_MAX_H }}
                        >
                            <PostVideo
                                media={first}
                                className={ratio ? "absolute inset-0 h-full w-full object-cover" : "block h-auto max-h-[520px] w-full"}
                            />
                            {post.media.length > 1 && (
                                <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                                    1/{post.media.length}
                                </span>
                            )}
                        </div>
                    ) : cover && (
                        <div
                            className={`relative mt-2.5 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 ${ratio ? "" : "[container-type:inline-size]"}`}
                            style={ratio ? { aspectRatio: String(ratio), maxWidth: Math.round(FRAME_MAX_H * ratio) } : undefined}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={cover}
                                alt={title}
                                className={
                                    ratio
                                        ? "absolute inset-0 h-full w-full object-cover"
                                        : "block h-auto max-h-[min(125cqw,520px)] min-h-[56.25cqw] w-full object-cover"
                                }
                                loading="lazy"
                            />
                            {post.media.length > 1 && (
                                <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                                    1/{post.media.length}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="mt-2.5">
                        <PostActions
                            postId={post.id}
                            author={post.author}
                            excerpt={renderMentions(post.content)}
                            likes={post.likeCount}
                            comments={post.commentCount}
                            reposts={post.repostCount}
                            path={postPath(post)}
                            title={title}
                        />
                    </div>
                </div>
            </div>
        </article>
    );
}
