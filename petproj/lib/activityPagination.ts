export function encodeActivityCursor(id: string | number, createdAt: string | Date) {
    const payload = JSON.stringify({
        id: String(id),
        created_at: new Date(createdAt).toISOString(),
    });
    return Buffer.from(payload).toString("base64");
}

export function decodeActivityCursor(cursor: string | null) {
    if (!cursor) return null;
    try {
        const decoded = Buffer.from(cursor, "base64").toString("utf8");
        const parsed = JSON.parse(decoded) as { id: string; created_at: string };
        if (!parsed?.id || !parsed?.created_at) return null;
        return parsed;
    } catch {
        return null;
    }
}

export const POST_THUMBNAIL_SQL = `
    (SELECT COALESCE(m.thumbnail_url, m.url)
     FROM social_post_media m
     WHERE m.post_id = p.post_id
     ORDER BY m.ordering NULLS LAST, m.media_id
     LIMIT 1)
`;
