import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";

/**
 * @swagger
 * /api/v1/shop-panel:
 *   get:
 *     summary: Get current shop profile (V1)
 *     tags: [v1 Professional]
 *   patch:
 *     summary: Update shop profile & financials (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const query = `
            SELECT 
                s.*, u.name as contact_name, u.email as contact_email, u.phone_number,
                sbi.account_title, sbi.iban, sbi.bank_name
            FROM shops s
            JOIN users u ON s.user_id = u.user_id
            LEFT JOIN shop_bank_info sbi ON s.shop_id = sbi.shop_id
            WHERE s.user_id = $1
        `;

        const result = await db.query(query, [userId]);
        if ((result.rowCount ?? 0) === 0) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { shop_name, address, logo_url, account_title, iban, bank_name } = body;

        // 1. Verify Ownership & Get Shop ID
        const shopCheck = await db.query('SELECT shop_id FROM shops WHERE user_id = $1', [userId]);
        if ((shopCheck.rowCount ?? 0) === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        const shopId = shopCheck.rows[0].shop_id;

        await db.query('BEGIN');
        try {
            // 2. Update Basic Info
            await db.query(`
                UPDATE shops SET 
                    shop_name = COALESCE($1, shop_name), 
                    address = COALESCE($2, address), 
                    logo_url = COALESCE($3, logo_url),
                    updated_at = CURRENT_TIMESTAMP
                WHERE shop_id = $4
            `, [shop_name, address, logo_url, shopId]);

            // 3. Update Bank Info
            if (account_title || iban || bank_name) {
                const bankExists = await db.query('SELECT 1 FROM shop_bank_info WHERE shop_id = $1', [shopId]);
                if ((bankExists.rowCount ?? 0) > 0) {
                    await db.query(`
                        UPDATE shop_bank_info SET 
                            account_title = COALESCE($1, account_title),
                            iban = COALESCE($2, iban),
                            bank_name = COALESCE($3, bank_name)
                        WHERE shop_id = $4
                    `, [account_title, iban, bank_name, shopId]);
                } else {
                    await db.query(`
                        INSERT INTO shop_bank_info (shop_id, account_title, iban, bank_name)
                        VALUES ($1, $2, $3, $4)
                    `, [shopId, account_title, iban, bank_name]);
                }
            }

            await db.query('COMMIT');
            return NextResponse.json({ success: true, message: "Shop updated safely" });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Shop Patch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
