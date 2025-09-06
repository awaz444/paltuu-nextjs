import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../db/index';

export const revalidate = 0;

export interface CreateBazaarProductDto {
  title: string;
  slug?: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_at_price?: number | null;
  currency?: string;
  sku?: string;
  shipping_weight?: number | null;
  featured?: boolean;
  stock?: number | null;
  collection_id?: number | null;
}

export async function POST(req: NextRequest) {
  const client = createClient();
  try {
    const body: CreateBazaarProductDto = await req.json();
    const {
      title,
      slug = null,
      description = null,
      short_description = null,
      price,
      compare_at_price = null,
      currency = 'PKR',
      sku = null,
      shipping_weight = null,
      featured = false,
      stock = null,
      collection_id = null,
    } = body;

    if (!title || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await client.connect();
    const query = `
      INSERT INTO bazaar_products (
        title, slug, description, short_description, price, compare_at_price,
        currency, sku, shipping_weight, featured, stock, collection_id, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW()) RETURNING *;
    `;
    const values = [
      title, slug, description, short_description, price, compare_at_price,
      currency, sku, shipping_weight, featured, stock, collection_id,
    ];
    const result = await client.query(query, values);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error', message: (err as Error).message }, { status: 500 });
  } finally {
    try { await client.end(); } catch {};
  }
}

export async function GET(req: NextRequest) {
  const client = createClient();
  try {
    await client.connect();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const adminView = searchParams.get('admin') === 'true';

    let query = `
      SELECT p.product_id, p.title, p.slug, p.short_description, p.description, p.price, p.compare_at_price,
             p.currency, p.sku, p.shipping_weight, p.featured, p.stock, p.collection_id, p.status, p.created_at,
        COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m WHERE m.product_id = p.product_id), '[]') AS images
      FROM bazaar_products p
    `;

    // If not admin view, only show published products
    if (!adminView) {
      query += ` WHERE (p.status = 'published' OR p.status IS NULL)`;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await client.query(query);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  } finally {
    try { await client.end(); } catch {};
  }
}
