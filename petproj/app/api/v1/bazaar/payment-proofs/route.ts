import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";
import { BazaarNotifications } from "@/lib/notifications";

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
                pp.proof_id,
                pp.order_id,
                pp.user_id,
                pp.image_url,
                pp.uploaded_at,
                pp.verification_status,
                pp.verified_by,
                pp.verified_at,
                pp.admin_notes,
                bo.order_number,
                bo.customer_name,
                bo.customer_email,
                bo.payment_method,
                bo.payment_status
            FROM bazaar_payment_proofs pp
            LEFT JOIN bazaar_orders bo ON pp.order_id = bo.order_id
            WHERE pp.order_id = $1
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

        // Update payment proof verification
        const proofQuery = `
            UPDATE bazaar_payment_proofs
            SET
                verification_status = $1,
                admin_notes = $2,
                verified_by = $3,
                verified_at = NOW()
            WHERE proof_id = $4
            RETURNING *
        `;

        const proofResult = await db.query(proofQuery, [status, adminNotes, user.user_id, proofId]);

        if ((proofResult.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Payment proof not found" }, { status: 404 });
        }

        // Update corresponding order's payment status
        const proof = proofResult.rows[0];
        const orderPaymentStatus = status === 'approved' ? 'paid' : 'failed';

        const orderQuery = `
            UPDATE bazaar_orders
            SET
                payment_status = $1,
                updated_at = NOW()
            WHERE order_id = $2
            RETURNING user_id, order_number
        `;

        const orderRes = await db.query(orderQuery, [orderPaymentStatus, proof.order_id]);
        const order = orderRes.rows[0];

        // Send notification (fire-and-forget)
        if (status === 'approved' && order?.user_id) {
            BazaarNotifications.onPaymentVerified(
                order.user_id,
                proof.order_id,
                order.order_number
            ).catch(() => {});
        }

        return NextResponse.json({
            success: true,
            proof: proofResult.rows[0],
            message: `Payment proof ${status === 'approved' ? 'verified' : 'rejected'} successfully`
        });

    } catch (error) {
        console.error("V1 Payment Proof PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
