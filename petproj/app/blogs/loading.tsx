/** Skeleton for /blogs, matching BlogsPageClient: white hero · gray-100 grid. */
export default function Loading() {
    return (
        <div className="animate-pulse bg-white">
            <div className="px-5 pb-10 pt-11 md:pb-14 md:pt-20">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
                    <div className="h-7 w-56 rounded-full bg-gray-100" />
                    <div className="h-10 w-full max-w-xl rounded-xl bg-gray-200 md:h-14" />
                    <div className="h-4 w-full max-w-md rounded bg-gray-100" />
                    <div className="mt-3 h-[54px] w-full max-w-md rounded-2xl bg-gray-100" />
                </div>
            </div>

            <div className="bg-gray-100 px-5 py-12 md:py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-5 h-7 w-44 rounded bg-gray-200" />
                    <div className="mb-6 flex gap-2 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-9 w-24 shrink-0 rounded-full bg-white" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex flex-col rounded-3xl bg-white p-3">
                                <div className="mb-3 aspect-[16/10] w-full rounded-2xl bg-gray-200" />
                                <div className="space-y-2 px-1.5 pb-1.5">
                                    <div className="h-3 w-20 rounded bg-gray-200" />
                                    <div className="h-5 w-full rounded bg-gray-200" />
                                    <div className="h-4 w-2/3 rounded bg-gray-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
