/**
 * Shared bits for the Persona Studio and Inbox admin pages.
 *
 * The bots themselves live in a separate repo (paltuu-bots-infra) and keep
 * their state in the `bots` schema of this same database. These pages are the
 * admin face of that schema: what photos a persona has, what is in each one,
 * and which comments from real people a persona declined to answer.
 */

import { createHash } from "crypto";
import sharp from "sharp";
import { toCdnUrl } from "@/lib/s3";

export const TIMES_OF_DAY = ["any", "morning", "afternoon", "evening", "night"] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

/**
 * The accounts that deliberately have no profile photo, and why. Mirrors
 * NO_AVATAR in paltuu-bots-infra (apps/persona-engine/src/personas/
 * avatarPolicy.ts): 90% of men and 60% of women get a photo, and twenty
 * accounts that all have one is a giveaway. Keep the two in step.
 */
export const NO_AVATAR: Record<string, string> = {
    "naveed-j": "Deliberate lurker, posts twice a week about the walk and nothing else",
    "almas-c": "Private and brief, one of the four low-activity accounts",
    "nayab-k": "Shy student, comments far more than she posts",
    "mehrunnisa-b": "Young, soft and infrequent, the lowest posting cadence of the four",
    "gulmina-a": "Cautious and a little anxious, would not put her face up",
    "shehrbano-t": "Practical and observant, runs the account for the animals",
    "sehrish-n": "Fosters; the account is about the cats passing through, not her",
};

const MALE_FIRST_NAMES = new Set(["sarmad", "naveed", "farrukh", "shehryar", "zavian", "mehran"]);

export function genderOf(name: string): "male" | "female" {
    return MALE_FIRST_NAMES.has(name.trim().split(/\s+/)[0]?.toLowerCase() ?? "") ? "male" : "female";
}

/** Raw S3 URLs 403 (the bucket is only served through CloudFront), so rewrite on read. */
export function cdn(url: string | null): string | null {
    return url ? toCdnUrl(url) : null;
}

export function sha256(buffer: Buffer): string {
    return createHash("sha256").update(buffer).digest("hex");
}

/** Rotate per EXIF, resize, JPEG. Feed photos need neither 12 megapixels nor 4 MB. */
export async function processImage(input: Buffer, square: boolean): Promise<Buffer> {
    const max = square ? 512 : 1440;
    return sharp(input, { failOn: "error" })
        .rotate()
        .resize({ width: max, height: max, fit: square ? "cover" : "inside", withoutEnlargement: true })
        .jpeg({ quality: 86, mozjpeg: true })
        .toBuffer();
}

export function keyFromUrl(url: string): string {
    return new URL(url).pathname.replace(/^\/+/, "");
}
