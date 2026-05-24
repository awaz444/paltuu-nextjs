import { db } from "@/db/index";

export const REPORT_REASONS = [
    { code: 'SPAM', label: 'Spam' },
    { code: 'HATE_SPEECH', label: 'Hate speech or symbols' },
    { code: 'HARASSMENT', label: 'Bullying or harassment' },
    { code: 'ANIMAL_ABUSE', label: 'Animal abuse' },
    { code: 'MISINFORMATION', label: 'False information' },
    { code: 'INAPPROPRIATE', label: 'Inappropriate content' },
    { code: 'SCAM', label: 'Scam or fraud' },
    { code: 'OTHER', label: 'Other' }
] as const;

export type ReportReasonCode = typeof REPORT_REASONS[number]['code'];

export const ALLOWED_REASONS = REPORT_REASONS.map(r => r.code);

/**
 * Reusable SQL snippet to check if the viewer has blocked or is blocked by the other user.
 * Pass the exact parameter or column names as arguments (e.g. '$1', 'p.user_id').
 */
export function isBlockedSql(viewerIdExp: string, otherUserIdExp: string): string {
    return `EXISTS (
        SELECT 1 FROM user_blocks 
        WHERE (blocker_id = ${viewerIdExp} AND blocked_id = ${otherUserIdExp})
           OR (blocker_id = ${otherUserIdExp} AND blocked_id = ${viewerIdExp})
    )`;
}

/**
 * Checks if there is a block in either direction between two users.
 * Returns true if blocked, false otherwise.
 */
export async function checkIsBlocked(userAId: number, userBId: number): Promise<boolean> {
    const res = await db.query(`
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = $1 AND blocked_id = $2)
           OR (blocker_id = $2 AND blocked_id = $1)
        LIMIT 1
    `, [userAId, userBId]);
    return (res.rowCount ?? 0) > 0;
}

/**
 * Helper to throw an error if blocked. Can be caught by API route handlers.
 */
export async function assertNotBlocked(userAId: number, userBId: number) {
    if (await checkIsBlocked(userAId, userBId)) {
        const err = new Error('BLOCKED');
        (err as any).code = 'BLOCKED';
        throw err;
    }
}
