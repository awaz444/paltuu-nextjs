import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../db/ecom';

export async function GET(req: NextRequest) {
  const client = createClient();
  try {
    await client.connect();
    const q = `
      SELECT category_id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at
      FROM bazaar_categories
      ORDER BY sort_order ASC, name ASC
    `;
    const res = await client.query(q);
    return NextResponse.json(res.rows || []);
  } catch (err) {
    console.error('Error fetching categories', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  } finally {
    try { await client.end(); } catch {}
  }
}
