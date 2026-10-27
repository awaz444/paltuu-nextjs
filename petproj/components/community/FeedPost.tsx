import Link from "next/link";
import { Play } from "lucide-react";
import {
    findSpecies,
    placeHref,
    placeLabel,
    postBody,
    postPath,
    postTitle,
    primaryPlace,
    type CommunityPost,
} from "@/lib/community";
import { speciesEmoji } from "./forumMeta";
import Avatar from "./Avatar";
import PostActions from "./PostActions";

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
    const place = showForum ? primaryPlace(post) : null;
    const title = postTitle(post);
    const body = postBody(post);
    // A made-up title ("Photo by …") isn't shown; the post's own first line is.
    const titleFromText = Boolean(post.content) && body !== post.content;

    return (
        <article className="relative px-4 py-3 transition-colors hover:bg-gray-50">
            <Link href={postPath(post)} className="absolute inset-0" aria-label={title} />

            <div className="flex min-w-0 items-center gap-2 text-xs text-gray-500">
                {place ? (
                    <>
                        <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm">
                            {speciesEmoji(findSpecies(place.species)?.slug)}
                        </span>
                        <Link href={placeHref(place)} className="relative z-10 truncate font-semibold text-gray-900 hover:underline">
                            {placeLabel(place)}
                        </Link>
                        <span aria-hidden>•</span>
                        <span className="truncate">{post.author.name}</span>
                    </>
                ) : (
                    <>
                        <Avatar src={post.author.avatar} name={post.author.name} size={24} />
                        <span className="truncate font-semibold text-gray-900">{post.author.name}</span>
                    </>
                )}
                <span aria-hidden>•</span>
                <time dateTime={post.createdAt} className="shrink-0">{shortAge(post.createdAt)}</time>
            </div>

            {titleFromText && <h3 className="mt-1.5 text-lg font-semibold leading-snug text-gray-900">{title}</h3>}
            {(titleFromText ? body : post.content) && (
                <p className="mt-1 line-clamp-3 whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">
                    {titleFromText ? body : post.content}
                </p>
            )}

            {cover && (
                <div className="relative mt-2.5 overflow-hidden rounded-xl border border-gray-200 bg-gray-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt={title} className="mx-auto block max-h-[520px] w-full object-contain" loading="lazy" />
                    {first?.type === "video" && (
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="rounded-full bg-black/60 p-4 text-white">
                                <Play size={22} fill="currentColor" />
                            </span>
                        </span>
                    )}
                    {post.media.length > 1 && (
                        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                            1/{post.media.length}
                        </span>
                    )}
                </div>
            )}

            <div className="mt-2.5">
                <PostActions
                    likes={post.likeCount}
                    comments={post.commentCount}
                    reposts={post.repostCount}
                    path={postPath(post)}
                    title={title}
                />
            </div>
        </article>
    );
}
