import { createClient } from '../../../../db/index';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { notification_id: number } }) {
  const { notification_id } = params;
  const client = createClient();

  try {
    await client.connect();
    await client.query(`UPDATE notifications SET is_read = TRUE WHERE notification_id = $1`, [notification_id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Error updating notification status:', err);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  } finally {
    await client.end();
  }
}
