import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/bazaar/payment-proofs:
 *   get:
 *     summary: Get payment proof for an order (V1)
 *     tags: [v1 Bazaar]
 *   patch:
 *     summary: Verify payment proof (V1)
 *     tags: [v1 Bazaar]
 */

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

        const query = `
            SELECT 
                order_id as proof_id, 
                order_number, 
                customer_name, 
                customer_email, 
                payment_proof_url as image_url, 
                payment_status as verification_status,
                notes as admin_notes,
                created_at as uploaded_at
            FROM bazaar_orders
            WHERE order_id = $1 AND payment_proof_url IS NOT NULL
        `;

        const result = await db.query(query, [orderId]);
        
        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json({ proof: null });
        }

        return NextResponse.json({ proof: result.rows[0] });

    } catch (error) {
        console.error("V1 Payment Proof GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { proofId, status, adminNotes } = await req.json();

        if (!proofId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // Map status to payment_status
        const paymentStatus = status === 'approved' ? 'paid' : 'failed';

        const query = `
            UPDATE bazaar_orders
            SET 
                payment_status = $1,
                notes = $2,
                updated_at = NOW()
            WHERE order_id = $3
            RETURNING *
        `;

        const result = await db.query(query, [paymentStatus, adminNotes, proofId]);

        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, order: result.rows[0] });

    } catch (error) {
        console.error("V1 Payment Proof PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
