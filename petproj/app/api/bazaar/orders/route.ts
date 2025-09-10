import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../db/ecom';

export const revalidate = 0;

// GET orders (with optional filtering)
export async function GET(req: NextRequest) {
  const client = createClient();
  try {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('sessionId');
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const adminView = searchParams.get('admin') === 'true';

    await client.connect();

    let query = `
      SELECT
        o.order_id,
        o.user_id,
        o.session_id,
        o.order_number,
        o.status,
        o.subtotal,
        o.shipping_amount,
        o.discount_amount,
        o.total_amount,
        o.currency,
        o.customer_email,
        o.customer_phone,
        o.customer_name,
        o.shipping_address,
        o.billing_address,
        o.payment_method,
        o.payment_status,
        o.payment_reference,
        o.notes,
        o.admin_notes,
        o.tracking_number,
        o.created_at,
        o.updated_at,
        o.shipped_at,
        o.delivered_at,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'order_item_id', oi.order_item_id,
              'product_id', oi.product_id,
              'variant_id', oi.variant_id,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'product_title', oi.product_title,
              'product_sku', oi.product_sku,
              'variant_title', oi.variant_title,
              'variant_sku', oi.variant_sku,
              'variant_attributes', oi.variant_attributes
            )
          ) FROM bazaar_order_items oi WHERE oi.order_id = o.order_id),
          '[]'::json
        ) as items
      FROM bazaar_orders o
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (orderId) {
      paramCount++;
      query += ` AND o.order_id = $${paramCount}`;
      params.push(orderId);
    }

    if (userId && !adminView) {
      paramCount++;
      query += ` AND o.user_id = $${paramCount}`;
      params.push(userId);
    }

    // allow guest users to fetch by session id
    if (sessionId && !adminView) {
      paramCount++;
      query += ` AND o.session_id = $${paramCount}`;
      params.push(sessionId);
    }

    // allow searching by order number
    if (orderNumber) {
      paramCount++;
      query += ` AND o.order_number = $${paramCount}`;
      params.push(orderNumber);
    }

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC`;

    const result = await client.query(query, params);
    return NextResponse.json(result.rows);

  } catch (err) {
    console.error('Orders fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  } finally {
    try { await client.end(); } catch { }
  }
}

// POST - Create new order
export async function POST(req: NextRequest) {
  const client = createClient();
  try {
    const body = await req.json();
    const {
      userId,
      sessionId,
      cartId,
      customerInfo,
      shippingAddress,
      billingAddress,
      paymentMethod = 'cod',
      notes
    } = body;

    if (!cartId || !customerInfo || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required order information' }, { status: 400 });
    }

    await client.connect();
    await client.query('BEGIN');

    try {
      // Get cart items with pricing
      const cartItemsQuery = `
        SELECT
          ci.product_id,
          ci.variant_id,
          ci.quantity,
          p.title as product_title,
          p.sku as product_sku,
          p.price as product_price,
          pv.title as variant_title,
          pv.sku as variant_sku,
          pv.price_override as variant_price,
          pv.compare_at_price as compare_at_price,
          pv.attributes as variant_attributes,
          COALESCE(pv.price_override, p.price) as effective_price
        FROM bazaar_cart_items ci
        JOIN bazaar_products p ON ci.product_id = p.product_id
        LEFT JOIN bazaar_product_variants pv ON ci.variant_id = pv.variant_id
        WHERE ci.cart_id = $1
      `;

      const cartItems = await client.query(cartItemsQuery, [cartId]);

      if (cartItems.rows.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate totals
      let subtotal = 0;
      cartItems.rows.forEach(item => {
        subtotal += parseFloat(item.effective_price) * item.quantity;
      });

      // const taxAmount = 0; // You can implement tax calculation here
      const shippingAmount = 0; // You can implement shipping calculation here
      const discountAmount = 0; // You can implement discount calculation here
      const totalAmount = subtotal + shippingAmount - discountAmount;

  // Generate compact order number prefixed with 'paltuu-'
  // Use a timestamp-based base36 segment plus a short random suffix to keep it short and reasonably unique
  const shortId = Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).substr(2, 4).toUpperCase();
  const orderNumber = `paltuu-${shortId}`;

      // Create order
      const orderQuery = `
        INSERT INTO bazaar_orders (
          user_id, session_id, order_number, status, subtotal,
          shipping_amount, discount_amount, total_amount, currency,
          customer_email, customer_phone, customer_name,
          shipping_address, billing_address, payment_method,
          payment_status, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'pending', $4, $5, $6, $7, 'PKR',
          $8, $9, $10, $11, $12, $13, 'pending', $14, NOW(), NOW()
        ) RETURNING *
      `;

      const orderValues = [
        userId || null,
        sessionId || null,
        orderNumber,
        subtotal,
        shippingAmount,
        discountAmount,
        totalAmount,
        customerInfo.email,
        customerInfo.phone,
        customerInfo.name,
        JSON.stringify(shippingAddress),
        JSON.stringify(billingAddress || shippingAddress),
        paymentMethod,
        notes
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];

      // Create order items and decrement stock where applicable
      for (const item of cartItems.rows) {
        // Check stock for variant if variant_id present
        if (item.variant_id) {
          const stockRes = await client.query('SELECT stock FROM bazaar_product_variants WHERE variant_id = $1 FOR UPDATE', [item.variant_id]);
          const currentStock = stockRes.rows[0] ? parseInt(stockRes.rows[0].stock || 0) : 0;
          if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for variant ${item.variant_id}`);
          }
          // decrement stock
          await client.query('UPDATE bazaar_product_variants SET stock = stock - $1, updated_at = NOW() WHERE variant_id = $2', [item.quantity, item.variant_id]);
        } else {
          // If no variant, optionally check product-level stock aggregate or skip
        }

        const orderItemQuery = `
          INSERT INTO bazaar_order_items (
            order_id, product_id, variant_id, quantity, unit_price, total_price,
            product_title, product_sku, variant_title, variant_sku, variant_attributes, compare_at_price, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        `;

        const itemUnitPrice = parseFloat(item.effective_price);
        const itemTotalPrice = itemUnitPrice * item.quantity;

        await client.query(orderItemQuery, [
          order.order_id,
          item.product_id,
          item.variant_id,
          item.quantity,
          itemUnitPrice,
          itemTotalPrice,
          item.product_title,
          item.product_sku,
          item.variant_title,
          item.variant_sku,
          item.variant_attributes,
          item.compare_at_price || null
        ]);
      }

  // Clear cart after successful order creation
  await client.query('DELETE FROM bazaar_cart_items WHERE cart_id = $1', [cartId]);

      await client.query('COMMIT');

      return NextResponse.json({
        order,
        message: 'Order created successfully'
      }, { status: 201 });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Create order error:', err);
    return NextResponse.json({
      error: 'Failed to create order',
      message: (err as Error).message
    }, { status: 500 });
  } finally {
    try { await client.end(); } catch { }
  }
}

// PATCH - Admin updates to orders (mark delivered, update payment status, tracking, admin notes)
export async function PATCH(req: NextRequest) {
  const client = createClient();
  try {
    const body = await req.json();
    const { orderId, orderNumber, updates } = body; // updates: { status, payment_status, tracking_number, admin_notes, shipped_at, delivered_at }

    if (!orderId && !orderNumber) {
      return NextResponse.json({ error: 'orderId or orderNumber required' }, { status: 400 });
    }

    const allowed = ['status', 'payment_status', 'tracking_number', 'admin_notes', 'shipped_at', 'delivered_at'];
    const setClauses: string[] = [];
    const params: any[] = [];
    let idx = 0;

    for (const key of Object.keys(updates || {})) {
      if (!allowed.includes(key)) continue;
      idx++;
      setClauses.push(`${key} = $${idx}`);
      params.push(updates[key]);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await client.connect();

    // Add identifying param
    const whereIdx = ++idx;
    if (orderId) {
      params.push(orderId);
    } else {
      params.push(orderNumber);
    }

    const whereClause = orderId ? `order_id = $${whereIdx}` : `order_number = $${whereIdx}`;

    const updateQuery = `UPDATE bazaar_orders SET ${setClauses.join(', ')}, updated_at = NOW() WHERE ${whereClause} RETURNING *`;

    const res = await client.query(updateQuery, params);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = res.rows[0];

    // Re-fetch the order with items to return the same shape as GET
    const fullQuery = `
      SELECT
        o.order_id,
        o.user_id,
        o.session_id,
        o.order_number,
        o.status,
        o.subtotal,
        o.shipping_amount,
        o.discount_amount,
        o.total_amount,
        o.currency,
        o.customer_email,
        o.customer_phone,
        o.customer_name,
        o.shipping_address,
        o.billing_address,
        o.payment_method,
        o.payment_status,
        o.payment_reference,
        o.notes,
        o.admin_notes,
        o.tracking_number,
        o.created_at,
        o.updated_at,
        o.shipped_at,
        o.delivered_at,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'order_item_id', oi.order_item_id,
              'product_id', oi.product_id,
              'variant_id', oi.variant_id,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'product_title', oi.product_title,
              'product_sku', oi.product_sku,
              'variant_title', oi.variant_title,
              'variant_sku', oi.variant_sku,
              'variant_attributes', oi.variant_attributes
            )
          ) FROM bazaar_order_items oi WHERE oi.order_id = o.order_id),
          '[]'::json
        ) as items
      FROM bazaar_orders o
      WHERE o.order_id = $1
    `;

    const fullRes = await client.query(fullQuery, [updated.order_id]);
    const full = fullRes.rows[0] || updated;

    return NextResponse.json({ order: full });

  } catch (err) {
    console.error('Orders update error:', err);
    return NextResponse.json({ error: 'Failed to update order', message: (err as Error).message }, { status: 500 });
  } finally {
    try { await client.end(); } catch { }
  }
}
