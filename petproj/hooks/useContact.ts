"use client";

import { useEffect, useState } from "react";
import type { Contact, ContactKind } from "@/lib/contactTypes";

/**
 * The phone/email behind a pet listing, clinic or vet, loaded once the visitor
 * is signed in. Public pages don't carry them (lib/contacts.ts).
 */
export function useContact(kind: ContactKind, id: string | number | null | undefined, signedIn: boolean) {
    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!signedIn || id == null || id === "") return;
        let cancelled = false;
        setLoading(true);
        fetch(`/api/v1/contact?kind=${kind}&id=${encodeURIComponent(String(id))}`, { credentials: "include", cache: "no-store" })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => !cancelled && setContact(data))
            .catch(() => !cancelled && setContact(null))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [kind, id, signedIn]);

    return { contact, loading };
}
