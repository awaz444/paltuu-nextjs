import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../../db/index';

export async function GET(req: NextRequest, { params }: any) {
  const client = createClient();
  try {
    await client.connect();
    const id = params.id;
    const q = `SELECT *, COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m WHERE m.product_id = p.product_id), '[]') AS images FROM bazaar_products p WHERE p.product_id = $1`;
    const res = await client.query(q, [id]);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(res.rows[0], { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally { try { await client.end(); } catch {} }
}

export async function PUT(req: NextRequest, { params }: any) {
  const client = createClient();
  try {
    const body = await req.json();
    const id = params.id;
    await client.connect();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of Object.keys(body)) {
      fields.push(`${key} = $${idx}`);
      values.push((body as any)[key]);
      idx++;
    }
    if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 });
    values.push(id);
    const q = `UPDATE bazaar_products SET ${fields.join(', ')}, updated_at = NOW() WHERE product_id = $${idx} RETURNING *`;
    const res = await client.query(q, values);
    return NextResponse.json(res.rows[0], { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally { try { await client.end(); } catch {} }
}

export async function DELETE(req: NextRequest, { params }: any) {
  const client = createClient();
  try {
    const id = params.id;
    await client.connect();
    await client.query('DELETE FROM bazaar_products WHERE product_id = $1', [id]);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally { try { await client.end(); } catch {} }
}
