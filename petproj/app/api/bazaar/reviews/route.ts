// app/api/bazaar/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../../db/ecom";
import { createClient as createMainClient } from "../../../../db/index";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  const pool = getPool();
  const mainClient = createMainClient();

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");
    if (!productId) {
      return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
    }

    await mainClient.connect();

    // Query reviews from ecom database
    const reviewsQuery = `
      SELECT
        review_id,
        product_id,
        user_id,
        rating,
        title,
        body as comment,
        status,
        helpful_count,
        created_at,
        updated_at
      FROM bazaar_product_reviews
      WHERE product_id = $1
      ORDER BY created_at DESC
    `;

    const reviewsResult = await pool.query(reviewsQuery, [productId]);

    if (reviewsResult.rows.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Extract user IDs from reviews
    const userIds = reviewsResult.rows
      .map(review => review.user_id)
      .filter((id, index, arr) => id && arr.indexOf(id) === index); // Remove duplicates

    // Fetch user details from main database
    let users = [];
    if (userIds.length > 0) {
      const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');

      // First, let's check the structure of the users table
      const tableInfoQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND table_schema = 'public'
      `;

      const tableInfo = await mainClient.query(tableInfoQuery);
      console.log("Users table columns:", tableInfo.rows.map(r => r.column_name));

      // Use a more flexible query that adapts to the actual schema
      const usersQuery = `
        SELECT
          user_id,
          name,
          profile_image_url,
          email
        FROM users
        WHERE user_id IN (${placeholders})
      `;

      const usersResult = await mainClient.query(usersQuery, userIds);
      users = usersResult.rows;
    }

    // Combine reviews with user details
    const reviewsWithUserDetails = reviewsResult.rows.map(review => {
      const user = users.find(u => u.user_id === review.user_id) || {};

      return {
        id: review.review_id,
        user_id: review.user_id,
        user_name: user.name || "Anonymous User",
        user_avatar: user.profile_image_url || null,
        user_email: user.email || null,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        status: review.status,
        helpful_count: review.helpful_count,
        created_at: review.created_at,
        updated_at: review.updated_at
      };
    });

    return NextResponse.json(reviewsWithUserDetails, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching reviews:", err?.message || err);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  } finally {
    try {
      await mainClient.end();
    } catch {}
  }
}

// POST function remains the same as before
export async function POST(req: NextRequest) {
  const pool = getPool();
  try {
    const body = await req.json();
    const {
      order_item_id,
      product_id,
      user_id,
      rating,
      title,
      body: reviewBody
    } = body;

    if (!order_item_id || !product_id || !user_id || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const conn = await pool.connect();
    try {
      // Start a transaction
      await conn.query('BEGIN');

    // Insert the review
    const insertReviewQuery = `
      INSERT INTO bazaar_product_reviews (
        product_id, user_id, rating, title, body, status
      ) VALUES ($1, $2, $3, $4, $5, 'approved')
      RETURNING *
    `;

    const reviewResult = await conn.query(insertReviewQuery, [
      product_id,
      user_id,
      rating,
      title,
      reviewBody
    ]);

    // Update the order item to mark it as reviewed
    const updateOrderItemQuery = `
      UPDATE bazaar_order_items
      SET is_reviewed = true
      WHERE order_item_id = $1
      RETURNING *
    `;

    await conn.query(updateOrderItemQuery, [order_item_id]);

    // Commit the transaction
    await conn.query('COMMIT');

      return NextResponse.json({
        success: true,
        review: reviewResult.rows[0]
      });

    } catch (err) {
      // Rollback the transaction on error
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Review submission error:', err);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
