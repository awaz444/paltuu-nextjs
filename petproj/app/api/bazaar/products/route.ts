import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../../db/ecom";
import { safeRedis } from "../../../../utils/redis";

export const revalidate = 0;

const CACHE_TTL_SEC = 300; // 5 minutes

// Track cache keys in a Set for efficient invalidation (avoids slow KEYS scan)
const CACHE_KEY_SET = 'cache:product_keys';

async function invalidateProductCache() {
  try {
    // Instead of scanning with KEYS (slow), maintain a set of cache keys
    // For now, we use a simple wildcard approach but limit impact
    // Better: Track keys in Redis SET, but requires updating cache logic
    const pattern = 'products:*';

    // Optimized: Only scan if Redis supports it, otherwise just delete known patterns
    try {
      const keys = await safeRedis.keys(pattern);
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

export interface CreateBazaarProductDto {
  title: string;
  slug?: string;
  description?: string;
  seo_title?: string;
  seo_description?: string;
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
  const pool = getPool();
  let client: any = null;
  try {
    client = await pool.connect();
    const body: CreateBazaarProductDto = await req.json();
    const {
      title,
      slug = null,
      description = null,
      seo_title = null,
      seo_description = null,
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

    // No need to call client.connect() when using pool

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
        title, slug, description, seo_title, seo_description, price,
        currency, sku, shipping_weight, featured, has_variants, variant_attributes, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW()) RETURNING *;
    `;

    const productValues: any[] = [
      title,
      slug,
      description,
      seo_title,
      seo_description,
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

    // Link collections (pet types) using junction table - supports multiple collections
    if (collection_ids && collection_ids.length > 0) {
      const collectionInsertPromises = collection_ids.map((collectionId) => {
        return client.query(
          `INSERT INTO bazaar_product_collections (product_id, collection_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [product.product_id, collectionId]
        );
      });
      await Promise.all(collectionInsertPromises);
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
    if (client) client.release(); // Return connection to pool
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const pool = getPool();
  let client: any = null;
  try {
    client = await pool.connect();
    console.info('[Perf] DB connected in', Date.now() - startTime, 'ms');

    // Get query parameters
    const { searchParams } = new URL(req.url);
  const adminView = searchParams.get("admin") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(8, parseInt(searchParams.get("limit") || "25", 10)));
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

    // Check if media table has variant_id column (schema may vary) - cache this check
    const schemaCheckStart = Date.now();
    let hasVariantMediaCol = false;
    const schemaCacheKey = 'schema:variant_media_col';
    try {
      const cached = await safeRedis.get(schemaCacheKey);
      if (cached !== null) {
        hasVariantMediaCol = cached === 'true';
        console.info('[Perf] Schema check cached');
      } else {
        const colCheck = await client.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'bazaar_product_media' AND column_name = 'variant_id' LIMIT 1");
        hasVariantMediaCol = (colCheck && (colCheck.rowCount || 0) > 0) || false;
        await safeRedis.set(schemaCacheKey, hasVariantMediaCol ? 'true' : 'false', 'EX', 86400); // cache for 24h
        console.info('[Perf] Schema check took', Date.now() - schemaCheckStart, 'ms');
      }
    } catch (e) {
      // Fallback if Redis fails
      const colCheck = await client.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'bazaar_product_media' AND column_name = 'variant_id' LIMIT 1");
      hasVariantMediaCol = (colCheck && (colCheck.rowCount || 0) > 0) || false;
    }

    // Build variants subquery differently depending on whether variant_id is present in media table
    const variantsSubquery = hasVariantMediaCol
      ? `(SELECT json_agg(json_build_object('variant_id', v.variant_id, 'title', v.title, 'sku', v.sku, 'price_override', v.price_override, 'compare_at_price', v.compare_at_price, 'stock', v.stock, 'attributes', v.attributes, 'images', COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m2 WHERE m2.variant_id = v.variant_id), '[]'::json))) FROM bazaar_product_variants v WHERE v.product_id = p.product_id)`
      : `(SELECT json_agg(json_build_object('variant_id', v.variant_id, 'title', v.title, 'sku', v.sku, 'price_override', v.price_override, 'compare_at_price', v.compare_at_price, 'stock', v.stock, 'attributes', v.attributes, 'images', '[]'::json)) FROM bazaar_product_variants v WHERE v.product_id = p.product_id)`;

    let query = `
  SELECT p.product_id, p.title, p.slug, p.description, p.seo_title, p.seo_description, p.price,
     p.currency, p.sku, p.shipping_weight, p.featured,
     COALESCE((SELECT SUM(stock) FROM bazaar_product_variants v2 WHERE v2.product_id = p.product_id), 0) AS stock_total,
     p.status, p.created_at,
    COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m WHERE m.product_id = p.product_id), '[]'::json) AS images,
    COALESCE((SELECT json_agg(json_build_object('category_id', c.category_id, 'name', c.name)) FROM bazaar_categories c JOIN bazaar_product_categories bpc ON c.category_id = bpc.category_id WHERE bpc.product_id = p.product_id), '[]'::json) AS categories,
    COALESCE((SELECT json_agg(json_build_object('collection_id', col.collection_id, 'name', col.name)) FROM bazaar_collections col JOIN bazaar_product_collections bpcol ON col.collection_id = bpcol.collection_id WHERE bpcol.product_id = p.product_id), '[]'::json) AS collections,
  COALESCE(${variantsSubquery}, '[]'::json) AS variants
      FROM bazaar_products p
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
      // Handle both ID and name for collections using junction table
      if (!isNaN(Number(filterCollection))) {
        // If it's a number, treat as collection_id
        whereValues.push(Number(filterCollection));
        const idx = whereValues.length;
        whereClauses.push(`EXISTS (SELECT 1 FROM bazaar_product_collections bpcol WHERE bpcol.product_id = p.product_id AND bpcol.collection_id = $${idx})`);
      } else {
        // If it's a string, match by collection name
        whereValues.push(filterCollection);
        const idx = whereValues.length;
        whereClauses.push(`EXISTS (SELECT 1 FROM bazaar_product_collections bpcol JOIN bazaar_collections bc_filter ON bpcol.collection_id = bc_filter.collection_id WHERE bpcol.product_id = p.product_id AND bc_filter.name ILIKE $${idx})`);
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

    // Also fetch total count for pagination with same WHERE conditions
    let countQuery = `
      SELECT COUNT(DISTINCT p.product_id) AS total
      FROM bazaar_products p
    `;

    if (whereClauses.length > 0) {
      countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const countStart = Date.now();
    const countRes = await client.query(countQuery, whereValues);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);
    console.info('[Perf] Count query took', Date.now() - countStart, 'ms');

    const queryStart = Date.now();
    const result = await client.query(query, [...whereValues, limit, offset]);
    console.info('[Perf] Main query took', Date.now() - queryStart, 'ms');

  const out = { rows: result.rows, meta: { total, page, limit } };

    // Store in Redis cache with expiry (best practice)
    const cacheSetStart = Date.now();
    try {
      const serialized = JSON.stringify(out);
      const success = await safeRedis.set(cacheKey, serialized, 'EX', CACHE_TTL_SEC);
      if (success) {
        console.info(`[Cache] Stored ${cacheKey} in Redis (${(serialized.length / 1024).toFixed(2)} KB) in ${Date.now() - cacheSetStart}ms`);
      }
    } catch (e) {
      console.warn('[Cache] Redis SET failed (non-fatal):', e instanceof Error ? e.message : e);
      // Don't let cache failures break the API response
    }

    const totalTime = Date.now() - startTime;
    console.info(`[Perf] Total GET /api/bazaar/products took ${totalTime}ms`);
    return NextResponse.json(out, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  } finally {
    if (client) client.release(); // Return connection to pool
  }
}
