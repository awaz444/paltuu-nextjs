/**
 * Skeleton card — animates pulse in the same shape as pet/clinic cards.
 * variant="pet"    — square image + 3 text lines (Browse Pets & Lost & Found)
 * variant="clinic" — square image + 3 text lines + button (Pet Care)
 */
const SkeletonCard = ({ variant = "pet" }: { variant?: "pet" | "clinic" }) => (
    <div className="bg-white pr-3 pl-3 pt-3 rounded-3xl shadow-sm animate-pulse">
        {/* Image placeholder */}
        <div className="aspect-square rounded-2xl bg-gray-200" />

        {/* Text placeholders */}
        <div className="p-4 space-y-2">
            <div className="h-5 bg-gray-200 rounded-lg w-2/3" />
            <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
            <div className="h-4 bg-gray-200 rounded-lg w-2/5" />
            {variant === "clinic" && (
                <div className="h-9 bg-gray-200 rounded-xl mt-3 w-full" />
            )}
        </div>
    </div>
);

/**
 * Sidebar skeleton — matches VerticalSearchBar / LostAndFoundVerticalFilter shape.
 */
export const SidebarSkeleton = () => (
    <div className="bg-white shadow-sm p-6 rounded-3xl animate-pulse space-y-5">
        {[1, 2, 3].map((i) => (
            <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-10 bg-gray-200 rounded-xl w-full" />
            </div>
        ))}
        <div className="h-10 bg-gray-200 rounded-xl w-full mt-2" />
    </div>
);

/**
 * Map skeleton — placeholder rectangle while Leaflet boots.
 */
export const MapSkeleton = () => (
    <div className="rounded-3xl bg-gray-200 animate-pulse" style={{ height: "350px" }} />
);

export default SkeletonCard;
