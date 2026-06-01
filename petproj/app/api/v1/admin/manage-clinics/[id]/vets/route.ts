import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";

/**
 * Manage vets linked to a specific clinic via clinic_vets junction table.
 *
 * GET  /api/v1/admin/manage-clinics/[id]/vets  — list linked vets
 * POST /api/v1/admin/manage-clinics/[id]/vets  — link an existing vet
 * DELETE /api/v1/admin/manage-clinics/[id]/vets?vet_id=X  — unlink a vet
 */

// ─── GET — Vets linked to this clinic ──────────────────────────────────────
export async function GET(req: NextRequest, context: any) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== "admin")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const clinic_id = context.params?.id;

        const result = await db.query(`
            SELECT
                v.vet_id,
                v.specialization,
                v.qualifications,
                v.license_number,
                v.bio,
                v.is_active,
                v.minimum_fee,
                u.name,
                u.email,
                u.profile_image_url,
                u.phone_number,
                cv.consultation_fee,
                cv.is_primary_location,
                cv.schedule_notes
            FROM clinic_vets cv
            JOIN vets  v ON cv.vet_id   = v.vet_id
            JOIN users u ON v.user_id   = u.user_id
            WHERE cv.clinic_id = $1
            ORDER BY u.name ASC
        `, [clinic_id]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("clinic-vets GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// ─── POST — Link an existing vet to this clinic ────────────────────────────
export async function POST(req: NextRequest, context: any) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== "admin")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const clinic_id = context.params?.id;
        const { vet_id, consultation_fee, is_primary_location, schedule_notes } = await req.json();

        if (!vet_id)
            return NextResponse.json({ error: "vet_id required" }, { status: 400 });

        // Upsert — if already linked just update the metadata
        await db.query(`
            INSERT INTO clinic_vets (clinic_id, vet_id, consultation_fee, is_primary_location, schedule_notes)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (clinic_id, vet_id) DO UPDATE SET
                consultation_fee    = EXCLUDED.consultation_fee,
                is_primary_location = EXCLUDED.is_primary_location,
                schedule_notes      = EXCLUDED.schedule_notes
        `, [clinic_id, vet_id, consultation_fee || null, is_primary_location || false, schedule_notes || null]);

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("clinic-vets POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// ─── DELETE — Unlink a vet from this clinic ────────────────────────────────
export async function DELETE(req: NextRequest, context: any) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== "admin")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const clinic_id = context.params?.id;
        const { searchParams } = new URL(req.url);
        const vet_id = searchParams.get("vet_id");

        if (!vet_id)
            return NextResponse.json({ error: "vet_id required" }, { status: 400 });

        await db.query(
            "DELETE FROM clinic_vets WHERE clinic_id = $1 AND vet_id = $2",
            [clinic_id, vet_id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("clinic-vets DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
