import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../db/ecom';

export const revalidate = 0;

// GET specific order
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const client = createClient();
  try {
    const orderId = params.id;

    await client.connect();

    const query = `
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
          ) FROM bazaar_order_items oi WHERE oi.order_id = o.order_id),
          '[]'::json
        ) as items
      FROM bazaar_orders o
      WHERE o.order_id = $1
    `;

    const result = await client.query(query, [orderId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (err) {
    console.error('Order fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  } finally {
    try { await client.end(); } catch { }
  }
}

// PUT - Update order status
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const client = createClient();
  try {
    const orderId = params.id;
    const body = await req.json();
    const { status, payment_status, tracking_number, admin_notes } = body;

    await client.connect();

    let updateFields = [];
    let values = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      values.push(status);

      // Set timestamps based on status
      if (status === 'shipped') {
        paramCount++;
        updateFields.push(`shipped_at = $${paramCount}`);
        values.push(new Date());
      } else if (status === 'delivered') {
        paramCount++;
        updateFields.push(`delivered_at = $${paramCount}`);
        values.push(new Date());
      }
    }

    if (payment_status) {
      paramCount++;
      updateFields.push(`payment_status = $${paramCount}`);
      values.push(payment_status);
    }

    if (tracking_number) {
      paramCount++;
      updateFields.push(`tracking_number = $${paramCount}`);
      values.push(tracking_number);
    }

    if (admin_notes) {
      paramCount++;
      updateFields.push(`admin_notes = $${paramCount}`);
      values.push(admin_notes);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    values.push(orderId);

    const query = `
      UPDATE bazaar_orders
      SET ${updateFields.join(', ')}
      WHERE order_id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (err) {
    console.error('Order update error:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  } finally {
    try { await client.end(); } catch { }
  }
}
