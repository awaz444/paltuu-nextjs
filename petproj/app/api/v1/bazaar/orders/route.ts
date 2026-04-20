import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";
import { sendOrderEmails } from "@/utils/mailjet";

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
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const query = `
            SELECT
                o.*,
                COALESCE(
                    (SELECT json_agg(oi.*) FROM bazaar_order_items oi WHERE oi.order_id = o.order_id),
                    '[]'::json
                ) as items
            FROM bazaar_orders o
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC
        `;

        const result = await db.query(query, [userId]);
        return NextResponse.json(result.rows);

    } catch (error) {
        console.error("V1 Orders GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { cartId, customerInfo, shippingAddress, paymentMethod = 'cod', notes } = body;

        const validation = validate({ cartId, customerInfo, shippingAddress }, {
            cartId: { required: true },
            customerInfo: { required: true },
            shippingAddress: { required: true }
        });

        if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 400 });

        // Transactional Order Placement
        await db.query('BEGIN');
        try {
            // 1. Get Cart Items
            const cartRes = await db.query(`
                SELECT ci.*, COALESCE(pv.price_override, p.price) as unit_price, p.title as product_title
                FROM bazaar_cart_items ci
                JOIN bazaar_products p ON ci.product_id = p.product_id
                LEFT JOIN bazaar_product_variants pv ON ci.variant_id = pv.variant_id
                WHERE ci.cart_id = $1
            `, [cartId]);

            if (cartRes.rowCount === 0) throw new Error("Cart is empty");

            // 2. Calculate Totals
            let subtotal = 0;
            cartRes.rows.forEach(item => subtotal += (item.unit_price * item.quantity));
            const total = subtotal; // Simplified for V1 (add tax/shipping logic if needed)

            const orderNumber = `PALTUU-${Date.now().toString(36).toUpperCase()}`;

            // 3. Create Order
            const orderRes = await db.query(`
                INSERT INTO bazaar_orders (
                    user_id, order_number, status, subtotal, total_amount, currency,
                    customer_email, customer_phone, customer_name, shipping_address,
                    payment_method, payment_status, notes, created_at
                ) VALUES ($1, $2, 'pending', $3, $4, 'PKR', $5, $6, $7, $8, $9, 'pending', $10, CURRENT_TIMESTAMP)
                RETURNING *
            `, [userId, orderNumber, subtotal, total, customerInfo.email, customerInfo.phone, customerInfo.name, JSON.stringify(shippingAddress), paymentMethod, notes]);

            const order = orderRes.rows[0];

            // 4. Create Order Items
            for (const item of cartRes.rows) {
                await db.query(`
                    INSERT INTO bazaar_order_items (
                        order_id, product_id, variant_id, quantity, unit_price, total_price, product_title
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [order.order_id, item.product_id, item.variant_id, item.quantity, item.unit_price, item.unit_price * item.quantity, item.product_title]);
            }

            // 5. Clear Cart
            await db.query('DELETE FROM bazaar_cart_items WHERE cart_id = $1', [cartId]);

            await db.query('COMMIT');

            // Non-blocking email
            sendOrderEmails({ ...order, items: cartRes.rows }).catch(console.error);

            return NextResponse.json(order, { status: 201 });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Orders POST error:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}
