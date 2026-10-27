import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { COMMUNITY_SPECIES } from "@/lib/community";

/** A one-line pointer from listings to the community. Static links only. */
export default function CommunityStrip({ className = "" }: { className?: string }) {
    return (
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-white px-4 py-3 shadow-sm ${className}`}>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                <MessagesSquare size={18} className="text-primary" />
                Questions before you adopt? Ask other owners:
            </span>
            {COMMUNITY_SPECIES.slice(0, 3).map((s) => (
                <Link
                    key={s.slug}
                    href={`/${s.slug}`}
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary hover:text-white"
                >
                    {s.name}
                </Link>
            ))}
        </div>
    );
}
