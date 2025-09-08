import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";

export async function GET(req: NextRequest) {
  const client = createClient();
  
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await client.connect();

    // Fetch user's shops
    const shopsResult = await client.query(
      'SELECT shop_id, shop_name, user_id FROM shops WHERE user_id = $1',
      [userId]
    );

    // Fetch user's shelters
    const sheltersResult = await client.query(
      'SELECT shelter_id, shelter_name, user_id FROM rescue_shelters WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({
      shops: shopsResult.rows,
      shelters: sheltersResult.rows
    });

  } catch (error) {
    console.error('Error fetching shops and shelters:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  } finally {
    await client.end();
  }
}
