import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../db/ecom';

export const revalidate = 0;

export async function POST(req: NextRequest) {
  const client = createClient();
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    await client.connect();

    // Check if email already exists
    const existingQuery = `
      SELECT id, subscription_status 
      FROM newsletter_subscriptions 
      WHERE email = $1
    `;
    const existingResult = await client.query(existingQuery, [email]);

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      
      if (existing.subscription_status === 'active') {
        return NextResponse.json(
          { error: 'Email is already subscribed' }, 
          { status: 409 }
        );
      } else {
        // Reactivate if previously unsubscribed or inactive
        const updateQuery = `
          UPDATE newsletter_subscriptions 
          SET subscription_status = 'active', updated_at = CURRENT_TIMESTAMP 
          WHERE email = $1 
          RETURNING *
        `;
        const updateResult = await client.query(updateQuery, [email]);
        return NextResponse.json({
          message: 'Subscription reactivated successfully',
          subscription: updateResult.rows[0]
        });
      }
    }

    // Insert new subscription
    const insertQuery = `
      INSERT INTO newsletter_subscriptions (email, subscription_status) 
      VALUES ($1, 'active') 
      RETURNING *
    `;
    const insertResult = await client.query(insertQuery, [email]);

    return NextResponse.json({
      message: 'Successfully subscribed to newsletter',
      subscription: insertResult.rows[0]
    }, { status: 201 });

  } catch (err: any) {
    console.error('Newsletter subscription error:', err);
    
    // Handle unique constraint violation
    if (err.code === '23505') { // unique_violation
      return NextResponse.json(
        { error: 'Email is already subscribed' }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process subscription' }, 
      { status: 500 }
    );
  } finally {
    try { 
      await client.end(); 
    } catch (endErr) {
      console.error('Error closing client:', endErr);
    }
  }
}

// Optional: GET endpoint to check subscription status
export async function GET(req: NextRequest) {
  const client = createClient();
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await client.connect();

    const query = `
      SELECT id, email, subscription_status, created_at 
      FROM newsletter_subscriptions 
      WHERE email = $1
    `;
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      return NextResponse.json({ subscribed: false });
    }

    return NextResponse.json({
      subscribed: result.rows[0].subscription_status === 'active',
      subscription: result.rows[0]
    });

  } catch (err) {
    console.error('Newsletter check error:', err);
    return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 });
  } finally {
    try { await client.end(); } catch { }
  }
}