import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const result = await db.query('SELECT * FROM user_shipping_info WHERE user_id = $1', [userId]);
        
        return NextResponse.json({
            shippingInfo: (result.rowCount ?? 0) > 0 ? result.rows[0] : null
        });

    } catch (error) {
        console.error("V1 Shipping Info GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { email, fullName, phone, city, postalCode, address } = body;

        const query = `
            INSERT INTO user_shipping_info (user_id, email, full_name, phone, city, postal_code, address, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                phone = EXCLUDED.phone,
                city = EXCLUDED.city,
                postal_code = EXCLUDED.postal_code,
                address = EXCLUDED.address,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await db.query(query, [userId, email, fullName, phone, city, postalCode, address]);
        
        return NextResponse.json({
            message: "Shipping info saved",
            shippingInfo: result.rows[0]
        });

    } catch (error) {
        console.error("V1 Shipping Info POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
