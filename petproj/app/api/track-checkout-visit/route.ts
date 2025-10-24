import { NextRequest, NextResponse } from 'next/server';
import { sendCartActivityNotification } from '../../../utils/mailjet';

export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, userEmail, sessionId, cartItems, cartTotal } = body;

    // Send notification (non-blocking) - use data from localStorage
    sendCartActivityNotification({
      activity_type: 'checkout_visit',
      user_email: userEmail,
      user_name: userName,
      user_id: userId,
      session_id: sessionId,
      cart_items: cartItems,
      cart_total: cartTotal,
    }).catch((err) => console.warn('Failed to send checkout visit notification', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track checkout visit error:', error);
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 });
  }
}
