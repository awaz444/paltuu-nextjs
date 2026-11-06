/**
 * Where to send someone after they log in or sign up.
 *
 * Pages that need login send people to /auth?callbackUrl=<where they were>, so
 * that applying for a pet brings them back to that pet instead of /home.
 */

/** Only same-site paths, never another host and never the auth pages themselves. */
export function safeCallbackUrl(raw: string | null | undefined): string | null {
    if (!raw) return null;
    let path: string;
    try {
        path = decodeURIComponent(raw);
    } catch {
        return null;
    }
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return null;
    if (/^\/(auth|login|sign-up)(\/|\?|$)/.test(path)) return null;
    return path;
}

/** Link to the login page that returns to `next` afterwards. */
export function authUrl(next?: string | null): string {
    const path = safeCallbackUrl(next);
    // From the homepage, let /auth pick the usual landing page for their role.
    return path && path !== "/" ? `/auth?callbackUrl=${encodeURIComponent(path)}` : "/auth";
}

/** The current page, for sending people back to it after login. */
export function currentPath(): string {
    if (typeof window === "undefined") return "/";
    return window.location.pathname + window.location.search;
}
