import Link from "next/link";
import type { ReactNode } from "react";

/** A post or comment author's name or photo, linked to their profile. Comments still being sent have no id yet. */
export default function AuthorLink({ id, className, children }: { id?: number; className?: string; children: ReactNode }) {
    if (!id) return <span className={className}>{children}</span>;
    return (
        <Link href={`/profile/${id}`} className={className}>
            {children}
        </Link>
    );
}
