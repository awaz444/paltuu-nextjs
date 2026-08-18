import { cache } from "react";
import { db } from "@/db/index";
import { Clinic } from "../../../types/clinic";
import { Vet } from "../../../types/vet";

export interface ClinicDetails extends Clinic {
    vets: Vet[];
    reviews: {
        review_id: string;
        rating: number;
        review_content: string;
        review_date: string;
        review_maker_profile_image_url: string;
        review_maker_name: string;
    }[];
}

// Deduped per-request via React's cache() — layout.tsx (generateMetadata) and
// page.tsx both call this for the same id within one request, so this runs
// the DB queries once instead of twice.
export const getClinicDetail = cache(async (id: string): Promise<ClinicDetails | null> => {
    try {
        const clinicResult = await db.query(
            "SELECT * FROM clinics WHERE (slug = $1 OR CAST(clinic_id AS TEXT) = $1) AND is_active IS NOT FALSE",
            [String(id)]
        );

        if (!clinicResult || clinicResult.rowCount === 0) return null;
        const clinic = clinicResult.rows[0];

        const vetsResult = await db.query(
            `SELECT
                v.*,
                u.name,
                u.profile_image_url,
                u.email,
                COALESCE(v.contact_details, u.phone_number) as contact_details,
                cv.consultation_fee,
                cv.schedule_notes
            FROM vets v
            JOIN clinic_vets cv ON v.vet_id = cv.vet_id
            LEFT JOIN users u ON v.user_id = u.user_id
            WHERE cv.clinic_id = $1 AND v.is_active = true`,
            [clinic.clinic_id]
        );

        const reviewsResult = await db.query(
            `SELECT
                vr.review_id,
                vr.rating,
                vr.review_content,
                vr.review_date,
                u.profile_image_url AS review_maker_profile_image_url,
                u.name AS review_maker_name
            FROM vet_reviews vr
            JOIN users u ON vr.user_id = u.user_id
            WHERE vr.clinic_id = $1
            ORDER BY vr.review_date DESC`,
            [clinic.clinic_id]
        );

        return {
            ...clinic,
            vets: vetsResult.rows || [],
            reviews: reviewsResult.rows || [],
        };
    } catch (err) {
        console.error("getClinicDetail error:", err);
        return null;
    }
});

export function getReviewStats(clinic: ClinicDetails): { averageRating: number; reviewsCount: number } {
    const reviews = clinic.reviews || [];
    if (reviews.length === 0) return { averageRating: 0, reviewsCount: 0 };
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { averageRating: sum / reviews.length, reviewsCount: reviews.length };
}
