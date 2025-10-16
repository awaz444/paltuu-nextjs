import { getPool } from '../../../../db/ecom';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// use explicit bucket name for product images per request
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'product-imgs';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase storage env vars not set: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export async function POST(request: NextRequest) {
  const pool = getPool();
  try {
    const contentType = request.headers.get('content-type') || '';

    // If client sends JSON, interpret as attach-only mode: insert DB rows from provided storage paths
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const attachments: Array<any> = Array.isArray(body.attachments) ? body.attachments : body;
      if (!attachments || attachments.length === 0) {
        return NextResponse.json({ error: 'No attachments provided' }, { status: 400 });
      }
      // Ensure media table supports variant relations
      const colCheck = await pool.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'bazaar_product_media' AND column_name = 'variant_id' LIMIT 1");
      const hasVariantCol = !!(colCheck && typeof (colCheck.rowCount) === 'number' && colCheck.rowCount > 0);
      const insertedRows: any[] = [];

      const conn = await pool.connect();
      try {
        await conn.query('BEGIN');
        for (let i = 0; i < attachments.length; i++) {
          const at = attachments[i];
          const product_id = at.product_id ? String(at.product_id) : null;
          const variant_id = at.variant_id ? String(at.variant_id) : null;
          const path = at.path || at.storage_path || null;
          const publicUrl = at.publicUrl || at.url || at.public_url || null;
          const ordering = at.ordering ?? i + 1;
          if (!product_id) continue; // cannot attach without product_id

          // If a variant_id is provided, enforce the per-variant 5-image limit and validate variant
          if (variant_id) {
            if (!hasVariantCol) {
              await conn.query('ROLLBACK');
              return NextResponse.json({ error: 'Database missing variant_id column in bazaar_product_media. Run migration to enable variant-level media.' }, { status: 500 });
            }
            const vRes = await conn.query('SELECT product_id FROM bazaar_product_variants WHERE variant_id = $1 LIMIT 1', [variant_id]);
            if (vRes.rowCount === 0) {
              await conn.query('ROLLBACK');
              return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
            }
            if (product_id && String(vRes.rows[0].product_id) !== String(product_id)) {
              await conn.query('ROLLBACK');
              return NextResponse.json({ error: 'Variant does not belong to product' }, { status: 400 });
            }

            const cntRes = await conn.query('SELECT COUNT(*)::int AS cnt FROM bazaar_product_media WHERE variant_id = $1', [variant_id]);
            const existing = cntRes.rows[0] ? Number(cntRes.rows[0].cnt) : 0;
            const allowed = Math.max(0, 5 - existing);
            if (allowed <= 0) {
              await conn.query('ROLLBACK');
              return NextResponse.json({ error: 'Variant already has maximum allowed images (5)' }, { status: 400 });
            }

            // Only insert up to allowed images from attachments
            if (i >= allowed) break; // any further items would exceed limit
          }

          // Build insert with variant_id if supported and provided
          if (variant_id) {
            const insertRes = await conn.query('INSERT INTO bazaar_product_media (product_id, variant_id, url, ordering, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *', [product_id, variant_id, publicUrl, ordering]);
            if (insertRes && insertRes.rows && insertRes.rows[0]) insertedRows.push(insertRes.rows[0]);
          } else {
            const insertRes = await conn.query('INSERT INTO bazaar_product_media (product_id, url, ordering, created_at) VALUES ($1,$2,$3,NOW()) RETURNING *', [product_id, publicUrl, ordering]);
            if (insertRes && insertRes.rows && insertRes.rows[0]) insertedRows.push(insertRes.rows[0]);
          }
        }
        await conn.query('COMMIT');
      } catch (e) {
        console.error('Attach-by-path transaction failed', e);
        try { await conn.query('ROLLBACK'); } catch {};
      } finally {
        conn.release();
      }

      return NextResponse.json({ message: 'Attachments inserted', inserted: insertedRows }, { status: 200 });
    }

    const data = await request.formData();
    const files = data.getAll('files') as File[];
    const product_id_raw = data.get('product_id');
    const variant_id_raw = data.get('variant_id');
    if (!files || files.length === 0) return NextResponse.json({ error: 'No files provided' }, { status: 400 });

  const product_id = product_id_raw ? String(product_id_raw) : null;
  const variant_id = variant_id_raw ? String(variant_id_raw) : null;

    // initialize supabase client (server-side, service role key required for uploads)
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
    }
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // If variant_id provided we must ensure the media table supports variant relations
    let hasVariantCol = false;
    if (variant_id) {
      const poolConn = await pool.connect();
      try {
        const colCheck = await poolConn.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'bazaar_product_media' AND column_name = 'variant_id' LIMIT 1");
        hasVariantCol = !!(colCheck && typeof (colCheck.rowCount) === 'number' && colCheck.rowCount > 0);
        if (!hasVariantCol) {
          poolConn.release();
          return NextResponse.json({ error: 'Database missing variant_id column in bazaar_product_media. Run migration to enable variant-level media.' }, { status: 500 });
        }

        // Validate variant exists and optionally belongs to product
        const vRes = await poolConn.query('SELECT product_id FROM bazaar_product_variants WHERE variant_id = $1 LIMIT 1', [variant_id]);
        if (vRes.rowCount === 0) {
          poolConn.release();
          return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }
        if (product_id && String(vRes.rows[0].product_id) !== String(product_id)) {
          poolConn.release();
          return NextResponse.json({ error: 'Variant does not belong to product' }, { status: 400 });
        }

        // Enforce 5 images per variant
        const cntRes = await poolConn.query('SELECT COUNT(*)::int AS cnt FROM bazaar_product_media WHERE variant_id = $1', [variant_id]);
        const existing = cntRes.rows[0] ? Number(cntRes.rows[0].cnt) : 0;
        const allowed = Math.max(0, 5 - existing);
        if (allowed <= 0) {
          poolConn.release();
          return NextResponse.json({ error: 'Variant already has maximum allowed images (5)' }, { status: 400 });
        }

        // If client provided more files than allowed, trim to allowed
        if (files.length > allowed) files.splice(allowed);
      } catch (e) {
        console.error('Variant validation failed', e);
        try { poolConn.release(); } catch {};
        return NextResponse.json({ error: 'Variant validation failed' }, { status: 500 });
      }
      try { poolConn.release(); } catch {}
    }

    const uploadPromises = files.map(async (file, idx) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const originalName = (file as any).name || `upload-${Date.now()}`;
      // include variant in path if available for easier identification
      const pathname = variant_id ? `products/${product_id}/variants/${variant_id}/${Date.now()}-${idx}-${originalName}` : `products/${product_id}/${Date.now()}-${idx}-${originalName}`;

      // upload to supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET).upload(pathname, buffer, {
        contentType: (file as any).type || 'application/octet-stream',
        upsert: false,
        cacheControl: '3600',
      });
      if (uploadError) {
        console.error('Supabase upload error', uploadError);
        throw uploadError;
      }

      // get public url
  const publicData = supabase.storage.from(BUCKET).getPublicUrl(pathname);
  const publicUrl = (publicData && (publicData as any).data && (publicData as any).data.publicUrl) || '';
      return { path: pathname, publicUrl };
    });

    const results = await Promise.all(uploadPromises);

    // If no product_id provided, only upload to storage and return results (no DB insert)
    const insertedRows: any[] = [];
    if (product_id) {
      const conn2 = await pool.connect();
      try {
        await conn2.query('BEGIN');
        // count existing images for ordering when variant provided
        let existing = 0;
        if (variant_id) {
          const cntRes = await conn2.query('SELECT COUNT(*)::int AS cnt FROM bazaar_product_media WHERE variant_id = $1', [variant_id]);
          existing = cntRes.rows[0] ? Number(cntRes.rows[0].cnt) : 0;
        }

        for (let i = 0; i < results.length; i++) {
          const { path, publicUrl } = results[i];
          try {
            if (variant_id) {
              const insertRes = await conn2.query('INSERT INTO bazaar_product_media (product_id, variant_id, url, ordering, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *', [product_id, variant_id, publicUrl, existing + i + 1]);
              if (insertRes && insertRes.rows && insertRes.rows[0]) insertedRows.push(insertRes.rows[0]);
            } else {
              const insertRes = await conn2.query('INSERT INTO bazaar_product_media (product_id, url, ordering, created_at) VALUES ($1,$2,$3,NOW()) RETURNING *', [product_id, publicUrl, i + 1]);
              if (insertRes && insertRes.rows && insertRes.rows[0]) insertedRows.push(insertRes.rows[0]);
            }
          } catch (e) {
            console.error('Failed to insert media row for uploaded file:', e);
          }
        }
        await conn2.query('COMMIT');
      } catch (e) {
        console.error('Media insert transaction failed', e);
        try { await conn2.query('ROLLBACK'); } catch {};
      } finally {
        conn2.release();
      }
    }

    return NextResponse.json({ message: 'Images uploaded', results, inserted: insertedRows }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed', message: (err as Error).message }, { status: 500 });
  } finally {
    // pooled connections are reused; nothing to close here
  }
}
