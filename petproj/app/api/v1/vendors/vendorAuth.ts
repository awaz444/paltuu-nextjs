import { db } from "@/db/index";
import { getUserFromRequest } from "@/utils/authServer";
import { NextRequest } from "next/server";

export async function checkVendor(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'vendor') {
        return null;
    }

    // Fetch vendor record by user_id
    const result = await db.query(`SELECT * FROM vendors WHERE user_id = $1`, [user.user_id || user.id]);
    if ((result.rowCount ?? 0) === 0) {
        return null;
    }

    return {
        user,
        vendor: result.rows[0]
    };
}
