import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db/ecom';
import { sendOrderEmails } from '@/utils/mailjet';
import { getUserIdFromRequest } from '@/utils/authServer';

export const revalidate = 0;

// POST - Create order with payment proof (for bank transfer orders)
export async function POST(req: NextRequest) {
  const pool = getPool();
  try {
    // Extract userId from server-side cookie (secure)
    const userId = await getUserIdFromRequest(req);

    const body = await req.json();
    const { sessionId, cartData, paymentProofUrl } = body;

    console.log('📥 Create Order - Authenticated userId:', userId, 'SessionId:', sessionId);

    if (!cartData) {
      return NextResponse.json({ error: 'Cart data is required' }, { status: 400 });
    }

    if (!paymentProofUrl) {
      return NextResponse.json({ error: 'Payment proof is required for bank transfer orders' }, { status: 400 });
    }

    const conn = await pool.connect();
    try {
      // Start transaction
      await conn.query('BEGIN');

      try {
        // 1. Fetch cart items from database
        let cartItems: any[] = [];
        if (cartData.cartId) {
          const cartItemsRes = await conn.query(
            `SELECT ci.*, p.title AS product_title, p.price AS product_price,
             pv.title AS variant_title, pv.price_override AS variant_price, pv.sku AS variant_sku
             FROM bazaar_cart_items ci
             JOIN bazaar_products p ON ci.product_id = p.product_id
             LEFT JOIN bazaar_product_variants pv ON ci.variant_id = pv.variant_id
             WHERE ci.cart_id = $1`,
            [cartData.cartId]
          );
          cartItems = cartItemsRes.rows;
        }

        if (cartItems.length === 0) {
          await conn.query('ROLLBACK');
          return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // 2. Calculate totals
        let subtotal = 0;
        for (const item of cartItems) {
          const price = item.variant_price || item.product_price || 0;
          const quantity = item.quantity || 1;
          subtotal += price * quantity;
        }

        const shippingAmount = cartData.shippingAmount || 0;
        const discountAmount = cartData.discountAmount || 0;
        const totalAmount = subtotal + shippingAmount - discountAmount;

        // 3. Generate unique order number
        const orderNumber = `paltuu-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        // 4. Create order with bank_transfer payment method and pending status
        const orderQuery = `
          INSERT INTO bazaar_orders (
            user_id, session_id, order_number, status, subtotal, shipping_amount,
            discount_amount, total_amount, currency, customer_email, customer_phone,
            customer_name, shipping_address, billing_address, payment_method,
            payment_status, payment_reference, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `;

        const orderValues = [
          userId || null,
          sessionId || null,
          orderNumber,
          'pending', // Order status pending until payment verified
          subtotal,
          shippingAmount,
          discountAmount,
          totalAmount,
          'PKR',
          cartData.customerInfo?.email || null,
          cartData.customerInfo?.phone || null,
          cartData.customerInfo?.name || null,
          JSON.stringify(cartData.shippingAddress || {}),
          JSON.stringify(cartData.billingAddress || {}),
          'bank_transfer',
          'pending', // Payment status pending until admin verifies
          paymentProofUrl, // Store payment proof URL in payment_reference
          cartData.notes || ''
        ];

        const orderResult = await conn.query(orderQuery, orderValues);
        const order = orderResult.rows[0];

        // 5. Create order items
        for (const item of cartItems) {
          const price = item.variant_price || item.product_price || 0;
          const quantity = item.quantity || 1;
          const totalPrice = price * quantity;

          const itemQuery = `
            INSERT INTO bazaar_order_items (
              order_id, product_id, variant_id, quantity, unit_price, total_price,
              product_title, product_sku, variant_title, variant_sku, variant_attributes, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
          `;

          await conn.query(itemQuery, [
            order.order_id,
            item.product_id,
            item.variant_id || null,
            quantity,
            price,
            totalPrice,
            item.product_title || 'Unknown Product',
            item.product_sku || null,
            item.variant_title || null,
            item.variant_sku || null,
            null
          ]);
        }

        // 6. Create payment proof record
        const proofQuery = `
          INSERT INTO bazaar_payment_proofs (
            order_id, user_id, session_id, image_url, verification_status, uploaded_at
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          RETURNING *
        `;

        const proofResult = await conn.query(proofQuery, [
          order.order_id,
          userId || null,
          sessionId || null,
          paymentProofUrl,
          'pending' // Pending verification by admin
        ]);

        // 7. Clear cart items
        if (cartData.cartId) {
          await conn.query('DELETE FROM bazaar_cart_items WHERE cart_id = $1', [cartData.cartId]);
        }

        // Commit transaction
        await conn.query('COMMIT');

        // 8. Fetch complete order with items
        const completeOrderQuery = `
          SELECT o.*,
            json_agg(
              json_build_object(
                'order_item_id', oi.order_item_id,
                'product_id', oi.product_id,
                'variant_id', oi.variant_id,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'total_price', oi.total_price,
                'product_title', oi.product_title,
                'variant_title', oi.variant_title
              )
            ) AS items
          FROM bazaar_orders o
          LEFT JOIN bazaar_order_items oi ON o.order_id = oi.order_id
          WHERE o.order_id = $1
          GROUP BY o.order_id
        `;

        const completeOrderResult = await conn.query(completeOrderQuery, [order.order_id]);
        const completeOrder = completeOrderResult.rows[0];

        // Send order notification emails (customer + admin) - non-blocking
        try {
          sendOrderEmails(completeOrder).catch((err: any) =>
            console.warn('Email send failed for bank transfer order', err)
          );
        } catch (e) {
          console.warn('Email send scheduling failed', e);
        }

        return NextResponse.json({
          success: true,
          order: completeOrder,
          proof: proofResult.rows[0],
          message: 'Order created successfully. Payment proof uploaded for verification.'
        });

      } catch (error) {
        await conn.query('ROLLBACK');
        throw error;
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Create order with payment error:', err);
    return NextResponse.json(
      { error: 'Failed to create order', details: (err as Error).message },
      { status: 500 }
    );
  }
}
