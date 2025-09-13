// app/api/whatsapp/deliveries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { whatsappDb } from '@/db/whatsapp';

export async function GET(req: NextRequest) {
  try {
    const query = `
      SELECT 
        d.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', dp.id,
              'photo_url', dp.photo_url,
              'created_at', dp.created_at
            )
          ) FILTER (WHERE dp.id IS NOT NULL),
          '[]'
        ) as photos
      FROM delivery_requests d
      LEFT JOIN delivery_photos dp ON d.id = dp.delivery_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `;

    const result = await whatsappDb.query(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching delivery requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery requests' },
      { status: 500 }
    );
  }
}