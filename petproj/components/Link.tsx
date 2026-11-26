"use client";

/**
 * Drop-in replacement for `next/link` that prefetches on intent instead of on
 * sight (PALTU-183).
 *
 * Next.js 14 prefetches every <Link> the moment it scrolls into view. With the
 * navbar, footer and card grids on every page that was dozens of background
 * requests per page view, each one a billed Vercel CDN request, most for pages
 * nobody opened. This wrapper turns viewport prefetching off and prefetches
 * when the pointer hovers or a finger touches the link, just before the click,
 * so navigation stays fast.
 *
 * Pass `prefetch` explicitly to get Next's default behaviour back for a link.
 */
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useRef, type ComponentPropsWithoutRef } from "react";

type LinkProps = ComponentPropsWithoutRef<typeof NextLink>;

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
    { prefetch, href, onMouseEnter, onTouchStart, ...rest },
    ref,
) {
    const router = useRouter();
    const prefetched = useRef(false);

    const prefetchOnIntent = () => {
        if (prefetch !== undefined || prefetched.current) return;
        if (typeof href !== "string" || !href.startsWith("/") || href.startsWith("//")) return;
        prefetched.current = true;
        router.prefetch(href);
    };

    return (
        <NextLink
            ref={ref}
            href={href}
            prefetch={prefetch ?? false}
            onMouseEnter={(e) => {
                prefetchOnIntent();
                onMouseEnter?.(e);
            }}
            onTouchStart={(e) => {
                prefetchOnIntent();
                onTouchStart?.(e);
            }}
            {...rest}
        />
    );
});

export default Link;
