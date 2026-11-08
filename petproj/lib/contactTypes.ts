/** Shapes returned by GET /api/v1/contact (lib/contacts.ts). Safe to import in the browser. */

export type ContactKind = "pet" | "clinic" | "vet";

export type VetContact = { phone: string | null; email: string | null };

export type Contact =
    | { kind: "pet"; phone: string | null }
    | { kind: "clinic"; phone: string | null; whatsapp: string | null; vets: Record<string, VetContact> }
    | { kind: "vet"; phone: string | null; email: string | null; clinicWhatsapp: string | null };
