/**
 * @swagger
 * /api/issues:
 *   post:
 *     summary: Auto-generated summary for /api/issues
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, supabase } from '../../../db/index';
import { v4 as uuidv4 } from 'uuid';


export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const title = data.get('title') as string | null;
    const description = data.get('description') as string | null;
    const file = data.get('screenshot') as File | null;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let imageUrl: string | null = null;

  if (file) {
      if (!supabase) {
        console.error('Supabase client is not configured (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing)');
        return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
      }
      // create a unique path
      const filename = `${uuidv4()}-${file.name}`;
      const bucket = 'issue_ss';

      const buffer = Buffer.from(await file.arrayBuffer());

      // Try upload; if bucket missing, attempt to create it and retry once
      let uploadResult = await supabase.storage.from(bucket).upload(filename, buffer, { cacheControl: '3600', upsert: false });
      if (uploadResult.error) {
        console.warn('Supabase upload initial error', uploadResult.error);
        // If bucket not found, try to create it (public) and retry
  const statusCode = (uploadResult.error as any).statusCode || (uploadResult.error as any).status;
  const msg = (uploadResult.error as any).message || '';
  const isBucketNotFound = statusCode === 400 || statusCode === 404 || /bucket not found/i.test(msg);
        if (isBucketNotFound) {
          console.log(`Bucket '${bucket}' not found — attempting to create it`);
          const { data: createData, error: createErr } = await supabase.storage.createBucket(bucket, { public: true });
          if (createErr) {
            console.error('Failed to create Supabase bucket', createErr);
            return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 });
          }
          // Retry upload once
          uploadResult = await supabase.storage.from(bucket).upload(filename, buffer, { cacheControl: '3600', upsert: false });
        }
      }

      if (uploadResult.error) {
        console.error('Supabase upload error after retry', uploadResult.error);
        return NextResponse.json({ error: 'Failed to upload screenshot' }, { status: 500 });
      }

      // Get public URL
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filename);
  imageUrl = publicData.publicUrl;
    }

    // Insert into DB using the project's db client
    const client = createClient();
    await client.connect();
    try {
      const insertQuery = `
        INSERT INTO issues (title, description, image_url, status, created_at)
        VALUES ($1, $2, $3, 'open', NOW())
        RETURNING *;
      `;
      const params = [title, description, imageUrl];
      const result = await client.query(insertQuery, params);

      return NextResponse.json({ message: 'Issue created', result: result.rows[0] }, { status: 201 });
    } finally {
      try { await client.end(); } catch (err) { console.error('Error closing client', err); }
    }
  } catch (error) {
    console.error('Error in /api/issues:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
