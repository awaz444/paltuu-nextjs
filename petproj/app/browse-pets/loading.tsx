import SkeletonCard from "@/components/SkeletonCard";

// Next.js shows this automatically the instant navigation to /browse-pets
// starts, while page.tsx's blocking DB query (getInitialPets) is still
// running server-side. Without this file the browser shows nothing until
// that query resolves. Mirrors the real layout: FilterSection top bar,
// VerticalSearchBar sidebar, and the pet grid — same positions/sizes as
// BrowsePetsClient so there's no layout shift when real content mounts.

function FilterSectionSkeleton() {
    return (
        <div className="filter-section bg-gray-100 sm:pt-6">
            <div className="bg-white hidden md:block mx-0 md:mx-8 px-6 pt-3 pb-5 w-700 rounded-2xl animate-pulse">
                <div className="md:flex flex-wrap gap-4 items-center">
                    {[1, 2, 3].map((i) => (
                        <div className="flex-1 min-w-[150px]" key={i}>
                            <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                            <div className="h-[46px] bg-gray-200 rounded-xl w-full" />
                        </div>
                    ))}
                    <div className="flex gap-4 mt-5">
                        <div className="h-9 w-20 bg-gray-200 rounded-2xl" />
                        <div className="h-11 w-40 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function VerticalSearchBarSkeleton() {
    return (
        <div className="bg-white shadow-sm p-6 rounded-3xl sticky top-4 animate-pulse">
            {/* Sex */}
            <div className="mb-4">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-11 bg-gray-200 rounded-xl w-full" />
            </div>
            {/* Age range */}
            <div className="mb-4">
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="flex space-x-2">
                    <div className="h-9 bg-gray-200 rounded-xl w-1/2" />
                    <div className="h-9 bg-gray-200 rounded-xl w-1/2" />
                </div>
            </div>
            {/* Checkboxes */}
            <div className="mb-4">
                <div className="h-3 bg-gray-200 rounded w-2/5 mb-2" />
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
            </div>
            {/* Reset button */}
            <div className="h-11 bg-gray-200 rounded-xl w-full mt-4" />
        </div>
    );
}

export default function BrowsePetsLoading() {
    return (
        <div className="fullBody" style={{ maxWidth: "90%", margin: "0 auto" }}>
            <FilterSectionSkeleton />
            <main className="flex min-h-screen flex-col mx-0 md:mx-8 items-center pt-7 bg-gray-100">
                <div className="flex w-full">
                    <div className="w-1/4 mr-4 vertical-search-bar hidden lg:block">
                        <VerticalSearchBarSkeleton />
                    </div>

                    <div className="w-full lg:w-3/4">
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
