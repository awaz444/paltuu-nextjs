import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../../../db/ecom';
import { safeRedis } from '../../../../../utils/redis';

// Helper to invalidate product cache keys
async function invalidateProductCache() {
  try {
    // Optimized: Only scan if Redis supports it, otherwise just delete known patterns
    try {
      const keys = await safeRedis.keys('products:*');
      if (keys.length > 0) {
        await safeRedis.del(...keys);
        console.info(`[Cache] Invalidated ${keys.length} product cache keys`);
      }
    } catch (scanErr) {
      // Fallback: delete common cache key patterns
      console.warn('[Cache] KEYS scan failed, using pattern deletion fallback');
      await safeRedis.del('products:admin=true:page=1:limit=24:cat=:col=:kw=');
      await safeRedis.del('products:admin=false:page=1:limit=24:cat=:col=:kw=');
    }
  } catch (e) {
    console.warn('[Cache] Failed to invalidate cache (non-fatal):', e);
  }
}

export async function GET(req: NextRequest, { params }: any) {
  const pool = getPool();
  let client: any = null;
  try {
    client = await pool.connect();
    const id = params.id;
    // check for variant_id column in media table
    const colCheck = await client.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'bazaar_product_media' AND column_name = 'variant_id' LIMIT 1");
    const hasVariantMediaCol = (colCheck && (colCheck.rowCount || 0) > 0) || false;
    const variantsSubquery = hasVariantMediaCol
      ? `(SELECT json_agg(json_build_object('variant_id', v.variant_id, 'title', v.title, 'sku', v.sku, 'price_override', v.price_override, 'compare_at_price', v.compare_at_price, 'stock', v.stock, 'attributes', v.attributes, 'images', COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m2 WHERE m2.variant_id = v.variant_id), '[]'::json))) FROM bazaar_product_variants v WHERE v.product_id = p.product_id)`
      : `(SELECT json_agg(json_build_object('variant_id', v.variant_id, 'title', v.title, 'sku', v.sku, 'price_override', v.price_override, 'compare_at_price', v.compare_at_price, 'stock', v.stock, 'attributes', v.attributes, 'images', '[]'::json)) FROM bazaar_product_variants v WHERE v.product_id = p.product_id)`;

    const q = `
      SELECT p.*,
        COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m WHERE m.product_id = p.product_id), '[]'::json) AS images,
        COALESCE((SELECT json_agg(json_build_object('category_id', c.category_id, 'name', c.name)) FROM bazaar_categories c JOIN bazaar_product_categories bpc ON c.category_id = bpc.category_id WHERE bpc.product_id = p.product_id), '[]'::json) AS categories,
        COALESCE((SELECT json_agg(json_build_object('collection_id', col.collection_id, 'name', col.name)) FROM bazaar_collections col JOIN bazaar_product_collections bpcol ON col.collection_id = bpcol.collection_id WHERE bpcol.product_id = p.product_id), '[]'::json) AS collections,
  COALESCE(${variantsSubquery}, '[]'::json) AS variants
      FROM bazaar_products p WHERE p.product_id = $1
    `;
    const res = await client.query(q, [id]);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(res.rows[0], { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally { if (client) client.release(); }
}

export async function PUT(req: NextRequest, { params }: any) {
  const pool = getPool();
  let client: any = null;
  try {
    const body = await req.json();
    const id = params.id;
    client = await pool.connect();
    // helper to ensure SKU uniqueness across products and variants
    async function ensureUniqueSkuAcrossTables(candidate: string) {
      let attempt = 0;
      let s = candidate;
      while (attempt < 6) {
        const checkP = await client.query('SELECT 1 FROM bazaar_products WHERE sku = $1 AND product_id <> $2 LIMIT 1', [s, id]);
        const checkV = await client.query('SELECT 1 FROM bazaar_product_variants WHERE sku = $1 LIMIT 1', [s]);
        if (checkP.rowCount === 0 && checkV.rowCount === 0) return s;
        s = `${candidate}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;
        attempt++;
      }
      return candidate;
    }
    // Allowed fields for direct product update
  const updatable = ['title','slug','description','seo_title','seo_description','price','currency','sku','shipping_weight','featured','status','has_variants','variant_attributes'];

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const key of Object.keys(body)) {
      if (updatable.includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push((body as any)[key]);
        idx++;
      }
    }

    if (fields.length > 0) {
      values.push(id);
      const q = `UPDATE bazaar_products SET ${fields.join(', ')}, updated_at = NOW() WHERE product_id = $${idx} RETURNING *`;
      const res = await client.query(q, values);
      // if SKU updated, ensure uniqueness (simple check)
      if (res.rows.length > 0 && (body as any).sku) {
        const newSku = (body as any).sku;
        // check against products and variants
        const skuCheckP = await client.query('SELECT product_id FROM bazaar_products WHERE sku = $1 AND product_id <> $2', [newSku, id]);
        const skuCheckV = await client.query('SELECT variant_id FROM bazaar_product_variants WHERE sku = $1', [newSku]);
        if (skuCheckP.rows.length > 0 || skuCheckV.rows.length > 0) {
          return NextResponse.json({ error: 'SKU already exists for another product or variant' }, { status: 400 });
        }
      }
    }

    // Handle categories (replace links)
    if (Array.isArray((body as any).category_ids)) {
      await client.query('DELETE FROM bazaar_product_categories WHERE product_id = $1', [id]);
      for (const catId of (body as any).category_ids) {
        await client.query('INSERT INTO bazaar_product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, catId]);
      }
    }

    // Handle collections (replace links) - supports multiple pet types
    if (Array.isArray((body as any).collection_ids)) {
      await client.query('DELETE FROM bazaar_product_collections WHERE product_id = $1', [id]);
      for (const collectionId of (body as any).collection_ids) {
        await client.query('INSERT INTO bazaar_product_collections (product_id, collection_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, collectionId]);
      }
    }

    // Handle variants upsert (UPSERT approach - only delete if explicitly marked)
    const insertedVariants: any[] = [];
    if (Array.isArray((body as any).variants)) {
      const variantsToExplicitlyDelete: number[] = [];

      for (const v of (body as any).variants) {
        // If variant is marked for deletion
        if (v.deleted === true && v.variant_id) {
          variantsToExplicitlyDelete.push(v.variant_id);
          continue;
        }

        let variantSku = v.sku || `${(body as any).sku || 'SKU'}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;

        // If variant has an ID, update it; otherwise insert
        if (v.variant_id) {
          // UPDATE existing variant
          // Check SKU uniqueness only if SKU changed
          const skuCheckQ = await client.query(
            'SELECT sku FROM bazaar_product_variants WHERE variant_id = $1',
            [v.variant_id]
          );
          const currentSku = skuCheckQ.rows[0]?.sku;

          if (v.sku && v.sku !== currentSku) {
            variantSku = await ensureUniqueSkuAcrossTables(v.sku);
          } else {
            variantSku = currentSku || variantSku;
          }

          const variantQuery = `
            UPDATE bazaar_product_variants
            SET title = $1, sku = $2, price_override = $3, compare_at_price = $4,
                stock = $5, weight_override = $6, attributes = $7, is_default = $8, updated_at = NOW()
            WHERE variant_id = $9
            RETURNING *
          `;
          const variantValues = [
            v.title || null,
            variantSku,
            v.price_override ?? null,
            v.compare_at_price ?? null,
            v.stock ?? 0,
            v.weight_override ?? null,
            v.attributes ? JSON.stringify(v.attributes) : null,
            v.is_default ?? false,
            v.variant_id
          ];
          const vr = await client.query(variantQuery, variantValues);
          if (vr.rows.length > 0) insertedVariants.push(vr.rows[0]);
        } else {
          // INSERT new variant - but first check if one with same SKU already exists for this product
          variantSku = await ensureUniqueSkuAcrossTables(variantSku);

          // Check if a variant with this SKU already exists for this product
          const existingVariantCheck = await client.query(
            'SELECT variant_id FROM bazaar_product_variants WHERE product_id = $1 AND sku = $2 LIMIT 1',
            [id, variantSku]
          );

          if (existingVariantCheck.rows.length > 0) {
            // Variant with this SKU already exists, UPDATE instead of INSERT
            const existingVariantId = existingVariantCheck.rows[0].variant_id;
            const variantQuery = `
              UPDATE bazaar_product_variants
              SET title = $1, sku = $2, price_override = $3, compare_at_price = $4,
                  stock = $5, weight_override = $6, attributes = $7, is_default = $8, updated_at = NOW()
              WHERE variant_id = $9
              RETURNING *
            `;
            const variantValues = [
              v.title || null,
              variantSku,
              v.price_override ?? null,
              v.compare_at_price ?? null,
              v.stock ?? 0,
              v.weight_override ?? null,
              v.attributes ? JSON.stringify(v.attributes) : null,
              v.is_default ?? false,
              existingVariantId
            ];
            const vr = await client.query(variantQuery, variantValues);
            if (vr.rows.length > 0) insertedVariants.push(vr.rows[0]);
          } else {
            // No existing variant with this SKU, safe to INSERT
            const variantQuery = `
              INSERT INTO bazaar_product_variants
              (product_id, title, sku, price_override, compare_at_price, stock, weight_override, attributes, is_default, created_at, updated_at)
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
              RETURNING *
            `;
            const variantValues = [
              id,
              v.title || null,
              variantSku,
              v.price_override ?? null,
              v.compare_at_price ?? null,
              v.stock ?? 0,
              v.weight_override ?? null,
              v.attributes ? JSON.stringify(v.attributes) : null,
              v.is_default ?? false,
            ];
            const vr = await client.query(variantQuery, variantValues);
            if (vr.rows.length > 0) {
              insertedVariants.push(vr.rows[0]);
            }
          }
        }
      }

      // Only delete variants explicitly marked for deletion
      if (variantsToExplicitlyDelete.length > 0) {
        // Check which variants are NOT referenced in orders
        const referencedVariantsRes = await client.query(
          'SELECT DISTINCT variant_id FROM bazaar_order_items WHERE variant_id = ANY($1)',
          [variantsToExplicitlyDelete]
        );
        const referencedVariantIds = new Set(referencedVariantsRes.rows.map((r: any) => r.variant_id));

        // Only delete unreferenced variants
        const safeToDelete = variantsToExplicitlyDelete.filter(vid => !referencedVariantIds.has(vid));
        if (safeToDelete.length > 0) {
          await client.query(
            'DELETE FROM bazaar_product_variants WHERE variant_id = ANY($1)',
            [safeToDelete]
          );
          console.info(`[Product Update] Deleted ${safeToDelete.length} variant(s) as requested`);
        }

        // Log warning for variants that couldn't be deleted
        const couldNotDelete = variantsToExplicitlyDelete.filter(vid => referencedVariantIds.has(vid));
        if (couldNotDelete.length > 0) {
          console.warn(`[Product Update] Could not delete ${couldNotDelete.length} variant(s) as they are referenced in orders:`, couldNotDelete);
        }
      }
    }

    const final = await client.query('SELECT * FROM bazaar_products WHERE product_id = $1', [id]);

    // Invalidate product cache since we updated a product
    await invalidateProductCache();

    // Return product with variants to allow front-end to upload images per variant (same as POST route)
    const out = { ...final.rows[0], variants: insertedVariants };
    return NextResponse.json(out, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally { if (client) client.release(); }
}

export async function DELETE(req: NextRequest, { params }: any) {
  const pool = getPool();
  let client: any = null;
  try {
    const id = params.id;
    client = await pool.connect();
    await client.query('DELETE FROM bazaar_products WHERE product_id = $1', [id]);

    // Invalidate product cache since we deleted a product
    await invalidateProductCache();

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally { if (client) client.release(); }
}
