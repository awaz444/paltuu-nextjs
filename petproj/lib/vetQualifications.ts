/**
 * Qualifications a vet can pick on the signup form (/vet-register, step 3).
 *
 * Production has no `qualifications` table (the old vet schema was never
 * migrated), so /api/v1/qualifications returned a 500 and the step never loaded
 * (PALTU-146). The list lives here instead. /api/v1/vet-register-complete turns
 * the picked ids back into names and saves them as text in vets.qualifications,
 * the same field admins edit in /manage-clinics.
 *
 * Ids are what the form sends, so never reuse or renumber one.
 */
export const VET_QUALIFICATIONS = [
    { qualification_id: 1, qualification_name: "DVM (Doctor of Veterinary Medicine)" },
    { qualification_id: 2, qualification_name: "BVSc / BVSc & AH" },
    { qualification_id: 3, qualification_name: "M.Phil / MSc (Hons) in Veterinary Sciences" },
    { qualification_id: 4, qualification_name: "PhD in Veterinary Sciences" },
    { qualification_id: 5, qualification_name: "Postgraduate diploma or certificate" },
    { qualification_id: 6, qualification_name: "Other qualification" },
] as const;
