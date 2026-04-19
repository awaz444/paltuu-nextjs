/**
 * @swagger
 * /api/admin/whatsapp/new-home:
 *   get:
 *     summary: Auto-generated summary for /api/admin/whatsapp/new-home
 *     tags: [Auto-Generated]
 */

// app/api/whatsapp/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { whatsappDb } from '@/db/whatsapp';

export async function GET(req: NextRequest) {
  try {
    const query = `
      SELECT 
        s.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', sp.id,
              'photo_url', sp.photo_url,
              'created_at', sp.created_at
            )
          ) FILTER (WHERE sp.id IS NOT NULL),
          '[]'
        ) as photos
      FROM new_home_pet_submissions s
      LEFT JOIN submission_photos sp ON s.id = sp.submission_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;

    const result = await whatsappDb.query(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}