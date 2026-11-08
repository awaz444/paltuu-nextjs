import { db } from "@/db/index";

/**
 * Phone numbers and emails of pet owners, clinics and vets are for signed-in
 * users only (PALTU-116 gated the buttons, PALTU-134 the data).
 *
 * Public pages and APIs strip them with the strip* helpers below, so they are
 * not in the HTML or JSON a signed-out visitor receives. Signed-in users load
 * them from GET /api/v1/contact, which reads them with getContact(). Stripped
 * objects keep has_contact / has_whatsapp / has_email flags so the page can
 * still offer the (gated) buttons.
 */

import type { Contact, ContactKind } from "@/lib/contactTypes";
export type { Contact, ContactKind, VetContact } from "@/lib/contactTypes";

/** null when there is no such pet, clinic or vet. */
export async function getContact(kind: ContactKind, id: string): Promise<Contact | null> {
    if (kind === "pet") {
        if (!/^\d+$/.test(id)) return null;
        const { rows } = await db.query("SELECT contact_number FROM pets WHERE pet_id = $1", [id]);
        return rows[0] ? { kind, phone: rows[0].contact_number ?? null } : null;
    }

    if (kind === "clinic") {
        const { rows } = await db.query(
            "SELECT clinic_id, contact_number, whatsapp_number FROM clinics WHERE (slug = $1 OR CAST(clinic_id AS TEXT) = $1) AND is_active IS NOT FALSE",
            [id]
        );
        if (!rows[0]) return null;
        const vets = await db.query(
            `SELECT v.vet_id, COALESCE(v.contact_details, u.phone_number) AS phone, u.email
               FROM vets v
               JOIN clinic_vets cv ON v.vet_id = cv.vet_id
               LEFT JOIN users u ON v.user_id = u.user_id
              WHERE cv.clinic_id = $1 AND v.is_active = true`,
            [rows[0].clinic_id]
        );
        return {
            kind,
            phone: rows[0].contact_number ?? null,
            whatsapp: rows[0].whatsapp_number ?? null,
            vets: Object.fromEntries(vets.rows.map((v) => [String(v.vet_id), { phone: v.phone ?? null, email: v.email ?? null }])),
        };
    }

    if (!/^\d+$/.test(id)) return null;
    const { rows } = await db.query(
        `SELECT v.contact_details, u.email,
                (SELECT cl.whatsapp_number
                   FROM clinic_vets cv JOIN clinics cl ON cl.clinic_id = cv.clinic_id
                  WHERE cv.vet_id = v.vet_id
                  ORDER BY cv.is_primary_location DESC NULLS LAST, cv.created_at ASC
                  LIMIT 1) AS clinic_whatsapp
           FROM vets v
           JOIN users u ON v.user_id = u.user_id
          WHERE v.vet_id = $1 AND v.is_active = true`,
        [id]
    );
    return rows[0]
        ? { kind, phone: rows[0].contact_details ?? null, email: rows[0].email ?? null, clinicWhatsapp: rows[0].clinic_whatsapp ?? null }
        : null;
}

/** A pet listing as anyone may see it: no owner phone or email. */
export function stripPetContact<T extends Record<string, any>>(pet: T): Omit<T, "contact_number" | "owner_email" | "owner_phone"> {
    const { contact_number, owner_email, owner_phone, ...rest } = pet;
    return { ...rest, has_contact: Boolean(contact_number) } as any;
}

/** A vet as anyone may see them. */
export function stripVetContact<T extends Record<string, any>>(vet: T): Omit<T, "contact_details" | "email" | "clinic_whatsapp"> {
    const { contact_details, email, clinic_whatsapp, ...rest } = vet;
    return { ...rest, has_contact: Boolean(contact_details), has_email: Boolean(email), has_clinic_whatsapp: Boolean(clinic_whatsapp) } as any;
}

/** A clinic, and the vets listed on it, as anyone may see them. */
export function stripClinicContact<T extends Record<string, any>>(clinic: T): Omit<T, "contact_number" | "whatsapp_number"> {
    const { contact_number, whatsapp_number, ...rest } = clinic;
    if (Array.isArray(rest.vets)) (rest as any).vets = rest.vets.map(stripVetContact);
    return { ...rest, has_contact: Boolean(contact_number), has_whatsapp: Boolean(whatsapp_number) } as any;
}
