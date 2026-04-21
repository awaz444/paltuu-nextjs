import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/bazaar/cart:
 *   get:
 *     summary: Get user cart (V1)
 *     tags: [v1 Bazaar]
 *   post:
 *     summary: Add/Update item in cart (V1)
 *     tags: [v1 Bazaar]
 */

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');

        if (!userId && !sessionId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

        // Find or Create Cart
        let cartRes = await db.query(`
            SELECT cart_id FROM bazaar_carts 
            WHERE (user_id = $1 OR session_id = $2) AND expires_at > NOW() 
            ORDER BY user_id DESC LIMIT 1
        `, [userId, sessionId]);

        let cartId;
        if ((cartRes.rowCount ?? 0) === 0) {
            // Auto-initialize cart to prevent frontend hydration issues
            const newCart = await db.query(`
                INSERT INTO bazaar_carts (user_id, session_id, expires_at)
                VALUES ($1, $2, NOW() + INTERVAL '30 days') RETURNING cart_id
            `, [userId, sessionId]);
            cartId = newCart.rows[0].cart_id;
        } else {
            cartId = cartRes.rows[0].cart_id;
        }

        // Fetch Items
        const items = await db.query(`
            SELECT 
                ci.cart_item_id, ci.product_id, ci.variant_id, ci.quantity,
                p.title as product_title, p.price as product_price,
                COALESCE(pv.price_override, p.price) as effective_price,
                (SELECT url FROM bazaar_product_media WHERE product_id = p.product_id LIMIT 1) as image_url
            FROM bazaar_cart_items ci
            JOIN bazaar_products p ON ci.product_id = p.product_id
            LEFT JOIN bazaar_product_variants pv ON ci.variant_id = pv.variant_id
            WHERE ci.cart_id = $1
        `, [cartId]);

        let totalPrice = 0;
        items.rows.forEach(item => totalPrice += (item.effective_price * item.quantity));

        return NextResponse.json({
            cart_id: cartId,
            items: items.rows,
            total_price: totalPrice
        });

    } catch (error) {
        console.error("V1 Cart GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        const body = await req.json();
        const { sessionId, productId, variantId, quantity = 1 } = body;

        if (!userId && !sessionId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

        // 1. Ensure Cart exists
        let cartRes = await db.query(`
            SELECT cart_id FROM bazaar_carts 
            WHERE (user_id = $1 OR session_id = $2) AND expires_at > NOW() 
            ORDER BY user_id DESC LIMIT 1
        `, [userId, sessionId]);

        let cartId;
        if ((cartRes.rowCount ?? 0) === 0) {
            const newCart = await db.query(`
                INSERT INTO bazaar_carts (user_id, session_id, created_at, updated_at, expires_at)
                VALUES ($1, $2, NOW(), NOW(), NOW() + INTERVAL '30 days') RETURNING cart_id
            `, [userId, sessionId]);
            cartId = newCart.rows[0].cart_id;
        } else {
            cartId = cartRes.rows[0].cart_id;
        }

        // 2. Add or Update Item
        const existing = await db.query(`
            SELECT cart_item_id FROM bazaar_cart_items 
            WHERE cart_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))
        `, [cartId, productId, variantId]);

        if ((existing.rowCount ?? 0) > 0) {
            await db.query(`
                UPDATE bazaar_cart_items SET quantity = quantity + $1, updated_at = NOW()
                WHERE cart_item_id = $2
            `, [quantity, existing.rows[0].cart_item_id]);
        } else {
            await db.query(`
                INSERT INTO bazaar_cart_items (cart_id, product_id, variant_id, quantity, added_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
            `, [cartId, productId, variantId, quantity]);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("V1 Cart POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const cartItemId = searchParams.get('cartItemId');
        if (!cartItemId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await db.query('DELETE FROM bazaar_cart_items WHERE cart_item_id = $1', [cartItemId]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("V1 Cart DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { cartItemId, quantity } = body;
        if (!cartItemId || quantity === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        if (quantity <= 0) {
            await db.query('DELETE FROM bazaar_cart_items WHERE cart_item_id = $1', [cartItemId]);
            return NextResponse.json({ deleted: true });
        } else {
            await db.query(`
                UPDATE bazaar_cart_items SET quantity = $1, updated_at = NOW()
                WHERE cart_item_id = $2
            `, [quantity, cartItemId]);
            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error("V1 Cart PUT Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
