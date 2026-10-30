import { Fragment, type ReactNode } from "react";
import Link from "next/link";

// http(s) URLs, bare www. hosts, and bare paltuu.pk links.
const URL_RE = /\b(?:https?:\/\/|www\.|paltuu\.pk\/)[^\s<]+/gi;
const TRAILING_PUNCTUATION = /[.,!?;:'"\]]+$/;
const PALTUU_HOSTS = new Set(["paltuu.pk", "www.paltuu.pk"]);

/** Drop sentence punctuation that follows a URL, and a closing paren the URL didn't open. */
function trimUrl(raw: string): string {
    let url = raw;
    for (;;) {
        const next = url.replace(TRAILING_PUNCTUATION, "");
        const unbalancedParen = next.endsWith(")") && (next.match(/\(/g)?.length ?? 0) < (next.match(/\)/g)?.length ?? 0);
        const trimmed = unbalancedParen ? next.slice(0, -1) : next;
        if (trimmed === url) return url;
        url = trimmed;
    }
}

/** Absolute http(s) URL for the matched text, or null if it isn't a safe link. */
function toUrl(text: string): URL | null {
    try {
        const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
        return url.protocol === "http:" || url.protocol === "https:" ? url : null;
    } catch {
        return null;
    }
}

/**
 * Renders user-written text with URLs turned into links. Paltuu links stay in
 * the tab; other sites open in a new one and are marked as user content.
 * Pass `linkClassName` "relative z-10" inside cards that use a full-card overlay link.
 */
export default function LinkifiedText({ text, linkClassName = "" }: { text: string; linkClassName?: string }) {
    const parts: ReactNode[] = [];
    let last = 0;

    for (const match of Array.from(text.matchAll(URL_RE))) {
        const start = match.index ?? 0;
        const display = trimUrl(match[0]);
        const url = toUrl(display);
        if (!url) continue;

        if (start > last) parts.push(text.slice(last, start));
        const className = `text-primary underline underline-offset-2 [overflow-wrap:anywhere] hover:opacity-80 ${linkClassName}`;
        parts.push(
            PALTUU_HOSTS.has(url.hostname.toLowerCase()) ? (
                <Link key={start} href={`${url.pathname}${url.search}${url.hash}`} className={className}>
                    {display}
                </Link>
            ) : (
                <a key={start} href={url.href} target="_blank" rel="nofollow ugc noopener noreferrer" className={className}>
                    {display}
                </a>
            )
        );
        last = start + display.length;
    }

    if (last === 0) return <>{text}</>;
    if (last < text.length) parts.push(text.slice(last));
    return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}
