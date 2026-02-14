export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-montserrat animate-pulse">
            {/* Hero Skeleton */}
            <div className="bg-white py-16 px-6 lg:px-20 border-b border-gray-100">
                <div className="max-w-6xl mx-auto text-center space-y-4">
                    <div className="h-4 bg-gray-200 w-32 mx-auto rounded"></div>
                    <div className="h-12 bg-gray-200 w-3/4 md:w-1/2 mx-auto rounded"></div>
                    <div className="h-4 bg-gray-200 w-full md:w-2/3 mx-auto rounded"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                {/* Filter Skeleton */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex gap-2 w-full overflow-hidden">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-10 w-24 bg-gray-200 rounded-full flex-shrink-0"></div>
                        ))}
                    </div>
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-transparent overflow-hidden h-96 flex flex-col">
                            <div className="h-48 bg-gray-200 w-full relative">
                                <div className="absolute top-4 left-4 h-6 w-20 bg-gray-300 rounded-full"></div>
                            </div>
                            <div className="p-6 flex flex-col flex-grow space-y-4">
                                <div className="flex gap-2">
                                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-6 w-full bg-gray-200 rounded"></div>
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                                <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                                <div className="mt-auto h-4 w-24 bg-gray-200 rounded self-end"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
