import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../../db/ecom';
import { sendOrderEmails } from '../../../../utils/mailjet';

// Helper: send order confirmation email. Prefers SMTP (nodemailer) when SMTP env vars are set,
// otherwise falls back to Brevo HTTP transactional API.
async function sendOrderConfirmationEmail(order: any) {
  try {
    const senderEmail = process.env.EMAIL_SENDER || process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.EMAIL_SENDER_NAME || 'Paltuu';

    if (!senderEmail) {
      console.warn('Sender email not configured - skipping email');
      return;
    }

  const itemsHtml = (order.items || [])
      .map((it: any) => {
        const variantDetails = it.variant_title ?
          `<div style="font-size:13px;color:#777;margin-top:3px;">${it.variant_title}</div>` : '';
        const skuInfo = (it.variant_sku || it.product_sku) ?
          `<div style="font-size:12px;color:#999;margin-top:2px;">SKU: ${it.variant_sku || it.product_sku}</div>` : '';

        return `
          <tr>
            <td style="padding:15px 20px;border-bottom:1px solid #eee;">
              <div style="font-weight:500;color:#333;font-size:15px;">${it.product_title || 'Product'}</div>
              ${variantDetails}
              ${skuInfo}
            </td>
            <td style="padding:15px 10px;text-align:center;border-bottom:1px solid #eee;color:#666;">
              ${it.quantity}
            </td>
            <td style="padding:15px 10px;text-align:center;border-bottom:1px solid #eee;color:#666;">
              Rs ${Number(it.unit_price||0).toLocaleString()}
            </td>
            <td style="padding:15px 20px;text-align:right;border-bottom:1px solid #eee;font-weight:600;color:#8B1538;">
              Rs ${Number(it.total_price||0).toLocaleString()}
            </td>
          </tr>
        `;
      })
      .join('');

    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - ${order.order_number}</title>
      </head>
      <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;line-height:1.6;">

        <div style="max-width:600px;margin:20px auto;background-color:#ffffff;box-shadow:0 0 10px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background-color:#8B1538;padding:30px 40px;text-align:center;">
            <div style="margin-bottom:20px;">
              <img src="https://www.paltuu.pk/paltu_logo.svg" alt="Paltuu" style="height:40px;display:block;margin:0 auto;" />
            </div>
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">
              Order Confirmation
            </h1>
            <p style="color:#ffffff;margin:10px 0 0 0;font-size:16px;opacity:0.9;">
              Thank you for your order, ${order.customer_name || 'valued customer'}!
            </p>
          </div>

          <!-- Content -->
          <div style="padding:40px;">

            <!-- Order Info -->
            <div style="margin-bottom:30px;">
              <h2 style="color:#8B1538;font-size:18px;margin:0 0 15px 0;font-weight:600;">Order Information</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#666;font-size:14px;width:30%;">Order Number:</td>
                  <td style="padding:8px 0;color:#333;font-size:14px;font-weight:600;">${order.order_number}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#666;font-size:14px;">Order Date:</td>
                  <td style="padding:8px 0;color:#333;font-size:14px;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#666;font-size:14px;">Payment Method:</td>
                  <td style="padding:8px 0;color:#333;font-size:14px;text-transform:uppercase;">${order.payment_method || 'COD'}</td>
                </tr>
              </table>
            </div>

            <!-- Items -->
            <div style="margin-bottom:30px;">
              <h2 style="color:#8B1538;font-size:18px;margin:0 0 15px 0;font-weight:600;">Order Items</h2>
              <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
                <thead>
                  <tr style="background-color:#f8f8f8;">
                    <th style="padding:15px 20px;text-align:left;font-weight:600;color:#333;font-size:14px;border-bottom:2px solid #8B1538;">Product</th>
                    <th style="padding:15px 10px;text-align:center;font-weight:600;color:#333;font-size:14px;border-bottom:2px solid #8B1538;">Qty</th>
                    <th style="padding:15px 10px;text-align:center;font-weight:600;color:#333;font-size:14px;border-bottom:2px solid #8B1538;">Price</th>
                    <th style="padding:15px 20px;text-align:right;font-weight:600;color:#333;font-size:14px;border-bottom:2px solid #8B1538;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Order Total -->
            <div style="background-color:#f8f8f8;padding:25px;border-left:4px solid #8B1538;margin-bottom:30px;">
              <div style="text-align:right;">
                <div style="margin-bottom:8px;">
                  <span style="color:#666;font-size:14px;">Subtotal: </span>
                  <span style="color:#333;font-size:14px;font-weight:500;">Rs ${Number(order.subtotal||0).toLocaleString()}</span>
                </div>
                ${order.shipping_amount > 0 ? `
                <div style="margin-bottom:8px;">
                  <span style="color:#666;font-size:14px;">Shipping: </span>
                  <span style="color:#333;font-size:14px;font-weight:500;">Rs ${Number(order.shipping_amount).toLocaleString()}</span>
                </div>` : ''}
                ${order.discount_amount > 0 ? `
                <div style="margin-bottom:8px;">
                  <span style="color:#666;font-size:14px;">Discount: </span>
                  <span style="color:#27AE60;font-size:14px;font-weight:500;">-Rs ${Number(order.discount_amount).toLocaleString()}</span>
                </div>` : ''}
                <div style="border-top:1px solid #ddd;padding-top:15px;margin-top:15px;">
                  <span style="color:#8B1538;font-size:18px;font-weight:700;">Total: Rs ${Number(order.total_amount||0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align:center;margin:30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.paltuu.pk'}/order-confirmed?orderNumber=${encodeURIComponent(order.order_number)}"
                 style="display:inline-block;background-color:#8B1538;color:#ffffff;text-decoration:none;padding:12px 25px;border-radius:5px;font-weight:600;font-size:14px;margin:0 10px 15px 0;">
                View Order Details
              </a>
              <a href="https://www.paltuu.pk/marketplace"
                 style="display:inline-block;background-color:#ffffff;color:#8B1538;text-decoration:none;padding:12px 25px;border-radius:5px;font-weight:600;font-size:14px;border:2px solid #8B1538;">
                Continue Shopping
              </a>
            </div>

            <!-- Contact Info -->
            <div style="text-align:center;padding:20px;background-color:#f8f8f8;border-radius:5px;">
              <p style="margin:0 0 10px 0;color:#333;font-size:15px;font-weight:600;">Need Help?</p>
              <p style="margin:0;color:#666;font-size:14px;">
                Have questions about your order? Contact us at
                <a href="mailto:support@paltuu.com" style="color:#8B1538;text-decoration:none;">support@paltuu.com</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color:#333;padding:25px;text-align:center;">
            <p style="margin:0 0 10px 0;color:#ffffff;font-size:16px;font-weight:600;">Paltuu</p>
            <p style="margin:0 0 15px 0;color:#ccc;font-size:13px;">Your trusted pet companion marketplace</p>
            <div>
              <a href="https://www.paltuu.pk" style="color:#8B1538;text-decoration:none;font-size:12px;margin:0 10px;">Website</a>
              <a href="https://www.paltuu.pk/about-us" style="color:#8B1538;text-decoration:none;font-size:12px;margin:0 10px;">About</a>
              <a href="mailto:support@paltuu.com" style="color:#8B1538;text-decoration:none;font-size:12px;margin:0 10px;">Support</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = `Order Confirmed: ${order.order_number} - Paltuu`;
    const textContent = `
Thank you for your order, ${order.customer_name || 'valued customer'}!

Order Details:
- Order Number: ${order.order_number}
- Order Date: ${orderDate}
- Payment Method: ${order.payment_method || 'COD'}
- Total Amount: Rs ${Number(order.total_amount||0).toLocaleString()}

Items Ordered:
${(order.items || []).map((it: any) => `- ${it.product_title} (Qty: ${it.quantity}) - Rs ${Number(it.total_price||0).toLocaleString()}`).join('\n')}

View your order: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.paltuu.pk'}/order-confirmed?orderNumber=${encodeURIComponent(order.order_number)}
Continue shopping: https://www.paltuu.pk/marketplace

Questions? Contact us at support@paltuu.com

Thank you for choosing Paltuu!
    `;

    // Normalize recipient email from multiple possible shapes
    const recipient = (order.customer_email || order.email || (order.customer && order.customer.email) || (order.customerInfo && order.customerInfo.email) || '').toString().trim() || null;

    if (!recipient) {
      console.warn('No recipient email found for order, skipping send', { orderId: order.order_id, orderNumber: order.order_number });
      return;
    }

    // Use Brevo HTTP API
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.warn('No BREVO API key configured - skipping email');
      return;
    }

    const payload = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: recipient, name: order.customer_name || undefined }],
      subject,
      htmlContent: html,
      textContent
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('Brevo send failed', res.status, text);
    } else {
      console.info('Order confirmation email sent successfully via Brevo');
    }
  } catch (err) {
    console.error('Failed to send order confirmation email', err);
  }
}

export const revalidate = 0;

// GET orders (with optional filtering)
export async function GET(req: NextRequest) {
  const pool = getPool();
  try {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('sessionId');
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const adminView = searchParams.get('admin') === 'true';

  // using pool for queries

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

  const result = await pool.query(query, params);
    return NextResponse.json(result.rows);

  } catch (err) {
    console.error('Orders fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST - Create new order
export async function POST(req: NextRequest) {
  const pool = getPool();
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

    const conn = await pool.connect();
    try {
      await conn.query('BEGIN');
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

  const cartItems = await conn.query(cartItemsQuery, [cartId]);

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

  const orderResult = await conn.query(orderQuery, orderValues);
  const order = orderResult.rows[0];

      // Create order items (stock management disabled - sufficient inventory maintained)
      for (const item of cartItems.rows) {
        const orderItemQuery = `
          INSERT INTO bazaar_order_items (
            order_id, product_id, variant_id, quantity, unit_price, total_price,
            product_title, product_sku, variant_title, variant_sku, variant_attributes, compare_at_price, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        `;

        const itemUnitPrice = parseFloat(item.effective_price);
        const itemTotalPrice = itemUnitPrice * item.quantity;

        await conn.query(orderItemQuery, [
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
  await conn.query('DELETE FROM bazaar_cart_items WHERE cart_id = $1', [cartId]);
  await conn.query('COMMIT');

      // Fetch enriched order with items for the email payload
      try {
        const orderFetchQuery = `
          SELECT
            o.*,
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
              ) FROM bazaar_order_items oi WHERE oi.order_id = o.order_id), '[]'::json
            ) as items
          FROM bazaar_orders o
          WHERE o.order_id = $1
          LIMIT 1
        `;
  const enrichedRes = await conn.query(orderFetchQuery, [order.order_id]);
        const enrichedOrder = enrichedRes.rows[0] || order;

        // fire-and-forget: send confirmation email (non-blocking)
          try {
            // Use the old Brevo email function for customer
            sendOrderConfirmationEmail(enrichedOrder).catch((err: any) => console.warn('Brevo email send failed', err));

            // Use new Mailjet utility to send to both customer and admin
            sendOrderEmails(enrichedOrder).catch((err: any) => console.warn('Mailjet email send failed', err));
          } catch (e) {
            console.warn('Email send scheduling failed', e);
          }
      } catch (fetchErr) {
        console.warn('Failed to fetch enriched order for email', fetchErr);
      }

      return NextResponse.json({ order, message: 'Order created successfully' }, { status: 201 });
      } catch (err) {
        await conn.query('ROLLBACK');
        throw err;
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: 'Failed to create order', message: (err as Error).message }, { status: 500 });
  }
}

// PATCH - Admin updates to orders (mark delivered, update payment status, tracking, admin notes)
export async function PATCH(req: NextRequest) {
  const pool = getPool();
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

    // Add identifying param
    const whereIdx = ++idx;
    if (orderId) {
      params.push(orderId);
    } else {
      params.push(orderNumber);
    }

    const whereClause = orderId ? `order_id = $${whereIdx}` : `order_number = $${whereIdx}`;

    const updateQuery = `UPDATE bazaar_orders SET ${setClauses.join(', ')}, updated_at = NOW() WHERE ${whereClause} RETURNING *`;

    const res = await pool.query(updateQuery, params);
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

    const fullRes = await pool.query(fullQuery, [updated.order_id]);
    const full = fullRes.rows[0] || updated;

    return NextResponse.json({ order: full });

  } catch (err) {
    console.error('Orders update error:', err);
    return NextResponse.json({ error: 'Failed to update order', message: (err as Error).message }, { status: 500 });
  }
}
