/**
 * @swagger
 * /api/bazaar/categories:
 *   get:
 *     summary: Auto-generated summary for /api/bazaar/categories
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db/index';

export async function GET(req: NextRequest) {
  const pool = db;
  try {
    const q = `
      SELECT category_id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at
      FROM bazaar_categories
      ORDER BY sort_order ASC, name ASC
    `;
    const res = await pool.query(q);
    return NextResponse.json(res.rows || []);
  } catch (err) {
    console.error('Error fetching categories', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
