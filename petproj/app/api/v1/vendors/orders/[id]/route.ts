import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkVendor } from "../../vendorAuth";
import { BazaarNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// PUT /api/v1/vendors/orders/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const auth = await checkVendor(req);
        if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const vendorId = auth.vendor.vendor_id;
        const body = await req.json();
        const { status, cancellation_reason } = body;

        const allowedStatuses = ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'];
        if (status && !allowedStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const allowedFields = ['status', 'cancellation_reason'];
        const setClause: string[] = [];
        const values: any[] = [params.id, vendorId];

        Object.keys(body).forEach((key) => {
            if (allowedFields.includes(key)) {
                values.push(body[key]);
                setClause.push(`${key} = $${values.length}`);
            }
        });

        if (setClause.length === 0) return NextResponse.json({ error: "No updates provided" }, { status: 400 });

        const result = await db.query(
            `UPDATE vendor_orders SET ${setClause.join(', ')} WHERE vendor_order_id = $1 AND vendor_id = $2 RETURNING *`,
            values
        );

        if ((result.rowCount ?? 0) === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        const updatedOrder = result.rows[0];

        // Send Notifications
        if (status === 'dispatched' || status === 'delivered') {
            const parentOrderRes = await db.query('SELECT user_id, order_number FROM bazaar_orders WHERE order_id = $1', [updatedOrder.order_id]);
            const parentOrder = parentOrderRes.rows[0];
            if (parentOrder?.user_id) {
                if (status === 'dispatched') {
                    BazaarNotifications.onOrderShipped(parentOrder.user_id, parentOrder.order_id).catch(() => {});
                } else if (status === 'delivered') {
                    BazaarNotifications.onOrderDelivered(parentOrder.user_id, parentOrder.order_id).catch(() => {});
                }
            }
        }

        return NextResponse.json(updatedOrder);

    } catch (error: any) {
        console.error("Vendor Order PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
