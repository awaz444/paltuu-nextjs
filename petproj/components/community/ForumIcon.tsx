import { speciesArt, speciesEmoji } from "./forumMeta";

/** A forum's drawing, cropped to a circle by the caller; falls back to its emoji. */
export default function ForumIcon({ speciesSlug, size }: { speciesSlug: string | undefined; size: number }) {
    const art = speciesArt(speciesSlug);
    if (!art) return <span aria-hidden>{speciesEmoji(speciesSlug)}</span>;
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={art} alt="" aria-hidden width={size} height={size} className="h-full w-full rounded-full object-cover" />
    );
}
