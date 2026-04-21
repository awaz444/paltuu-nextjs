import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/admin/vets/verify:
 *   get:
 *     summary: Fetch pending vet verifications (Admin V1)
 *     tags: [v1 Admin]
 *   patch:
 *     summary: Update vet verification status (Admin V1)
 *     tags: [v1 Admin]
 */

export async function GET(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const query = `
            SELECT 
                v.vet_id,
                u.name AS vet_name,
                u.email AS vet_email,
                v.profile_verified,
                vq.qualification_id,
                vq.year_acquired,
                vq.note,
                vva.image_url
            FROM vets v
            INNER JOIN users u ON v.user_id = u.user_id
            INNER JOIN vet_qualifications vq ON v.vet_id = vq.vet_id
            INNER JOIN vet_verification_application vva 
                ON vq.vet_id = vva.vet_id 
                AND vq.qualification_id = vva.qualification_id
            WHERE v.profile_verified = FALSE
            ORDER BY v.vet_id, vq.qualification_id;
        `;

        const result = await db.query(query);

        // Group by vet
        const vets = result.rows.reduce((acc: any[], row: any) => {
            let vet = acc.find((v) => v.vet_id === row.vet_id);
            if (!vet) {
                vet = {
                    vet_id: row.vet_id,
                    vet_name: row.vet_name,
                    vet_email: row.vet_email,
                    profile_verified: row.profile_verified,
                    qualifications: [],
                };
                acc.push(vet);
            }

            let qual = vet.qualifications.find((q: any) => q.qualification_id === row.qualification_id);
            if (!qual) {
                qual = {
                    qualification_id: row.qualification_id,
                    year_acquired: row.year_acquired,
                    note: row.note,
                    images: [],
                };
                vet.qualifications.push(qual);
            }
            qual.images.push(row.image_url);
            return acc;
        }, []);

        return NextResponse.json({ vets });
    } catch (error) {
        console.error("V1 Admin Pending Vets GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { vet_id, status } = await req.json(); // status: 'approved' or 'rejected'
        if (!vet_id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        if (status === 'approved') {
            // Atomic update: Verify vet + Change user role to 'vet'
            const updateQuery = `
                WITH vet_update AS (
                    UPDATE vets SET profile_verified = true WHERE vet_id = $1 RETURNING user_id
                )
                UPDATE users SET role = 'vet' 
                FROM vet_update WHERE users.user_id = vet_update.user_id 
                RETURNING users.user_id;
            `;
            const result = await db.query(updateQuery, [vet_id]);

            if (result.rowCount === 0) return NextResponse.json({ error: "Vet not found" }, { status: 404 });

            await db.query(`UPDATE vet_verification_application SET status = 'approved' WHERE vet_id = $1`, [vet_id]);

            await db.query(`
                INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
                VALUES ($1, 'Your professional profile has been verified!', 'vet_verification', false, NOW())
            `, [result.rows[0].user_id]);

            return NextResponse.json({ success: true, message: "Vet approved" });
        } else {
            // Rejection
            const vetResult = await db.query('SELECT user_id FROM vets WHERE vet_id = $1', [vet_id]);
            if (vetResult.rowCount === 0) return NextResponse.json({ error: "Vet not found" }, { status: 404 });

            await db.query(`UPDATE vet_verification_application SET status = 'rejected' WHERE vet_id = $1`, [vet_id]);

            await db.query(`
                INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
                VALUES ($1, 'Your professional verification request was not approved. Please review your details and try again.', 'vet_verification', false, NOW())
            `, [vetResult.rows[0].user_id]);

            return NextResponse.json({ success: true, message: "Vet rejected" });
        }
    } catch (error) {
        console.error("V1 Admin Vet Verify PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
