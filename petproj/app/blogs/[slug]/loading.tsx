export default function Loading() {
    return (
        <div className="bg-white min-h-screen pb-20 font-montserrat animate-pulse">
            {/* Top Section - Hero */}
            <div className="h-[400px] md:h-[500px] w-full bg-gray-200"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-8 flex flex-col space-y-6">
                    <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
                    <div className="h-10 w-3/4 bg-gray-300 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    <div className="h-64 w-full bg-gray-200 rounded-xl my-8"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                </div>

                {/* Sidebar */}
                <div className="hidden lg:block lg:col-span-4 space-y-10">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-64 bg-gray-50"></div>
                </div>
            </div>
        </div>
    );
}
