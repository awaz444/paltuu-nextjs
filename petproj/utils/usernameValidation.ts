/**
 * usernameValidation.ts
 * ---------------------
 * Single source of truth for social_username rules across all API routes.
 *
 * Instagram-compatible rules:
 *  - Allowed characters: a-z, 0-9, _ (underscore), . (period)
 *  - Length: 1–30 characters
 *  - Cannot start or end with a period
 *  - Cannot contain consecutive periods (..)
 *  - Stored and compared case-insensitively (always lowercased before write)
 *
 * Extra platform rules:
 *  - Cannot be a reserved name (admin, api, paltuu, …)
 */

// ─── Reserved names ───────────────────────────────────────────────────────────
const RESERVED_USERNAMES = new Set([
    "admin",
    "administrator",
    "support",
    "help",
    "api",
    "root",
    "mod",
    "moderator",
    "system",
    "paltuu",
    "official",
    "staff",
    "security",
    "info",
    "contact",
    "null",
    "undefined",
    "webmaster",
    "abuse",
    "postmaster",
    "noreply",
    "no-reply",
    "anonymous",
    "guest",
    "bot",
    "me",
    "user",
    "users",
    "profile",
    "account",
    "settings",
    "login",
    "logout",
    "register",
    "signup",
    "signin",
]);

// ─── Validation ───────────────────────────────────────────────────────────────

export interface UsernameValidationResult {
    valid: boolean;
    /** Human-readable reason, present only when valid === false */
    error?: string;
    /** Normalised (lowercased) value — only meaningful when valid === true */
    normalised?: string;
}

/**
 * Validate a social_username candidate.
 *
 * @param handle - Raw user-supplied string
 * @returns { valid, error?, normalised? }
 */
export function validateUsername(handle: string): UsernameValidationResult {
    if (typeof handle !== "string" || handle.length === 0) {
        return { valid: false, error: "Username is required." };
    }

    const lower = handle.toLowerCase();

    // Length
    if (lower.length < 1) {
        return { valid: false, error: "Username must be at least 1 character." };
    }
    if (lower.length > 30) {
        return { valid: false, error: "Username must be 30 characters or fewer." };
    }

    // Allowed characters only
    if (!/^[a-z0-9_.]+$/.test(lower)) {
        return {
            valid: false,
            error: "Username may only contain letters, numbers, underscores, and periods.",
        };
    }

    // Cannot start with a period
    if (lower.startsWith(".")) {
        return { valid: false, error: "Username cannot start with a period." };
    }

    // Cannot end with a period
    if (lower.endsWith(".")) {
        return { valid: false, error: "Username cannot end with a period." };
    }

    // No consecutive periods
    if (lower.includes("..")) {
        return { valid: false, error: "Username cannot contain consecutive periods." };
    }

    // Reserved names
    if (RESERVED_USERNAMES.has(lower)) {
        return { valid: false, error: "This username is reserved and cannot be used." };
    }

    return { valid: true, normalised: lower };
}

// ─── Auto-generate ────────────────────────────────────────────────────────────

/**
 * Derive a candidate social_username from a display name.
 *
 * Strategy:
 *  1. Lowercase and replace spaces / special chars with underscores
 *  2. Strip any character that isn't a-z, 0-9, _ or .
 *  3. Trim leading/trailing underscores
 *  4. Truncate to 28 chars (leaves room for a 2-digit numeric suffix)
 *  5. Fall back to "user" if the result is empty
 *
 * The caller is responsible for collision resolution (appending a suffix).
 */
export function generateHandleFromName(name: string): string {
    let base = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")          // spaces → underscores
        .replace(/[^a-z0-9_.]/g, "")  // strip illegal chars
        .replace(/^[._]+/, "")         // no leading . or _
        .replace(/[._]+$/, "")         // no trailing . or _
        .replace(/\.{2,}/g, ".");      // collapse consecutive dots

    if (!base || base.length === 0) {
        base = "user";
    }

    // Leave room for a 2-digit suffix collision resolver
    return base.slice(0, 28);
}

/**
 * Generate a collision-safe handle given a `checkExists` function.
 *
 * @param name        - Display name to derive handle from
 * @param checkExists - Async fn that returns true if the handle is already taken
 * @param maxAttempts - How many suffixes to try before giving up (default 10)
 * @returns The first available handle, or null if all attempts are taken
 */
export async function generateUniqueHandle(
    name: string,
    checkExists: (handle: string) => Promise<boolean>,
    maxAttempts = 10,
): Promise<string | null> {
    const base = generateHandleFromName(name);

    // Try the bare base first
    if (!(await checkExists(base))) {
        return base;
    }

    // Try base + random 2-digit suffix
    for (let i = 0; i < maxAttempts; i++) {
        const suffix = String(Math.floor(10 + Math.random() * 90)); // "10"–"99"
        const candidate = `${base}_${suffix}`.slice(0, 30);
        if (!(await checkExists(candidate))) {
            return candidate;
        }
    }

    // Last-ditch: timestamp suffix
    const ts = Date.now().toString().slice(-4);
    return `${base}_${ts}`.slice(0, 30);
}
