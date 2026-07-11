import SkeletonCard, { SidebarSkeleton } from "@/components/SkeletonCard";

// Next.js shows this automatically the instant navigation to /browse-pets
// starts, while page.tsx's blocking DB query (getInitialPets) is still
// running server-side. Without this file the browser shows nothing until
// that query resolves. Shape mirrors BrowsePetsClient's loading state.
export default function BrowsePetsLoading() {
    return (
        <div className="fullBody" style={{ maxWidth: "90%", margin: "0 auto" }}>
            <main className="flex min-h-screen flex-col mx-0 md:mx-8 items-center pt-7 bg-gray-100">
                <div className="flex w-full">
                    <div className="w-1/4 mr-4 hidden lg:block">
                        <SidebarSkeleton />
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
