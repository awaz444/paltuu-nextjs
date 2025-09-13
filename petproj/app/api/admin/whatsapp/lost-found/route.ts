// app/api/whatsapp/lost-found/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { whatsappDb } from '@/db/whatsapp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'lost' or 'found'

    let whereClause = '';
    if (type && ['lost', 'found'].includes(type)) {
      whereClause = `WHERE r.type = '${type}'`;
    }

    const query = `
      SELECT 
        r.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', lfp.id,
              'photo_url', lfp.photo_url,
              'created_at', lfp.created_at
            )
          ) FILTER (WHERE lfp.id IS NOT NULL),
          '[]'
        ) as photos
      FROM lost_found_reports r
      LEFT JOIN lost_found_photos lfp ON r.id = lfp.report_id
      ${whereClause}
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `;

    const result = await whatsappDb.query(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching lost/found reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}