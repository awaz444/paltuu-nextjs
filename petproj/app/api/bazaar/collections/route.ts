import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../../db/ecom';

export async function GET(req: NextRequest) {
  const pool = getPool();
  try {
    const q = `
      SELECT collection_id, name, slug, description, image_url, sort_order, is_active, created_at
      FROM bazaar_collections
      ORDER BY sort_order ASC, name ASC
    `;
    const res = await pool.query(q);
    return NextResponse.json(res.rows || []);
  } catch (err) {
    console.error('Error fetching collections', err);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}
