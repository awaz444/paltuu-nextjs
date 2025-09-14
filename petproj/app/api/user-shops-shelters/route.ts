import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const client = createClient();

  try {
    // Use req.nextUrl instead of new URL(req.url) to avoid dynamic server usage
    const userId = req.nextUrl.searchParams.get('user_id');

    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await client.connect();

    // Get user's role first
    const userResult = await client.query(
      'SELECT role FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userRole = userResult.rows[0].role;

    let entityData = null;

    if (userRole === 'shop admin') {
      // Get shop data
      const shopResult = await client.query(
        'SELECT shop_id, shop_name FROM shops WHERE user_id = $1',
        [userId]
      );
      
      if (shopResult.rows.length > 0) {
        entityData = {
          type: 'shop',
          id: shopResult.rows[0].shop_id,
          name: shopResult.rows[0].shop_name
        };
      }
    } else if (userRole === 'shelter admin') {
      // Get shelter data
      const shelterResult = await client.query(
        'SELECT shelter_id, shelter_name FROM rescue_shelters WHERE user_id = $1',
        [userId]
      );
      
      if (shelterResult.rows.length > 0) {
        entityData = {
          type: 'shelter',
          id: shelterResult.rows[0].shelter_id,
          name: shelterResult.rows[0].shelter_name
        };
      }
    }

    return NextResponse.json({
      success: true,
      entity: entityData
    });

  } catch (error) {
    console.error('Error fetching user entity:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// Add this export to prevent static optimization
export const dynamic = 'force-dynamic';