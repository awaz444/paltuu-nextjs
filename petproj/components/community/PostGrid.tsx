import type { CommunityPost } from "@/lib/community";
import PostCard from "./PostCard";

export default function PostGrid({
    posts,
    showPlace = true,
    emptyTitle,
    emptyBody,
}: {
    posts: CommunityPost[];
    showPlace?: boolean;
    emptyTitle: string;
    emptyBody: string;
}) {
    if (posts.length === 0) {
        return (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                <div className="mb-4 text-5xl" aria-hidden>🐾</div>
                <h2 className="mb-2 text-lg font-bold text-gray-900">{emptyTitle}</h2>
                <p className="mx-auto max-w-md text-sm text-gray-500">{emptyBody}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} showPlace={showPlace} />
            ))}
        </div>
    );
}
