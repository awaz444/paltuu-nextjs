/**
 * Product events sent to PostHog from API routes (PALTU-21).
 *
 * These run on the server so they count the same whether the action came from
 * the website or the mobile app. When the website makes the request, posthog-js
 * adds X-POSTHOG-SESSION-ID / X-POSTHOG-DISTINCT-ID (see PostHogTracker), and we
 * forward the session id so the event lands in the visitor's web session and can
 * be tied back to the page they landed on.
 *
 * Events: signup_completed, listing_created, adoption_application_submitted,
 * adoption_application_approved, adoption_application_rejected. The browser
 * sends app_download_click itself.
 *
 * Never throws and never takes longer than CAPTURE_TIMEOUT_MS, so a PostHog
 * outage can't break signups or listings.
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const CAPTURE_TIMEOUT_MS = 1500;

export type ServerEvent =
    | "signup_completed"
    | "listing_created"
    | "adoption_application_submitted"
    | "adoption_application_approved"
    | "adoption_application_rejected";

interface RequestContext {
    client: "app" | "web";
    platform: string | null;
    sessionId: string | null;
    windowId: string | null;
    anonDistinctId: string | null;
}

// Same app-vs-web detection as the register route: the RN app sends x-client /
// x-platform (PALTU-57); older builds are recognised by their user agent.
export function requestContext(req: Request | null | undefined): RequestContext {
    if (!req) return { client: "web", platform: null, sessionId: null, windowId: null, anonDistinctId: null };
    const h = req.headers;
    const userAgent = h.get("user-agent") ?? "";
    const isApp = h.get("x-client")?.toLowerCase() === "app" || /okhttp|darwin|cfnetwork|expo/i.test(userAgent);
    const platform =
        h.get("x-platform")?.toLowerCase() ||
        (isApp ? (/iphone|ipad|ios|darwin/i.test(userAgent) ? "ios" : "android") : null);
    return {
        client: isApp ? "app" : "web",
        platform,
        sessionId: h.get("x-posthog-session-id"),
        windowId: h.get("x-posthog-window-id"),
        anonDistinctId: h.get("x-posthog-distinct-id"),
    };
}

async function send(body: Record<string, unknown>) {
    try {
        await fetch(`${POSTHOG_HOST}/i/v0/e/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: POSTHOG_KEY, ...body }),
            signal: AbortSignal.timeout(CAPTURE_TIMEOUT_MS),
        });
    } catch (err) {
        console.error(`[posthog] ${String(body.event)} not sent:`, err);
    }
}

export async function captureServerEvent(
    event: ServerEvent,
    userId: number | string,
    req: Request | null | undefined,
    properties: Record<string, unknown> = {}
): Promise<void> {
    if (!POSTHOG_KEY) return;
    const ctx = requestContext(req);
    const distinctId = String(userId);

    // A brand-new account made from the website: merge the visitor's anonymous
    // web history into the new user so pre-signup pageviews count for them.
    if (event === "signup_completed" && ctx.anonDistinctId && ctx.anonDistinctId !== distinctId) {
        await send({
            event: "$create_alias",
            distinct_id: distinctId,
            properties: { alias: ctx.anonDistinctId, distinct_id: distinctId },
        });
    }

    await send({
        event,
        distinct_id: distinctId,
        timestamp: new Date().toISOString(),
        properties: {
            ...properties,
            client: ctx.client,
            platform: ctx.platform,
            ...(ctx.sessionId ? { $session_id: ctx.sessionId } : {}),
            ...(ctx.windowId ? { $window_id: ctx.windowId } : {}),
            $lib: "paltuu-server",
        },
    });
}
