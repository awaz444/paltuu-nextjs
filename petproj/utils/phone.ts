/**
 * Shared phone-number helpers used by both the web forms and the API routes.
 *
 * Storage format is a single E.164 string: "+" followed by the country calling
 * code and the national number, digits only (e.g. "+923001234567",
 * "+971501234567"). The React Native app already sends numbers in this exact
 * shape ("+92" + 10 digits), so nothing about the existing app clients changes.
 *
 * `normalizePhone` is intentionally forgiving: anything the current clients send
 * keeps working, and only genuinely unusable input returns null.
 */

export interface CountryDial {
    /** ISO 3166-1 alpha-2, used as the <option> key/value. */
    iso2: string;
    name: string;
    /** Calling code without the leading "+". */
    dial: string;
    flag: string;
    /** Min / max length of the national number (digits after the calling code). */
    min: number;
    max: number;
    /** Placeholder shown in the national-number input. */
    example: string;
}

/**
 * Curated list: Pakistan first (the default), then the destinations most common
 * for the Pakistani diaspora. Keep Pakistan at index 0 — `DEFAULT_COUNTRY`
 * depends on it.
 */
export const COUNTRY_DIALS: CountryDial[] = [
    { iso2: "PK", name: "Pakistan", dial: "92", flag: "🇵🇰", min: 10, max: 10, example: "3001234567" },
    { iso2: "AE", name: "United Arab Emirates", dial: "971", flag: "🇦🇪", min: 8, max: 9, example: "501234567" },
    { iso2: "SA", name: "Saudi Arabia", dial: "966", flag: "🇸🇦", min: 9, max: 9, example: "512345678" },
    { iso2: "GB", name: "United Kingdom", dial: "44", flag: "🇬🇧", min: 9, max: 10, example: "7400123456" },
    { iso2: "US", name: "United States", dial: "1", flag: "🇺🇸", min: 10, max: 10, example: "2015550123" },
    { iso2: "CA", name: "Canada", dial: "1", flag: "🇨🇦", min: 10, max: 10, example: "4165550123" },
    { iso2: "QA", name: "Qatar", dial: "974", flag: "🇶🇦", min: 8, max: 8, example: "33123456" },
    { iso2: "KW", name: "Kuwait", dial: "965", flag: "🇰🇼", min: 8, max: 8, example: "50123456" },
    { iso2: "BH", name: "Bahrain", dial: "973", flag: "🇧🇭", min: 8, max: 8, example: "36123456" },
    { iso2: "OM", name: "Oman", dial: "968", flag: "🇴🇲", min: 8, max: 8, example: "92123456" },
    { iso2: "AU", name: "Australia", dial: "61", flag: "🇦🇺", min: 9, max: 9, example: "412345678" },
    { iso2: "DE", name: "Germany", dial: "49", flag: "🇩🇪", min: 10, max: 11, example: "15123456789" },
    { iso2: "TR", name: "Türkiye", dial: "90", flag: "🇹🇷", min: 10, max: 10, example: "5312345678" },
    { iso2: "MY", name: "Malaysia", dial: "60", flag: "🇲🇾", min: 9, max: 10, example: "123456789" },
];

export const DEFAULT_COUNTRY = COUNTRY_DIALS[0]; // Pakistan

/** Dial codes we know about, longest first so "+971" wins over "+9". */
const KNOWN_DIALS = Array.from(new Set(COUNTRY_DIALS.map((c) => c.dial))).sort(
    (a, b) => b.length - a.length
);

/** A syntactically valid E.164 string: "+" then 7–15 digits, no leading zero. */
export function isE164(value: string): boolean {
    return /^\+[1-9]\d{6,14}$/.test(String(value ?? "").trim());
}

/**
 * Best-effort normalisation to E.164. Returns null only when the input can't
 * plausibly be a phone number.
 *
 *  "+923001234567"      -> "+923001234567"   (app / new web forms: pass-through)
 *  "+971 50 123 4567"   -> "+971501234567"
 *  "00923001234567"     -> "+923001234567"
 *  "03001234567"        -> "+923001234567"   (legacy PK national, 11 digits)
 *  "3001234567"         -> "+923001234567"   (legacy PK national, 10 digits)
 *  "gibberish"          -> null
 */
export function normalizePhone(raw: string | null | undefined): string | null {
    if (raw === null || raw === undefined) return null;
    const original = String(raw).trim();
    if (!original) return null;

    // "00" international prefix -> "+"
    let s = original.replace(/[\s\-().]/g, "");
    if (s.startsWith("00")) s = `+${s.slice(2)}`;

    if (s.startsWith("+")) {
        const digits = s.slice(1).replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15 && digits[0] !== "0"
            ? `+${digits}`
            : null;
    }

    const digits = s.replace(/\D/g, "");
    // Legacy Pakistani national formats.
    if (digits.length === 11 && digits.startsWith("0")) return `+92${digits.slice(1)}`;
    if (digits.length === 10 && digits.startsWith("3")) return `+92${digits}`;
    // Last resort: assume the country code is already baked in.
    if (digits.length >= 8 && digits.length <= 15 && digits[0] !== "0") return `+${digits}`;
    return null;
}

/** Split an E.164 string into a known country + national number, for pre-filling a form. */
export function parseE164(value: string | null | undefined): {
    country: CountryDial;
    national: string;
} {
    const normalized = normalizePhone(value);
    if (normalized) {
        const digits = normalized.slice(1);
        for (const dial of KNOWN_DIALS) {
            if (digits.startsWith(dial)) {
                const national = digits.slice(dial.length);
                const country =
                    COUNTRY_DIALS.find(
                        (c) =>
                            c.dial === dial &&
                            national.length >= c.min &&
                            national.length <= c.max
                    ) || COUNTRY_DIALS.find((c) => c.dial === dial)!;
                return { country, national };
            }
        }
    }
    return { country: DEFAULT_COUNTRY, national: "" };
}

/** Compose an E.164 string from a country + national number. Returns "" if national is empty. */
export function toE164(country: CountryDial, national: string): string {
    const digits = String(national ?? "").replace(/\D/g, "");
    return digits ? `+${country.dial}${digits}` : "";
}

/** Whether the national number has a plausible length for the chosen country. */
export function isNationalNumberComplete(country: CountryDial, national: string): boolean {
    const len = String(national ?? "").replace(/\D/g, "").length;
    return len >= country.min && len <= country.max;
}

/**
 * Form-level check: a well-formed E.164 string whose national part has a
 * plausible length for the detected country. Use this to validate the value
 * emitted by <PhoneNumberInput/>.
 */
export function isValidPhone(value: string): boolean {
    if (!isE164(value)) return false;
    const { country, national } = parseE164(value);
    return isNationalNumberComplete(country, national);
}
