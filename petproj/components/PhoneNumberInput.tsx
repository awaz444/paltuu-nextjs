"use client";

import React, { useEffect, useState } from "react";
import {
    COUNTRY_DIALS,
    parseE164,
    toE164,
    type CountryDial,
} from "@/utils/phone";

interface PhoneNumberInputProps {
    /** Current value as an E.164 string ("+923001234567") or "". */
    value: string;
    /** Called with the composed E.164 string, or "" while the number is blank. */
    onChange: (e164: string) => void;
    hasError?: boolean;
    disabled?: boolean;
    /** Extra classes for the outer wrapper (borders / radius / padding live here). */
    className?: string;
    inputClassName?: string;
    id?: string;
    autoFocus?: boolean;
}

/**
 * Country-code dropdown + national-number field. Emits a single E.164 string so
 * the backend and the mobile app keep storing phone numbers in one shape.
 */
const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
    value,
    onChange,
    hasError = false,
    disabled = false,
    className = "",
    inputClassName = "",
    id,
    autoFocus = false,
}) => {
    const initial = parseE164(value);
    const [country, setCountry] = useState<CountryDial>(initial.country);
    const [national, setNational] = useState<string>(initial.national);

    // Re-sync when the parent prefills or resets `value` from the outside.
    useEffect(() => {
        if ((value || "") !== toE164(country, national)) {
            const parsed = parseE164(value);
            setCountry(parsed.country);
            setNational(parsed.national);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const emit = (nextCountry: CountryDial, nextNational: string) => {
        const digits = nextNational.replace(/\D/g, "").slice(0, nextCountry.max);
        setCountry(nextCountry);
        setNational(digits);
        onChange(toE164(nextCountry, digits));
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = COUNTRY_DIALS.find((c) => c.iso2 === e.target.value);
        if (next) emit(next, national);
    };

    return (
        <div
            className={`flex items-center gap-2 transition-all ${
                hasError ? "border-red-300" : ""
            } ${className}`}
        >
            <select
                aria-label="Country code"
                value={country.iso2}
                onChange={handleCountryChange}
                disabled={disabled}
                className="bg-transparent border-none outline-none font-bold text-gray-700 pr-1 cursor-pointer disabled:cursor-not-allowed"
            >
                {COUNTRY_DIALS.map((c) => (
                    <option key={c.iso2} value={c.iso2} title={c.name}>
                        {c.flag} {c.iso2} +{c.dial}
                    </option>
                ))}
            </select>

            <input
                id={id}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                autoFocus={autoFocus}
                disabled={disabled}
                placeholder={country.example}
                value={national}
                onChange={(e) => emit(country, e.target.value)}
                className={`bg-transparent border-none outline-none w-full font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal disabled:cursor-not-allowed ${inputClassName}`}
            />
        </div>
    );
};

export default PhoneNumberInput;
