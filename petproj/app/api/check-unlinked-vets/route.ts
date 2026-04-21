import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const result = await db.query(`
            SELECT v.vet_id, u.name, u.email
            FROM vets v
            JOIN users u ON v.user_id = u.user_id
            WHERE v.vet_id IN (12, 13)
        `);
        return NextResponse.json({ vets: result.rows });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
