import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    try {
        await client.connect();
        const query = `
            SELECT c.*, u.email as owner_email 
            FROM clinics c
            LEFT JOIN users u ON c.owner_id = u.user_id
            ORDER BY c.created_at DESC;
        `;
        const result = await client.query(query);
        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.error("Error fetching clinics:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    try {
        const body = await req.json();
        const {
            name, address, google_maps_link, contact_number, whatsapp_number,
            logo_url, operating_hours, discount_details, is_paltuu_partner,
            owner_email // Optional owner email
        } = body;

        if (!name || !address) {
            return NextResponse.json({ error: "Name and address are required" }, { status: 400 });
        }

        await client.connect();
        await client.query('BEGIN');

        let owner_id = null;
        if (owner_email) {
            // Check if user exists
            let userResult = await client.query("SELECT user_id FROM users WHERE email = $1", [owner_email]);
            if (userResult.rows.length > 0) {
                owner_id = userResult.rows[0].user_id;
            } else {
                // Create user
                const defaultPassword = "12345";
                userResult = await client.query(
                    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'user') RETURNING user_id",
                    [name, owner_email, defaultPassword]
                );
                owner_id = userResult.rows[0].user_id;
            }
        }

        const query = `
            INSERT INTO clinics (
                name, address, google_maps_link, contact_number, whatsapp_number,
                logo_url, operating_hours, discount_details, is_paltuu_partner, owner_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;
        const values = [
            name, address, google_maps_link, contact_number, whatsapp_number,
            logo_url, operating_hours, discount_details, is_paltuu_partner || false, owner_id
        ];
        
        const result = await client.query(query, values);
        await client.query('COMMIT');
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error creating clinic:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    try {
        const body = await req.json();
        const {
            clinic_id, name, address, google_maps_link, contact_number, whatsapp_number,
            logo_url, operating_hours, discount_details, is_paltuu_partner,
            owner_email
        } = body;

        if (!clinic_id) {
            return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
        }

        await client.connect();
        await client.query('BEGIN');

        let owner_id = undefined;
        if (owner_email !== undefined) {
            if (owner_email === null || owner_email === "") {
                owner_id = null;
            } else {
                let userResult = await client.query("SELECT user_id FROM users WHERE email = $1", [owner_email]);
                if (userResult.rows.length > 0) {
                    owner_id = userResult.rows[0].user_id;
                } else {
                    const defaultPassword = "12345";
                    userResult = await client.query(
                        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'user') RETURNING user_id",
                        [name || 'Clinic Owner', owner_email, defaultPassword]
                    );
                    owner_id = userResult.rows[0].user_id;
                }
            }
        }
        
        const updateFields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (name !== undefined) { updateFields.push(`name = $${index++}`); values.push(name); }
        if (address !== undefined) { updateFields.push(`address = $${index++}`); values.push(address); }
        if (google_maps_link !== undefined) { updateFields.push(`google_maps_link = $${index++}`); values.push(google_maps_link); }
        if (contact_number !== undefined) { updateFields.push(`contact_number = $${index++}`); values.push(contact_number); }
        if (whatsapp_number !== undefined) { updateFields.push(`whatsapp_number = $${index++}`); values.push(whatsapp_number); }
        if (logo_url !== undefined) { updateFields.push(`logo_url = $${index++}`); values.push(logo_url); }
        if (operating_hours !== undefined) { updateFields.push(`operating_hours = $${index++}`); values.push(operating_hours); }
        if (discount_details !== undefined) { updateFields.push(`discount_details = $${index++}`); values.push(discount_details); }
        if (is_paltuu_partner !== undefined) { updateFields.push(`is_paltuu_partner = $${index++}`); values.push(is_paltuu_partner); }
        if (owner_id !== undefined) { updateFields.push(`owner_id = $${index++}`); values.push(owner_id); }

        if (updateFields.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        values.push(clinic_id);
        const query = `
            UPDATE clinics SET ${updateFields.join(', ')}
            WHERE clinic_id = $${index}
            RETURNING *;
        `;
        
        const result = await client.query(query, values);
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        await client.query('COMMIT');
        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error updating clinic:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    try {
        const body = await req.json();
        const { clinic_id } = body;

        if (!clinic_id) {
            return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
        }

        await client.connect();
        const query = `DELETE FROM clinics WHERE clinic_id = $1 RETURNING *;`;
        const result = await client.query(query, [clinic_id]);
        
        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Clinic deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting clinic:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
