import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Play } from "lucide-react";
import {
    placeHref,
    placeLabel,
    postPath,
    postBody,
    postTitle,
    primaryPlace,
    type CommunityPost,
} from "@/lib/community";
import Avatar from "./Avatar";

/** One post in a community feed. Server-rendered; the whole card links to the post page. */
export default function PostCard({ post, showPlace = true }: { post: CommunityPost; showPlace?: boolean }) {
    const first = post.media[0];
    const cover = first ? (first.type === "video" ? first.thumb : first.url) : null;
    const place = showPlace ? primaryPlace(post) : null;
    const title = postTitle(post);
    const body = postBody(post);

    return (
        <article className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md">
            {cover && (
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt={title} className="h-full w-full object-cover" loading="lazy" />
                    {first?.type === "video" && (
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="rounded-full bg-black/55 p-3 text-white">
                                <Play size={20} fill="currentColor" />
                            </span>
                        </span>
                    )}
                    {post.media.length > 1 && (
                        <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
                            1/{post.media.length}
                        </span>
                    )}
                </div>
            )}

            <div className="flex flex-1 flex-col p-4">
                <div className="mb-3 flex items-center gap-2.5">
                    <Avatar src={post.author.avatar} name={post.author.name} size={32} />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{post.author.name}</p>
                        <p className="text-xs text-gray-500">
                            <time dateTime={post.createdAt}>
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </time>
                        </p>
                    </div>
                </div>

                <h3 className="mb-1 text-base font-bold leading-snug text-gray-900">
                    <Link href={postPath(post)} className="after:absolute after:inset-0">
                        {title}
                    </Link>
                </h3>
                {body && (
                    <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">{body}</p>
                )}

                <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                        <Heart size={14} /> {post.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <MessageCircle size={14} /> {post.commentCount}
                    </span>
                    {place && (
                        <Link
                            href={placeHref(place)}
                            className="relative z-10 ml-auto truncate rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary hover:bg-primary hover:text-white"
                        >
                            {placeLabel(place)}
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}
