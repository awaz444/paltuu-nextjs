/** Skeleton for a blog post, matching app/blogs/[slug]/page.tsx. */
export default function Loading() {
    return (
        <div className="animate-pulse bg-white px-5 pb-20 pt-8 md:pt-12">
            <div className="mx-auto max-w-3xl space-y-4">
                <div className="h-3 w-40 rounded bg-gray-100" />
                <div className="h-7 w-28 rounded-full bg-gray-100" />
                <div className="h-10 w-full rounded-xl bg-gray-200 md:h-12" />
                <div className="h-10 w-3/4 rounded-xl bg-gray-200 md:h-12" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="flex items-center gap-2.5 border-t border-gray-100 pt-5">
                    <div className="h-[38px] w-[38px] rounded-full bg-gray-200" />
                    <div className="h-4 w-36 rounded bg-gray-100" />
                </div>
            </div>
            <div className="mx-auto mt-8 aspect-[1200/630] max-w-5xl rounded-3xl bg-gray-100" />
            <div className="mx-auto mt-10 max-w-3xl space-y-3">
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-2/3 rounded bg-gray-100" />
            </div>
        </div>
    );
}
