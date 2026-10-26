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
 * Best-effort normalisation to E.164. Returns null when the input cannot
 * be parsed as a valid phone number.
 *
 *  "+923001234567"      -> "+923001234567"   (valid pass-through)
 *  "03001234567"        -> "+923001234567"   (11-digit PK national starting with 03)
 *  "3001234567"         -> "+923001234567"   (10-digit PK national starting with 3)
 *  "+92 300 1234567"    -> "+923001234567"
 *  "00923001234567"     -> "+923001234567"
 *  "+9203001234567"     -> "+923001234567"   (11 digits after +92 starting with 03: recovers by dropping stray 0)
 *  "+920327390998"      -> null              (10 digits after +92 starting with 03: 1 digit short!)
 *  "+92327390998"       -> null              (9 digits after +92: 1 digit short!)
 *  "0327390998"         -> null              (10 digits: 1 digit short!)
 *  "327390998"          -> null              (9 digits: 1 digit short!)
 *  "+922885555558"      -> null              (invalid Pakistani mobile prefix)
 *  "+971 50 123 4567"   -> "+971501234567"   (valid international E.164)
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
        if (digits.length < 7 || digits.length > 15 || digits[0] === "0") return null;

        // Specific handling for Pakistan (+92)
        if (digits.startsWith("92")) {
            let national = digits.slice(2);
            // If user typed +9203XXXXXXXXX (11 digits national starting with 03), recover by dropping stray 0
            if (national.length === 11 && national.startsWith("03")) {
                national = national.slice(1);
            }
            // Valid Pakistani mobile must be exactly 10 digits starting with 3
            if (national.length === 10 && national.startsWith("3")) {
                return `+92${national}`;
            }
            // Any other Pakistani number shape (e.g. starting with +920, short, or wrong prefix) is invalid
            return null;
        }

        // Other countries: national portion must not start with 0
        for (const dial of KNOWN_DIALS) {
            if (digits.startsWith(dial)) {
                const national = digits.slice(dial.length);
                if (national.startsWith("0")) return null;
                const country = COUNTRY_DIALS.find(
                    (c) => c.dial === dial && national.length >= c.min && national.length <= c.max
                );
                if (country) return `+${digits}`;
            }
        }
        return `+${digits}`;
    }

    const digits = s.replace(/\D/g, "");
    // Pakistani national numbers
    if (digits.length === 11 && digits.startsWith("03")) {
        return `+92${digits.slice(1)}`;
    }
    if (digits.length === 10 && digits.startsWith("3")) {
        return `+92${digits}`;
    }
    if (digits.length === 12 && digits.startsWith("923")) {
        return `+${digits}`;
    }
    if (digits.length === 13 && digits.startsWith("9203")) {
        return `+92${digits.slice(3)}`;
    }

    // Bare numbers matching known international dial codes (excluding Pakistan)
    for (const dial of KNOWN_DIALS.filter((d) => d !== "92")) {
        if (digits.startsWith(dial)) {
            const national = digits.slice(dial.length);
            if (!national.startsWith("0")) {
                const country = COUNTRY_DIALS.find(
                    (c) => c.dial === dial && national.length >= c.min && national.length <= c.max
                );
                if (country) return `+${digits}`;
            }
        }
    }

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
    const digits = String(national ?? "").replace(/\D/g, "");
    if (country.dial === "92") {
        return digits.length === 10 && digits.startsWith("3");
    }
    return digits.length >= country.min && digits.length <= country.max && !digits.startsWith("0");
}

/**
 * Form-level check: a well-formed E.164 string whose national part has a
 * valid length and prefix for the detected country.
 */
export function isValidPhone(value: string): boolean {
    const normalized = normalizePhone(value);
    if (!normalized || !isE164(normalized)) return false;
    const digits = normalized.slice(1);
    for (const dial of KNOWN_DIALS) {
        if (digits.startsWith(dial)) {
            const national = digits.slice(dial.length);
            const country = COUNTRY_DIALS.find((c) => c.dial === dial);
            if (country) return isNationalNumberComplete(country, national);
        }
    }
    return false;
}

/** Fallback flag for a number whose country we can't identify. */
export const UNKNOWN_FLAG = "🌐";

/**
 * Presentation helper for showing a stored `contact_number`. Splits a known
 * E.164 number into flag + country + spaced national digits; for anything we
 * can't confidently parse it echoes the raw value with a neutral globe flag.
 */
export function formatPhoneDisplay(value: string | null | undefined): {
    flag: string;
    countryName: string | null;
    /** Pretty form, e.g. "+92 300 1234567". Falls back to the raw string. */
    pretty: string;
    /** Digits only, suitable for `wa.me/` and `tel:` links. */
    digits: string;
    e164: string;
} {
    const raw = String(value ?? "").trim();
    const normalized = normalizePhone(raw);
    const e164 = normalized ?? raw;
    const { country, national } = parseE164(e164);
    const known = !!normalized && national !== "";

    let pretty = raw;
    if (known) {
        const grouped =
            national.length > 6
                ? `${national.slice(0, 3)} ${national.slice(3)}`
                : national;
        pretty = `+${country.dial} ${grouped}`;
    }

    return {
        flag: known ? country.flag : UNKNOWN_FLAG,
        countryName: known ? country.name : null,
        pretty,
        digits: e164.replace(/\D/g, ""),
        e164,
    };
}
