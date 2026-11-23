import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { mentionPattern, type MentionRef } from "@/lib/mentionText";

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

/** URLs in a run of plain text turned into links. */
function linkUrls(text: string, linkClassName: string, keyBase: string): ReactNode[] {
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
                <Link key={`${keyBase}u${start}`} href={`${url.pathname}${url.search}${url.hash}`} className={className}>
                    {display}
                </Link>
            ) : (
                <a key={`${keyBase}u${start}`} href={url.href} target="_blank" rel="nofollow ugc noopener noreferrer" className={className}>
                    {display}
                </a>
            )
        );
        last = start + display.length;
    }

    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

/**
 * Renders user-written text with URLs turned into links. Paltuu links stay in
 * the tab; other sites open in a new one and are marked as user content.
 * `mentions` (from the stored content) turns "@name" into a link to that
 * person's profile; pets have no web profile, so their name is only coloured.
 * Pass `linkClassName` "relative z-10" inside cards that use a full-card overlay link.
 */
export default function LinkifiedText({
    text,
    linkClassName = "",
    mentions,
}: {
    text: string;
    linkClassName?: string;
    mentions?: MentionRef[];
}) {
    const re = mentions?.length ? mentionPattern(mentions) : null;
    if (!re) {
        const parts = linkUrls(text, linkClassName, "");
        return parts.length === 1 && typeof parts[0] === "string" ? <>{text}</> : <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
    }

    const byName = new Map(mentions!.map((m) => [m.name, m]));
    const parts: ReactNode[] = [];
    let last = 0;
    for (const match of Array.from(text.matchAll(re))) {
        const at = (match.index ?? 0) + match[1].length;
        const m = byName.get(match[2]);
        if (!m) continue;
        if (at > last) parts.push(...linkUrls(text.slice(last, at), linkClassName, `t${last}`));
        parts.push(
            m.type === "user" ? (
                <Link key={`m${at}`} href={`/profile/${m.id}`} className={`font-medium text-primary hover:underline ${linkClassName}`}>
                    @{m.name}
                </Link>
            ) : (
                <span key={`m${at}`} className="font-medium text-primary">
                    @{m.name}
                </span>
            )
        );
        last = at + 1 + m.name.length;
    }
    if (last < text.length) parts.push(...linkUrls(text.slice(last), linkClassName, `t${last}`));
    return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}
