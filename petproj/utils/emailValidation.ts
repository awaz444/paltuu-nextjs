/**
 * emailValidation.ts
 * ------------------
 * Single source of truth for email format rules across all API routes.
 *
 * The previous check (both client- and server-side) only required an "@"
 * followed somewhere later by a ".", which let through addresses like
 * "a@b..com", "a@-bad-.com", or anything with a single-character TLD.
 * This does not (and cannot, without a verification email) confirm the
 * address is real/deliverable — it only rejects obviously malformed input.
 */

const MAX_LOCAL_LENGTH = 64;
const MAX_DOMAIN_LENGTH = 255;

export interface EmailValidationResult {
    valid: boolean;
    /** Human-readable reason, present only when valid === false */
    error?: string;
    /** Normalised (trimmed, lowercased) value — only meaningful when valid === true */
    normalised?: string;
}

/**
 * Validate an email address candidate.
 *
 * @param email - Raw user-supplied string
 * @returns { valid, error?, normalised? }
 */
export function validateEmail(email: string): EmailValidationResult {
    if (typeof email !== "string" || email.trim().length === 0) {
        return { valid: false, error: "Email is required." };
    }

    const trimmed = email.trim();
    const lower = trimmed.toLowerCase();

    if (trimmed.length > MAX_LOCAL_LENGTH + MAX_DOMAIN_LENGTH + 1) {
        return { valid: false, error: "Email address is too long." };
    }

    // Exactly one "@", with a non-empty local part and domain part.
    const atParts = trimmed.split("@");
    if (atParts.length !== 2) {
        return { valid: false, error: "Please enter a valid email address." };
    }
    const [local, domain] = atParts;

    if (local.length === 0 || local.length > MAX_LOCAL_LENGTH) {
        return { valid: false, error: "Please enter a valid email address." };
    }
    if (domain.length === 0 || domain.length > MAX_DOMAIN_LENGTH) {
        return { valid: false, error: "Please enter a valid email address." };
    }

    // Local part: letters, digits, and . _ % + - (no leading/trailing/consecutive dots)
    if (!/^[a-zA-Z0-9._%+-]+$/.test(local)) {
        return { valid: false, error: "Email contains characters that aren't allowed." };
    }
    if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
        return { valid: false, error: "Please enter a valid email address." };
    }

    // Domain: labels separated by single dots, each alphanumeric/hyphen,
    // no leading/trailing hyphen per label, TLD must be >= 2 alpha chars.
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
        return { valid: false, error: "Please enter a valid email address." };
    }

    return { valid: true, normalised: lower };
}
