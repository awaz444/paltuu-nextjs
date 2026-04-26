import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../adminAuth";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/utils/email";

export const dynamic = "force-dynamic";

// GET /api/v1/admin/vendors
// Paginated list of all vendors
export async function GET(req: NextRequest) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;

        const status = searchParams.get("status");
        const city_id = searchParams.get("city_id");
        const keyword = searchParams.get("keyword");

        let queryStr = `
            SELECT v.*, u.email as owner_email, u.name as owner_name,
                (SELECT COUNT(*)::int FROM vendor_inventory vi WHERE vi.vendor_id = v.vendor_id) as products_count
            FROM vendors v
            JOIN users u ON v.user_id = u.user_id
            WHERE 1=1
        `;
        const params: any[] = [];
        let pIdx = 1;

        if (status === "active") queryStr += ` AND v.is_active = true`;
        else if (status === "inactive") queryStr += ` AND v.is_active = false`;
        else if (status === "unverified") queryStr += ` AND v.is_verified = false`;

        if (city_id) { params.push(city_id); queryStr += ` AND v.city_id = $${pIdx++}`; }
        if (keyword) { params.push(`%${keyword}%`); queryStr += ` AND (v.shop_name ILIKE $${pIdx} OR u.email ILIKE $${pIdx} OR u.name ILIKE $${pIdx++})`; }

        queryStr += ` ORDER BY v.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
        const result = await db.query(queryStr, [...params, limit, offset]);

        let countQuery = `SELECT COUNT(*)::int FROM vendors v JOIN users u ON v.user_id = u.user_id WHERE 1=1`;
        const countParams: any[] = [];
        let cIdx = 1;

        if (status === "active") countQuery += ` AND v.is_active = true`;
        else if (status === "inactive") countQuery += ` AND v.is_active = false`;
        else if (status === "unverified") countQuery += ` AND v.is_verified = false`;

        if (city_id) { countParams.push(city_id); countQuery += ` AND v.city_id = $${cIdx++}`; }
        if (keyword) { countParams.push(`%${keyword}%`); countQuery += ` AND (v.shop_name ILIKE $${cIdx} OR u.email ILIKE $${cIdx} OR u.name ILIKE $${cIdx++})`; }

        const countRes = await db.query(countQuery, countParams);
        const total = countRes.rows[0].count;

        return NextResponse.json({ rows: result.rows, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });

    } catch (error: any) {
        console.error("Admin Vendors GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/v1/admin/vendors
// Create vendor (creates user + vendor row, sends credentials email)
export async function POST(req: NextRequest) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const { shop_name, email, password: tempPassword, contact_number, whatsapp_number, address, city_id, area } = body;

        if (!shop_name || !email || !tempPassword) {
            return NextResponse.json({ error: "Shop name, email and temporary password are required" }, { status: 400 });
        }

        const userExists = await db.query(`SELECT user_id FROM users WHERE email = $1`, [email]);
        if ((userExists.rowCount ?? 0) > 0) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await db.query("BEGIN");
        try {
            const userRes = await db.query(
                `INSERT INTO users (name, email, password, role, city_id, created_at) VALUES ($1, $2, $3, 'vendor', $4, NOW()) RETURNING user_id`,
                [shop_name, email, hashedPassword, city_id || null]
            );
            const userId = userRes.rows[0].user_id;

            const vendorRes = await db.query(
                `INSERT INTO vendors (user_id, shop_name, address, area, city_id, contact_number, whatsapp_number, is_active, is_verified, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, NOW(), NOW()) RETURNING *`,
                [userId, shop_name, address, area || null, city_id || null, contact_number || null, whatsapp_number || null]
            );

            await db.query("COMMIT");

            try {
                await sendEmail({
                    to: email,
                    subject: "Welcome to Paltuu Vendor Panel",
                    html: `<h2>Welcome to Paltuu!</h2>
                           <p>Your vendor account has been created.</p>
                           <p><strong>Email:</strong> ${email}</p>
                           <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                           <p>Please log in and change your password immediately.</p>`
                });
            } catch (emailErr) {
                console.error("Failed to send credentials email:", emailErr);
            }

            return NextResponse.json(vendorRes.rows[0], { status: 201 });

        } catch (e) {
            await db.query("ROLLBACK");
            throw e;
        }

    } catch (error: any) {
        console.error("Admin Vendors POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
