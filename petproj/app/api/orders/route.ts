import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../db/ecom';
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth/next";
import { authoptions } from "../auth/[...nextauth]/options";

export const revalidate = 0;

interface JWTPayload {
    id: string;
    name: string;
    email: string;
    role: string;
}

// GET orders for authenticated user
export async function GET(request: NextRequest) {
  let userId: string | null = null;

  try {
    // Try NextAuth session first
    const session = await getServerSession(authoptions);
    if (session?.user) {
      userId = (session.user as any).user_id || (session.user as any).id;
    }

    // If no NextAuth session, try JWT token from cookies
    if (!userId) {
      const token = request.cookies.get("token")?.value;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as JWTPayload;
          userId = decoded.id;
        } catch (jwtError) {
          console.error("JWT verification failed:", jwtError);
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please login to view your orders." },
        { status: 401 }
      );
    }

    // Get all orders for the user
    const ordersQuery = `
      SELECT
        o.order_id,
        o.order_number,
        o.status,
        o.subtotal,
        o.shipping_amount,
        o.discount_amount,
        o.total_amount,
        o.created_at,
        o.payment_status,
        o.tracking_number
      FROM bazaar_orders o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `;

    const pool = getPool();
    const ordersResult = await pool.query(ordersQuery, [userId]);

    if (ordersResult.rows.length === 0) {
      return NextResponse.json([]);
    }

    // For each order, get the items with product images
    const ordersWithItems = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsQuery = `
          SELECT
            oi.order_item_id,
            oi.product_id,
            oi.product_title,
            oi.product_sku,
            oi.variant_title,
            oi.variant_sku,
            oi.variant_attributes,
            oi.quantity,
            oi.unit_price,
            oi.total_price,
            oi.is_reviewed,
            COALESCE(
              (SELECT url FROM bazaar_product_media
               WHERE product_id = oi.product_id
               AND (is_primary = true OR ordering = 0)
               LIMIT 1),
              (SELECT url FROM bazaar_product_media
               WHERE product_id = oi.product_id
               LIMIT 1)
            ) as image_url
          FROM bazaar_order_items oi
          WHERE oi.order_id = $1
          ORDER BY oi.order_item_id
        `;

        const itemsResult = await pool.query(itemsQuery, [order.order_id]);

        return {
          order_id: order.order_id,
          order_number: order.order_number,
          status: order.status,
          subtotal: parseFloat(order.subtotal),
          shipping_amount: parseFloat(order.shipping_amount),
          discount_amount: parseFloat(order.discount_amount),
          total_amount: parseFloat(order.total_amount),
          created_at: order.created_at,
          payment_status: order.payment_status,
          tracking_number: order.tracking_number,
          items: itemsResult.rows.map((item: any) => ({
            ...item,
            unit_price: parseFloat(item.unit_price),
            total_price: parseFloat(item.total_price)
          }))
        };
      })
    );

    return NextResponse.json(ordersWithItems);

  } catch (err) {
    console.error('Orders fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}