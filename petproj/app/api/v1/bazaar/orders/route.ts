import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";
import { sendOrderEmails } from "@/utils/mailjet";
import { BazaarNotifications } from "@/lib/notifications";

/**
 * @swagger
 * /api/v1/bazaar/orders:
 *   get:
 *     summary: Get user order history (V1)
 *     tags: [v1 Bazaar]
 *   post:
 *     summary: Place a new order (V1)
 *     tags: [v1 Bazaar]
 */

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const isAdmin = searchParams.get('admin') === 'true';
        const status = searchParams.get('status');

        if (isAdmin && user.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let query = `
            SELECT
                o.*,
                COALESCE(
                    (SELECT json_agg(oi.*) FROM bazaar_order_items oi WHERE oi.order_id = o.order_id),
                    '[]'::json
                ) as items
            FROM bazaar_orders o
        `;

        const params: any[] = [];
        const conditions: string[] = [];

        if (!isAdmin) {
            params.push(user.user_id);
            conditions.push(`o.user_id = $${params.length}`);
        }

        if (status) {
            params.push(status);
            conditions.push(`o.status = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        query += ` ORDER BY o.created_at DESC`;

        const result = await db.query(query, params);
        return NextResponse.json(result.rows);

    } catch (error) {
        console.error("V1 Orders GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, updates } = body;

        if (!orderId || !updates) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const allowedUpdates = [
            'status', 'payment_status', 'tracking_number',
            'shipped_at', 'delivered_at', 'notes'
        ];

        const setClause: string[] = [];
        const params: any[] = [orderId];

        Object.keys(updates).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                params.push(updates[key]);
                setClause.push(`${key} = $${params.length}`);
            }
        });

        if (setClause.length === 0) {
            return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
        }

        const query = `
            UPDATE bazaar_orders
            SET ${setClause.join(', ')}, updated_at = NOW()
            WHERE order_id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);

        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, order: result.rows[0] });

    } catch (error) {
        console.error("V1 Orders PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        const body = await req.json();
        const {
            cartId,
            sessionId,
            customerInfo,
            shippingAddress,
            paymentMethod = 'cod',
            paymentProofUrl,
            shippingAmount = 0,
            discountAmount = 0,
            notes
        } = body;

        // Validation: Require either userId (logged in) or sessionId (guest)
        if (!userId && !sessionId) {
            return NextResponse.json({ error: "Authentication or Session ID required" }, { status: 401 });
        }

        const validation = validate({ cartId, customerInfo, shippingAddress }, {
            cartId: { required: true },
            customerInfo: { required: true },
            shippingAddress: { required: true }
        });

        if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 400 });

        // Transactional Order Placement (Split-Cart Multi-Vendor)
        await db.query('BEGIN');
        try {
            // 1. Get Cart Items with Vendor Info
            const cartRes = await db.query(`
                SELECT
                    ci.*,
                    COALESCE(vi.selling_price, p.price) as unit_price,
                    p.title as product_title, p.sku as product_sku,
                    v.vendor_id, v.flat_delivery_fee, v.per_kg_delivery_fee, v.free_delivery_threshold
                FROM bazaar_cart_items ci
                JOIN bazaar_products p ON ci.product_id = p.product_id
                LEFT JOIN vendor_inventory vi ON ci.inventory_id = vi.inventory_id
                LEFT JOIN vendors v ON ci.vendor_id = v.vendor_id
                WHERE ci.cart_id = $1
            `, [cartId]);

            if ((cartRes.rowCount ?? 0) === 0) throw new Error("Cart is empty");

            // 2. Group items by Vendor and Calculate Delivery
            const vendorGroups: Record<number | string, any> = {};
            let totalSubtotal = 0;

            cartRes.rows.forEach(item => {
                const vid = item.vendor_id || 'platform'; // Fallback for platform-listed items
                if (!vendorGroups[vid]) {
                    vendorGroups[vid] = {
                        items: [],
                        subtotal: 0,
                        delivery_fee: 0,
                        config: {
                            flat: Number(item.flat_delivery_fee || 0),
                            free_threshold: Number(item.free_delivery_threshold || 999999)
                        }
                    };
                }
                vendorGroups[vid].items.push(item);
                vendorGroups[vid].subtotal += (Number(item.unit_price) * item.quantity);
                totalSubtotal += (Number(item.unit_price) * item.quantity);
            });

            // Calculate total delivery fee (sum of individual vendor fees)
            let totalShipping = 0;
            Object.keys(vendorGroups).forEach(vid => {
                const group = vendorGroups[vid];
                if (group.subtotal < group.config.free_threshold) {
                    group.delivery_fee = group.config.flat;
                } else {
                    group.delivery_fee = 0;
                }
                totalShipping += group.delivery_fee;
            });

            const totalAmount = (totalSubtotal + totalShipping) - Number(discountAmount);
            const orderNumber = `PALTUU-${Date.now().toString(36).toUpperCase()}`;

            // 3. Create Parent Order
            const orderRes = await db.query(`
                INSERT INTO bazaar_orders (
                    user_id, session_id, order_number, status, subtotal, total_amount,
                    shipping_amount, discount_amount, currency,
                    customer_email, customer_phone, customer_name, shipping_address,
                    payment_method, payment_status, payment_proof_url, notes, created_at
                ) VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, 'PKR', $8, $9, $10, $11, $12, 'pending', $13, $14, CURRENT_TIMESTAMP)
                RETURNING *
            `, [
                userId || null, sessionId || null, orderNumber,
                totalSubtotal, totalAmount, totalShipping, discountAmount,
                customerInfo.email, customerInfo.phone, customerInfo.name,
                JSON.stringify(shippingAddress), paymentMethod,
                paymentProofUrl || null, notes
            ]);
            const parentOrder = orderRes.rows[0] as { order_id: number; [key: string]: any };

            // 4. Create Vendor Orders (Children) and Order Items
            for (const vid of Object.keys(vendorGroups)) {
                const group = vendorGroups[vid];

                // Create Vendor Order if it's an actual vendor (not platform)
                let vendorOrderId = null;
                if (vid !== 'platform') {
                    const vOrderRes = await db.query(`
                        INSERT INTO vendor_orders (
                            order_id, vendor_id, status, subtotal, delivery_fee, total, created_at
                        ) VALUES ($1, $2, 'pending', $3, $4, $5, CURRENT_TIMESTAMP)
                        RETURNING vendor_order_id
                    `, [parentOrder.order_id, vid, group.subtotal, group.delivery_fee, group.subtotal + group.delivery_fee]);
                    vendorOrderId = vOrderRes.rows[0].vendor_order_id;

                    // Notify the vendor
                    BazaarNotifications.onNewVendorOrder(
                        parseInt(vid as string, 10),
                        vendorOrderId,
                        customerInfo.name,
                        group.items.length
                    ).catch(() => {});
                }

                for (const item of group.items) {
                    await db.query(`
                        INSERT INTO bazaar_order_items (
                            order_id, vendor_id, inventory_id, vendor_order_id,
                            product_id, variant_id, quantity, unit_price, total_price, product_title
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    `, [
                        parentOrder.order_id, item.vendor_id, item.inventory_id, vendorOrderId,
                        item.product_id, item.variant_id, item.quantity,
                        item.unit_price, Number(item.unit_price) * item.quantity, item.product_title
                    ]);
                }
            }

            // 5. Clear Cart
            await db.query('DELETE FROM bazaar_cart_items WHERE cart_id = $1', [cartId]);

            await db.query('COMMIT');

            // Send notification (fire-and-forget) after transaction succeeds
            if (userId && typeof userId === 'number') {
                BazaarNotifications.onOrderConfirmed(
                    userId,
                    parentOrder.order_id,
                    orderNumber
                ).catch(() => {});
            } else if (userId && typeof userId === 'string') {
                BazaarNotifications.onOrderConfirmed(
                    parseInt(userId),
                    parentOrder.order_id,
                    orderNumber
                ).catch(() => {});
            }

            // Emails and background tasks
            sendOrderEmails({ ...parentOrder, items: cartRes.rows } as any).catch(console.error);

            return NextResponse.json({ success: true, order: parentOrder }, { status: 201 });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Orders POST error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}

