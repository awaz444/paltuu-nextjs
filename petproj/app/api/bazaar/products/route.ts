import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/ecom";
import { safeRedis } from "../../../../utils/redis";

export const revalidate = 0;

const CACHE_TTL_SEC = 300; // 5 minutes

// Clear any existing product cache on startup to prevent corruption issues
let startupCacheCleared = false;
async function clearStartupCache() {
  if (startupCacheCleared) return;
  startupCacheCleared = true;
  try {
    const keys = await safeRedis.keys('products:*');
    if (keys.length > 0) {
      await safeRedis.del(...keys);
      console.info(`[Cache] Cleared ${keys.length} existing product cache keys on startup`);
    }
  } catch (e) {
    console.warn('[Cache] Failed to clear startup cache (non-fatal):', e);
  }
}

async function invalidateProductCache() {
  try {
    const keys = await safeRedis.keys('products:*');
    if (keys.length > 0) {
      await safeRedis.del(...keys);
      console.info(`[Cache] Invalidated ${keys.length} product cache keys`);
    }
  } catch (e) {
    console.warn('[Cache] Failed to invalidate cache (non-fatal):', e);
  }
}

export interface CreateBazaarProductDto {
  title: string;
  slug?: string;
  description?: string;
  short_description?: string;
  price?: number | null; // optional when variants provided
  compare_at_price?: number | null;
  currency?: string;
  sku?: string;
  shipping_weight?: number | null; // if provided, will be used as default, but variants may override
  featured?: boolean;
  stock?: number | null; // overall stock (optional)
  collection_ids?: number[] | null; // pet types (multiple)
  category_ids?: number[] | null; // multiple categories
  variants?: Array<{
    title?: string;
    sku?: string | null;
  price_override?: number | null;
  compare_at_price?: number | null;
    stock?: number | null;
    weight_override?: number | null;
    attributes?: any | null;
    is_default?: boolean | null;
  }> | null;
  status?: string | null; // draft | published
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
      price = null,
      compare_at_price = null,
      currency = "PKR",
      sku = null,
      shipping_weight = null,
      featured = false,
      stock = null,
      collection_ids = null,
      category_ids = null,
      variants = null,
      status = "draft",
    } = body;

    // Basic validation
    if (!title) {
      return NextResponse.json(
        { error: "Missing required fields: title" },
        { status: 400 }
      );
    }

    await client.connect();

    // Auto-generate SKU if not provided: <PREFIX>-<TIMESTAMP>
    let finalSku = sku;
    if (!finalSku) {
      const prefix =
        title
          .replace(/[^A-Z0-9]+/gi, "-")
          .toUpperCase()
          .split("-")
          .slice(0, 3)
          .join("-") || "PRD";
      finalSku = `${prefix}-${Date.now().toString().slice(-6)}`;
    }

    // Helper: ensure SKU is unique across products and variants; append random suffix on collision
    async function ensureUniqueSkuAcrossTables(candidate: string) {
      let attempt = 0;
      let s = candidate;
      while (attempt < 6) {
        const checkP = await client.query(
          "SELECT 1 FROM bazaar_products WHERE sku = $1 LIMIT 1",
          [s]
        );
        const checkV = await client.query(
          "SELECT 1 FROM bazaar_product_variants WHERE sku = $1 LIMIT 1",
          [s]
        );
        if (checkP.rowCount === 0 && checkV.rowCount === 0) return s;
        s = `${candidate}-${Math.random()
          .toString(36)
          .substr(2, 4)
          .toUpperCase()}`;
        attempt++;
      }
      return candidate; // fallback
    }

    finalSku = await ensureUniqueSkuAcrossTables(finalSku);

    // Insert product
    const hasVariants = variants && variants.length > 0 ? true : false;

    // Determine product price: if variants exist, set product.price to first variant price or min; else require price
    let productPrice = 0;
    if (hasVariants) {
      const firstVariantPrice =
        Array.isArray(variants) && variants.length > 0
          ? variants[0].price_override ?? null
          : null;
      productPrice = firstVariantPrice ?? 0;
    } else {
      if (price === null || price === undefined) {
        return NextResponse.json(
          {
            error: "Missing required field: price (when no variants provided)",
          },
          { status: 400 }
        );
      }
      productPrice = price;
    }

    const insertProductQuery = `
      INSERT INTO bazaar_products (
        title, slug, description, short_description, price,
        currency, sku, shipping_weight, featured, has_variants, variant_attributes, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW()) RETURNING *;
    `;

    const productValues: any[] = [
      title,
      slug,
      description,
      short_description,
      productPrice,
      currency,
      finalSku,
      shipping_weight,
      featured,
      hasVariants,
      JSON.stringify({}),
      status,
    ];

    const result = await client.query(insertProductQuery, productValues);
    const product = result.rows[0];

    // Link categories (many-to-many)
    if (category_ids && category_ids.length > 0) {
      const catInsertPromises = category_ids.map((catId) => {
        return client.query(
          `INSERT INTO bazaar_product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [product.product_id, catId]
        );
      });
      await Promise.all(catInsertPromises);
    }

    // Link collections (pet types) using collection_id in products table for backward compatibility we will store first collection
    if (collection_ids && collection_ids.length > 0) {
      // If your schema has a dedicated collections table, link the first one.
      const firstCollection = collection_ids[0];
      await client.query(
        "UPDATE bazaar_products SET collection_id = $1 WHERE product_id = $2",
        [firstCollection, product.product_id]
      );
      // Optionally you can create a product_collections join table; omitted for brevity.
    }

    // Create variants if provided and collect inserted rows
    const insertedVariants: any[] = [];
    if (variants && variants.length > 0) {
      for (const v of variants) {
        let variantSku =
          v.sku ||
          `${finalSku}-${Math.random()
            .toString(36)
            .substr(2, 5)
            .toUpperCase()}`;
        variantSku = await ensureUniqueSkuAcrossTables(variantSku);
        const variantQuery = `
          INSERT INTO bazaar_product_variants (
            product_id, title, sku, price_override, compare_at_price, stock, weight_override, attributes, is_default, sort_order, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,NOW(),NOW()) RETURNING *;
        `;
        const variantValues = [
          product.product_id,
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

    // Invalidate product cache since we added a new product
    await invalidateProductCache();

    // return product with variants to allow front-end to upload images per variant
    const out = { ...product, variants: insertedVariants };
    return NextResponse.json(out, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error", message: (err as Error).message },
      { status: 500 }
    );
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

export async function GET(req: NextRequest) {
  const client = createClient();
  try {
    // Clear any existing corrupted cache on first request
    await clearStartupCache();

    await client.connect();

    // Get query parameters
    const { searchParams } = new URL(req.url);
  const adminView = searchParams.get("admin") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(8, parseInt(searchParams.get("limit") || "24", 10)));
    const offset = (page - 1) * limit;

  // Read filters from query params (server-side filtering)
  const filterCategory = searchParams.get('category');
  const filterCollection = searchParams.get('collection');
  const filterKeyword = searchParams.get('keyword');

  // Dynamic cache key including query params and filters (best practice)
  // Normalize filter values for consistent caching - always use strings for cache keys
  const normalizedCategory = filterCategory || '';
  const normalizedCollection = filterCollection || '';
  const normalizedKeyword = filterKeyword || '';
  const cacheKey = `products:admin=${adminView}:page=${page}:limit=${limit}:cat=${normalizedCategory}:col=${normalizedCollection}:kw=${normalizedKeyword}`;

    // Try Redis cache first
    try {
      const cachedData = await safeRedis.get(cacheKey);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          console.info(`[Cache] Redis hit for ${cacheKey}`);
          return NextResponse.json(parsed, { status: 200 });
        } catch (parseErr) {
          // Malformed value in cache — delete the bad key and continue to DB
          console.warn('[Cache] Invalid JSON in cache, deleting key:', cacheKey);
          await safeRedis.del(cacheKey);
        }
      }
    } catch (e) {
      console.warn('[Cache] Redis GET failed (non-fatal):', e);
      // Continue to DB query if Redis fails
    }

    // Check if media table has variant_id column (schema may vary)
    const colCheck = await client.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'bazaar_product_media' AND column_name = 'variant_id' LIMIT 1");
  const hasVariantMediaCol = (colCheck && (colCheck.rowCount || 0) > 0) || false;

    // Build variants subquery differently depending on whether variant_id is present in media table
    const variantsSubquery = hasVariantMediaCol
      ? `(SELECT json_agg(json_build_object('variant_id', v.variant_id, 'title', v.title, 'sku', v.sku, 'price_override', v.price_override, 'compare_at_price', v.compare_at_price, 'stock', v.stock, 'attributes', v.attributes, 'images', COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m2 WHERE m2.variant_id = v.variant_id), '[]'::json))) FROM bazaar_product_variants v WHERE v.product_id = p.product_id)`
      : `(SELECT json_agg(json_build_object('variant_id', v.variant_id, 'title', v.title, 'sku', v.sku, 'price_override', v.price_override, 'compare_at_price', v.compare_at_price, 'stock', v.stock, 'attributes', v.attributes, 'images', '[]'::json)) FROM bazaar_product_variants v WHERE v.product_id = p.product_id)`;

    let query = `
  SELECT p.product_id, p.title, p.slug, p.short_description, p.description, p.price,
     p.currency, p.sku, p.shipping_weight, p.featured,
     COALESCE((SELECT SUM(stock) FROM bazaar_product_variants v2 WHERE v2.product_id = p.product_id), 0) AS stock_total,
     p.collection_id, p.status, p.created_at,
     COALESCE(bc.name, 'General') AS collection_name,
    COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m WHERE m.product_id = p.product_id), '[]'::json) AS images,
    COALESCE((SELECT json_agg(json_build_object('category_id', c.category_id, 'name', c.name)) FROM bazaar_categories c JOIN bazaar_product_categories bpc ON c.category_id = bpc.category_id WHERE bpc.product_id = p.product_id), '[]'::json) AS categories,
  COALESCE(${variantsSubquery}, '[]'::json) AS variants
      FROM bazaar_products p
      LEFT JOIN bazaar_collections bc ON p.collection_id = bc.collection_id
    `;

    // Build WHERE clauses (including filters) using parameterized values
    const whereClauses: string[] = [];
    const whereValues: any[] = [];
    if (!adminView) whereClauses.push("(p.status = 'published' OR p.status IS NULL)");

    if (filterKeyword) {
      whereValues.push(`%${filterKeyword}%`);
      const idx = whereValues.length;
      whereClauses.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx})`);
    }

    if (filterCollection) {
      // Handle both ID and name for collections
      if (!isNaN(Number(filterCollection))) {
        // If it's a number, treat as collection_id
        whereValues.push(Number(filterCollection));
        const idx = whereValues.length;
        whereClauses.push(`p.collection_id = $${idx}`);
      } else {
        // If it's a string, match by collection name
        whereValues.push(filterCollection);
        const idx = whereValues.length;
        whereClauses.push(`bc.name ILIKE $${idx}`);
      }
    }

    if (filterCategory) {
      // Handle both ID and name for categories
      if (!isNaN(Number(filterCategory))) {
        // If it's a number, treat as category_id
        whereValues.push(Number(filterCategory));
        const idx = whereValues.length;
        whereClauses.push(`EXISTS (SELECT 1 FROM bazaar_product_categories bpc WHERE bpc.product_id = p.product_id AND bpc.category_id = $${idx})`);
      } else {
        // If it's a string, match by category name
        whereValues.push(filterCategory);
        const idx = whereValues.length;
        whereClauses.push(`EXISTS (SELECT 1 FROM bazaar_product_categories bpc JOIN bazaar_categories bc_filter ON bpc.category_id = bc_filter.category_id WHERE bpc.product_id = p.product_id AND bc_filter.name ILIKE $${idx})`);
      }
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // push limit and offset placeholders after where values
    const limitIdx = whereValues.length + 1;
    const offsetIdx = whereValues.length + 2;
    query += ` ORDER BY p.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

    // Also fetch total count for pagination with same WHERE conditions and JOINs
    let countQuery = `
      SELECT COUNT(DISTINCT p.product_id) AS total
      FROM bazaar_products p
      LEFT JOIN bazaar_collections bc ON p.collection_id = bc.collection_id
    `;

    if (whereClauses.length > 0) {
      countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const countRes = await client.query(countQuery, whereValues);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

  const result = await client.query(query, [...whereValues, limit, offset]);

  const out = { rows: result.rows, meta: { total, page, limit } };

    // Store in Redis cache with expiry (best practice)
    try {
      const serialized = JSON.stringify(out);
      const success = await safeRedis.set(cacheKey, serialized, 'EX', CACHE_TTL_SEC);
      if (success) {
        console.info(`[Cache] Stored ${cacheKey} in Redis for ${CACHE_TTL_SEC}s`);
      }
    } catch (e) {
      console.warn('[Cache] Redis SET failed (non-fatal):', e instanceof Error ? e.message : e);
      // Don't let cache failures break the API response
    }

    return NextResponse.json(out, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  } finally {
    try {
      await client.end();
    } catch {}
  }
}
