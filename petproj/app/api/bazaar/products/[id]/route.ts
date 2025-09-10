import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../db/ecom';

export async function GET(req: NextRequest, { params }: any) {
  const client = createClient();
  try {
    await client.connect();
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
  COALESCE(${variantsSubquery}, '[]'::json) AS variants
      FROM bazaar_products p WHERE p.product_id = $1
    `;
    const res = await client.query(q, [id]);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(res.rows[0], { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally { try { await client.end(); } catch {} }
}

export async function PUT(req: NextRequest, { params }: any) {
  const client = createClient();
  try {
    const body = await req.json();
    const id = params.id;
    await client.connect();
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
  const updatable = ['title','slug','description','short_description','price','currency','sku','shipping_weight','featured','status','seo_title','seo_description','has_variants','variant_attributes'];

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

    // Handle variants upsert (simple approach: delete existing and re-insert)
    const insertedVariants: any[] = [];
    if (Array.isArray((body as any).variants)) {
      await client.query('DELETE FROM bazaar_product_variants WHERE product_id = $1', [id]);
      for (const v of (body as any).variants) {
        let variantSku = v.sku || `${(body as any).sku || 'SKU'}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;
        variantSku = await ensureUniqueSkuAcrossTables(variantSku);
        const variantQuery = `INSERT INTO bazaar_product_variants (product_id, title, sku, price_override, compare_at_price, stock, weight_override, attributes, is_default, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING *`;
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
        if (vr.rows.length > 0) insertedVariants.push(vr.rows[0]);
      }
    }

    const final = await client.query('SELECT * FROM bazaar_products WHERE product_id = $1', [id]);
    // Return product with variants to allow front-end to upload images per variant (same as POST route)
    const out = { ...final.rows[0], variants: insertedVariants };
    return NextResponse.json(out, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally { try { await client.end(); } catch {} }
}

export async function DELETE(req: NextRequest, { params }: any) {
  const client = createClient();
  try {
    const id = params.id;
    await client.connect();
    await client.query('DELETE FROM bazaar_products WHERE product_id = $1', [id]);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally { try { await client.end(); } catch {} }
}
