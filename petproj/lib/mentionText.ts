/**
 * @mentions on the website, safe to load in the browser.
 *
 * Posts and comments store a mention as a token, the format the mobile app's
 * composer writes and lib/mentions.ts validates on the server:
 *   {@}[alice_w](user:7)   a person, by social_username
 *   {@}[Bella](pet:42)     one of the author's pets, by name
 *
 * The website shows the text with each token as "@name". It keeps the list of
 * mentions alongside, so "@name" can link to the profile, and turns the
 * mentions picked in a composer back into tokens before sending.
 */

export type MentionRef = { name: string; type: "user" | "pet"; id: number };

const TOKEN_RE = /\{@\}\[([^\[\]]{1,100}?)\]\((user|pet):(\d+)\)/g;

/** Every mention in stored content, once each, in order. */
export function extractMentions(raw: string | null | undefined): MentionRef[] {
    const seen = new Set<string>();
    const out: MentionRef[] = [];
    for (const m of (raw ?? "").matchAll(TOKEN_RE)) {
        const name = m[1].trim();
        const type = m[2] as "user" | "pet";
        const id = Number(m[3]);
        const key = `${type}:${id}`;
        if (!name || !id || seen.has(key)) continue;
        seen.add(key);
        out.push({ name, type, id });
    }
    return out;
}

function escapeRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * "@name" where the name is one of these mentions: after the start of the text,
 * a space or punctuation (not inside an email address or another word), and
 * not followed by more of a username. Longest names first, so "@ali_k" wins
 * over "@ali".
 */
export function mentionPattern(mentions: MentionRef[]): RegExp | null {
    const names = Array.from(new Set(mentions.map((m) => m.name))).sort((a, b) => b.length - a.length);
    if (names.length === 0) return null;
    return new RegExp(`(^|[^\\w@.])@(${names.map(escapeRe).join("|")})(?![\\w])`, "g");
}

/** Turn "@name" for each picked mention back into its token, ready to send. */
export function encodeMentions(text: string, picked: MentionRef[]): string {
    const usable = picked.filter((m) => m.name && !/[\[\]]/.test(m.name));
    const re = mentionPattern(usable);
    if (!re) return text;
    const byName = new Map<string, MentionRef>();
    for (const m of usable) if (!byName.has(m.name)) byName.set(m.name, m);
    return text.replace(re, (all, lead: string, name: string) => {
        const m = byName.get(name);
        return m ? `${lead}{@}[${m.name}](${m.type}:${m.id})` : all;
    });
}
