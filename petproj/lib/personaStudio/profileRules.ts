/**
 * Validation for editing a persona's or a pet's profile.
 *
 * Names, usernames and bios go through the same matcher as the moderation
 * backfill sweep (db/moderationBackfillSweep.ts), which auto-suspends any
 * account that trips it. A rename that passes here can never be suspended by
 * that sweep later.
 */

import { hasSevereIdentityMatch, hasSevereMatch } from "@/lib/moderation/badWords";
import { hasPetSaleMatch } from "@/lib/moderation/petSaleDetection";

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export function checkPersonaName(input: unknown): Checked<string> {
    if (typeof input !== "string") return fail("Name is required.");
    const value = input.trim().replace(/\s+/g, " ");
    if (value.length < 2 || value.length > 60) return fail("Name must be 2 to 60 characters.");
    if (hasSevereIdentityMatch(value) || hasSevereMatch(value)) return fail("That name would be flagged by moderation.");
    return { ok: true, value };
}

export function checkUsername(input: unknown): Checked<string> {
    if (typeof input !== "string") return fail("Username is required.");
    const value = input.trim().toLowerCase().replace(/^@/, "");
    if (!/^[a-z0-9_.]{3,30}$/.test(value)) return fail("Username: 3 to 30 characters, lowercase letters, numbers, dots and underscores.");
    if (value.startsWith(".") || value.endsWith(".") || value.includes("..")) return fail("Username cannot start or end with a dot, or have two in a row.");
    if (hasSevereIdentityMatch(value)) return fail("That username would be flagged by moderation.");
    return { ok: true, value };
}

/** Empty is allowed and stored as NULL. */
export function checkBio(input: unknown, max: number): Checked<string | null> {
    if (input === null || input === undefined) return { ok: true, value: null };
    if (typeof input !== "string") return fail("Bio must be text.");
    const value = input.trim();
    if (value.length === 0) return { ok: true, value: null };
    if (value.length > max) return fail(`Bio must be ${max} characters or fewer.`);
    if (hasSevereIdentityMatch(value) || hasSevereMatch(value)) return fail("That bio would be flagged by moderation.");
    if (hasPetSaleMatch(value)) return fail("A bio that reads like a pet sale would be flagged by moderation.");
    return { ok: true, value };
}

export function checkCity(input: unknown): Checked<string | null> {
    if (input === null || input === undefined) return { ok: true, value: null };
    if (typeof input !== "string") return fail("City must be text.");
    const value = input.trim();
    if (value.length > 60) return fail("City must be 60 characters or fewer.");
    return { ok: true, value: value || null };
}

export function checkPetName(input: unknown): Checked<string> {
    if (typeof input !== "string") return fail("Pet name is required.");
    const value = input.trim().replace(/\s+/g, " ");
    if (value.length < 1 || value.length > 40) return fail("Pet name must be 1 to 40 characters.");
    if (hasSevereIdentityMatch(value) || hasSevereMatch(value)) return fail("That name would be flagged by moderation.");
    return { ok: true, value };
}

export function checkBreed(input: unknown): Checked<string | null> {
    if (input === null || input === undefined) return { ok: true, value: null };
    if (typeof input !== "string") return fail("Breed must be text.");
    const value = input.trim();
    if (value.length > 100) return fail("Breed must be 100 characters or fewer.");
    return { ok: true, value: value || null };
}
