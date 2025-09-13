// app/api/whatsapp/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { whatsappDb } from '@/db/whatsapp';

export async function GET(req: NextRequest) {
  try {
    const query = `
      SELECT 
        p.*,
        s.city,
        s.pet_type,
        s.breed,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pp.id,
              'proof_url', pp.proof_url,
              'order_number_picture_url', pp.order_number_picture_url,
              'created_at', pp.created_at
            )
          ) FILTER (WHERE pp.id IS NOT NULL),
          '[]'
        ) as proofs
      FROM payment_details p
      LEFT JOIN new_home_pet_submissions s ON p.submission_id = s.id
      LEFT JOIN payment_proofs pp ON p.id = pp.payment_id
      GROUP BY p.id, s.id
      ORDER BY p.created_at DESC
    `;

    const result = await whatsappDb.query(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}