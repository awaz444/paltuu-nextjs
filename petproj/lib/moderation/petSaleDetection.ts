/**
 * Detects pet-for-sale language in post content, for the auto shadow-hide
 * on creation (see app/api/v1/social/posts/route.ts) — Paltuu doesn't
 * condone selling pets, only adoption/rehoming.
 *
 * This is a first-pass heuristic, not a classifier, and it will get things
 * wrong in both directions:
 *   - false negatives: sellers who avoid price language entirely ("DM me
 *     for details") won't match anything here.
 *   - false positives: a legitimate rehoming post that mentions an
 *     adoption fee in the same breath as sale-shaped phrasing ("negotiable
 *     adoption fee") can trip this.
 * The admin panel's Restore button (false positives) and its manual
 * "Shadow-hide (pet sale)" button (false negatives) are the correction
 * path — this detector doesn't need to be perfect, just a reasonable
 * first filter.
 *
 * Deliberately requires BOTH a price/currency signal AND a separate
 * sale-intent phrase to match, rather than either alone. Sale-intent words
 * like "selling" or "buyer" are common enough in unrelated contexts that
 * matching them alone would over-trigger; requiring a price signal too
 * keeps this closer to actual commercial listings.
 */

const CURRENCY_WORDS = [
    'pkr', 'rs\\.?', 'rupees', 'rupee', '₨',
];

const SALE_INTENT_PHRASES = [
    // --- English ---
    'for sale', 'up for sale', 'selling', 'sell', 'buyer', 'buyers',
    'price is', 'final price', 'best price', 'negotiable',
    '1st come 1st serve', 'first come first serve', 'first come first served',
    'cash on delivery', 'cod', 'contact to buy', 'contact for price',
    'delivery available', 'home delivery',

    // --- Roman Urdu/Hindi ---
    'bikri', 'bikta hai', 'bikti hai', 'bikaana', 'bikana',
    'qeemat', 'qimat', 'daam', 'sale ke liye', 'bechni hai', 'bechna hai',
];

function escapeForRegex(word: string): string {
    return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

function buildMatcher(words: string[]): RegExp {
    const pattern = words.map(escapeForRegex).join('|');
    return new RegExp(`\\b(?:${pattern})\\b`, 'i');
}

// A bare number directly followed by a currency word ("15000 pkr", "Rs 5000")
// counts as a price signal too, on top of the currency words matching alone.
const PRICE_NUMBER_RE = /\b\d{2,}\s*(?:pkr|rs\.?|rupees?|₨)\b/i;

const CURRENCY_RE = buildMatcher(CURRENCY_WORDS);
const SALE_INTENT_RE = buildMatcher(SALE_INTENT_PHRASES);

/**
 * True when `text` contains both a price/currency signal and a separate
 * sale-intent phrase. Case-insensitive, whole-word/whole-phrase matching.
 */
export function hasPetSaleMatch(text: string): boolean {
    if (!text) return false;
    const hasPriceSignal = CURRENCY_RE.test(text) || PRICE_NUMBER_RE.test(text);
    if (!hasPriceSignal) return false;
    return SALE_INTENT_RE.test(text);
}
