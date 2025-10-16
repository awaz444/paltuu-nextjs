import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db/ecom';

export const revalidate = 0;

// POST - Upload payment proof
export async function POST(req: NextRequest) {
  const pool = getPool();
  try {
    const body = await req.json();
    const { orderId, orderNumber, userId, sessionId, imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    if (!orderId && !orderNumber) {
      return NextResponse.json({ error: 'Order ID or Order Number is required' }, { status: 400 });
    }

    // Find order
    let order;
    if (orderId) {
      const res = await pool.query('SELECT * FROM bazaar_orders WHERE order_id = $1', [orderId]);
      order = res.rows[0];
    } else if (orderNumber) {
      const res = await pool.query('SELECT * FROM bazaar_orders WHERE order_number = $1', [orderNumber]);
      order = res.rows[0];
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify order belongs to user/session
    if (userId && order.user_id !== parseInt(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (!userId && sessionId && order.session_id !== sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if payment proof already exists
    const existingProof = await pool.query(
      'SELECT * FROM bazaar_payment_proofs WHERE order_id = $1',
      [order.order_id]
    );

    let proof;
    if (existingProof.rows.length > 0) {
      // Update existing proof
      const updateQuery = `
        UPDATE bazaar_payment_proofs
        SET image_url = $1, uploaded_at = CURRENT_TIMESTAMP, verification_status = 'pending'
        WHERE order_id = $2
        RETURNING *
      `;
  const result = await pool.query(updateQuery, [imageUrl, order.order_id]);
      proof = result.rows[0];
    } else {
      // Insert new proof
      const insertQuery = `
        INSERT INTO bazaar_payment_proofs (order_id, user_id, session_id, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await pool.query(insertQuery, [
        order.order_id,
        userId || null,
        sessionId || null,
        imageUrl
      ]);
      proof = result.rows[0];
    }

    // Update order payment_reference with proof URL
    await pool.query(
      'UPDATE bazaar_orders SET payment_reference = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2',
      [imageUrl, order.order_id]
    );

    return NextResponse.json({
      success: true,
      proof,
      message: 'Payment proof uploaded successfully. Our team will verify it shortly.'
    });

  } catch (err) {
    console.error('Payment proof upload error:', err);
    return NextResponse.json({ error: 'Failed to upload payment proof' }, { status: 500 });
  } finally {
    // pooled connections - nothing to close here
  }
}

// GET - Get payment proof for an order
export async function GET(req: NextRequest) {
  const pool = getPool();
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');

    if (!orderId && !orderNumber) {
      return NextResponse.json({ error: 'Order ID or Order Number is required' }, { status: 400 });
    }

    let query = `
      SELECT pp.*, o.order_number, o.customer_name, o.customer_email
      FROM bazaar_payment_proofs pp
      JOIN bazaar_orders o ON pp.order_id = o.order_id
      WHERE
    `;

    let params: any[] = [];
    if (orderId) {
      query += 'pp.order_id = $1';
      params = [orderId];
    } else {
      query += 'o.order_number = $1';
      params = [orderNumber];
    }

  const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ proof: null, message: 'No payment proof found' });
    }

    return NextResponse.json({ proof: result.rows[0] });

  } catch (err) {
    console.error('Get payment proof error:', err);
    return NextResponse.json({ error: 'Failed to get payment proof' }, { status: 500 });
  } finally {
    // pooled connections - nothing to close
  }
}

// PATCH - Admin verify payment proof
export async function PATCH(req: NextRequest) {
  const pool = getPool();
  try {
    const body = await req.json();
    const { proofId, orderId, status, adminNotes, adminUserId } = body;

    if (!proofId && !orderId) {
      return NextResponse.json({ error: 'Proof ID or Order ID is required' }, { status: 400 });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid status (approved/rejected) is required' }, { status: 400 });
    }

    let updateQuery = `
      UPDATE bazaar_payment_proofs
      SET
        verification_status = $1,
        verified_at = CURRENT_TIMESTAMP,
        verified_by = $2,
        admin_notes = $3
      WHERE ${proofId ? 'proof_id = $4' : 'order_id = $4'}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      status,
      adminUserId || null,
      adminNotes || null,
      proofId || orderId
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Payment proof not found' }, { status: 404 });
    }

    const proof = result.rows[0];

    // If approved, update order payment status to 'paid' and status to 'confirmed'
    if (status === 'approved') {
      await pool.query(
        `UPDATE bazaar_orders
         SET payment_status = 'paid',
             status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $1`,
        [proof.order_id]
      );
    }

    return NextResponse.json({
      success: true,
      proof,
      message: `Payment proof ${status}`
    });

  } catch (err) {
    console.error('Verify payment proof error:', err);
    return NextResponse.json({ error: 'Failed to verify payment proof' }, { status: 500 });
  } finally {
    // pooled connections - nothing to close
  }
}
