/**
 * Detects pet-for-sale language in post content, for the auto-flag on
 * creation (see app/api/v1/social/posts/route.ts) — Paltuu doesn't condone
 * selling pets, only adoption/rehoming. A match tags the row
 * `content_notice_reason = 'pet_sale'`, which the mobile client renders as a
 * public "flagged, under review" disclaimer on the card. It does not hide
 * the post.
 *
 * CANONICAL COPY. The mobile app mirrors this in
 * paltuu-reactnative/src/utils/moderation/postIntent.ts to warn the author
 * before they post (that file also carries an adoption-intent check, which
 * is a client-only nudge with no server-side consequence). Keep the sale
 * half of the two in sync manually — same arrangement as badWords.ts next
 * door; they're small enough that a shared package wasn't worth the
 * cross-repo wiring.
 *
 * This is a first-pass heuristic, not a classifier, and it will get things
 * wrong in both directions:
 *   - false negatives: sellers who avoid both price and sale language
 *     entirely ("DM me for details") won't match anything here.
 *   - false positives: a post that mentions a price near ordinary sale
 *     vocabulary ("best price I found for cat food was 8500") can trip the
 *     weak tier.
 * The admin panel's Restore button (false positives) and its manual
 * "pet sale" flag (false negatives) are the correction path — this detector
 * doesn't need to be perfect, just a reasonable first filter.
 *
 * Two tiers rather than one flat list: STRONG phrases read as a commercial
 * listing on a pet app on their own, while WEAK ones ("selling", "buyer",
 * "price") are common enough in unrelated posts that they only count when a
 * price signal appears alongside them.
 */

// ── Price signals ────────────────────────────────────────────────────────────
// Used only to promote a WEAK sale phrase into a match.

const CURRENCY_WORD_RE = /\b(?:pkr|rs|rupees?|rupay|rupaye|rupya)\b|\brs\./i;
// Not wrapped in \b — the symbols aren't word characters, so a boundary
// assertion next to them only holds when they're glued to a letter/digit.
const CURRENCY_SYMBOL_RE = /[₨₹]/;
// "4k", "15,000", "5000/-", "4000 each", "3500 only", "2000 per kitten".
const PRICE_SHAPE_RE = /\b\d{1,4}\s?k\b|\b\d{1,3}(?:,\d{3})+\b|\b\d[\d,]*\s*\/-|\b\d{3,6}\s*(?:each|only|final|fix(?:ed)?|per\b)/i;
// A 3–6 digit run standing alone ("4000") — weak on its own, so it only
// counts as a price signal when a sale phrase is already present.
const BARE_AMOUNT_RE = /\b\d{3,6}\b/;

// ── Sale phrases ─────────────────────────────────────────────────────────────

const STRONG_SALE_PHRASES = [
    // --- English ---
    'for sale', 'up for sale', 'available for sale', 'for selling',
    'sale post', 'selling my', 'selling this', 'selling her', 'selling him',
    'selling them', 'want to sell', 'wanna sell', 'looking to sell',
    'contact to buy', 'contact for price', 'dm for price', 'inbox for price',
    'serious buyers', 'serious buyer', 'genuine buyers', 'genuine buyer',
    'no time wasters', 'best offer', 'reasonable offer',
    'final price', 'fixed price', 'price fix', 'price is fixed',

    // --- Roman Urdu/Hindi ---
    'bechna hai', 'bechni hai', 'bechne hai', 'bechna h', 'bechni h',
    'bech raha', 'bech rahi', 'bech dena', 'bech dunga', 'bech doon',
    'bikri', 'bikri ke liye', 'bikau', 'bikaoo', 'bikaao',
    'bikna hai', 'bikta hai', 'bikti hai', 'bikaana', 'bikana',
    'sale ke liye', 'sale par', 'sale pe',
    'price final hai', 'qeemat final', 'rate final',
];

const WEAK_SALE_PHRASES = [
    // --- English ---
    'sell', 'selling', 'sold', 'buy', 'buyer', 'buyers', 'purchase',
    'price', 'priced', 'pricing', 'negotiable', 'nego', 'offer',
    'cod', 'cash on delivery', 'advance payment', 'advance booking',
    'delivery available', 'home delivery', 'deliver anywhere',
    'easypaisa', 'easy paisa', 'jazzcash', 'jazz cash', 'bank transfer',
    '1st come 1st serve', 'first come first serve', 'first come first served',

    // --- Roman Urdu/Hindi ---
    'qeemat', 'qimat', 'keemat', 'daam', 'rate', 'demand', 'paisay', 'paise',
    'kharidna', 'kharid lo', 'khareedna', 'le lo',
];

// Slogans and disclaimers that contain sale vocabulary but say the opposite.
// Stripped from the text before matching rather than special-cased per
// phrase, so "adopt don't shop, she's not for sale" stays clean.
const SALE_EXCLUSIONS = [
    "adopt don't shop", 'adopt dont shop', 'adopt not shop',
    "don't shop adopt", 'dont shop adopt',
    'not for sale', 'nahi bechni', 'nahi bechna', 'never sell', 'not selling',
    'no sale', 'free of cost', 'bilkul free', 'free me',
];

// ── Matching ─────────────────────────────────────────────────────────────────

function escapeForRegex(word: string): string {
    return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

function buildMatcher(phrases: string[], flags = 'i'): RegExp {
    return new RegExp(`\\b(?:${phrases.map(escapeForRegex).join('|')})\\b`, flags);
}

const STRONG_SALE_RE = buildMatcher(STRONG_SALE_PHRASES, 'gi');
const WEAK_SALE_RE = buildMatcher(WEAK_SALE_PHRASES);
const SALE_EXCLUSION_RE = new RegExp(
    `\\b(?:${SALE_EXCLUSIONS.map(escapeForRegex).join('|')})\\b`, 'gi',
);

// "she is not for sale", "inhe bechna nahi hai" — a negator within the two
// words before a strong phrase inverts it. Cheap approximation of intent;
// the admin Restore button is the real correction path.
const NEGATION_BEFORE_RE = /\b(?:not|no|never|nahi|nahin|dont|don't|doesn't|didnt|didn't|isn't|isnt|aren't|arent|won't|wont)\b(?:\W+\w+){0,2}\W*$/i;

/** True when any match of `re` in `text` survives the negation check. */
function hasUnnegatedMatch(re: RegExp, text: string): boolean {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        if (!NEGATION_BEFORE_RE.test(text.slice(0, m.index))) return true;
        // Zero-length matches can't happen here (every phrase has length),
        // but guard the loop anyway so a future empty entry can't hang it.
        if (m.index === re.lastIndex) re.lastIndex++;
    }
    return false;
}

/**
 * True when `text` reads as a pet-for-sale listing: either a strong sale
 * phrase on its own, or a weak one backed by a price signal.
 * Case-insensitive, whole-word/whole-phrase matching.
 */
export function hasPetSaleMatch(text: string): boolean {
    if (!text) return false;
    const cleaned = text.replace(SALE_EXCLUSION_RE, ' ');
    if (hasUnnegatedMatch(STRONG_SALE_RE, cleaned)) return true;
    if (!WEAK_SALE_RE.test(cleaned)) return false;
    return (
        CURRENCY_WORD_RE.test(cleaned) ||
        CURRENCY_SYMBOL_RE.test(cleaned) ||
        PRICE_SHAPE_RE.test(cleaned) ||
        BARE_AMOUNT_RE.test(cleaned)
    );
}
