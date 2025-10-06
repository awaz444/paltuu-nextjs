import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../../db/ecom";
import { safeRedis } from "../../../../utils/redis";

export const revalidate = 0;

const CACHE_TTL_SEC = 300; // 5 minutes

/**
 * OPTIMIZED PRODUCTS ENDPOINT
 *
 * Key optimizations:
 * 1. Separate queries for products and related data (faster than nested JSON_AGG)
 * 2. Connection pooling
 * 3. Cached schema checks
 * 4. Reduced payload (optional fields only when needed)
 * 5. Aggressive caching
 */

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const pool = getPool();
  let client;

  try {
    const { searchParams } = new URL(req.url);
    const adminView = searchParams.get("admin") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(8, parseInt(searchParams.get("limit") || "24", 10)));
    const offset = (page - 1) * limit;

    // Filters
    const filterCategory = searchParams.get('category') || '';
    const filterCollection = searchParams.get('collection') || '';
    const filterKeyword = searchParams.get('keyword') || '';
    const includeVariants = searchParams.get('variants') === 'true'; // Only load variants if needed

    // Cache key
    const cacheKey = `products:v2:admin=${adminView}:page=${page}:limit=${limit}:cat=${filterCategory}:col=${filterCollection}:kw=${filterKeyword}:var=${includeVariants}`;

    // Try cache first
    try {
      const cachedData = await safeRedis.get(cacheKey);
      if (cachedData) {
        // Upstash returns already parsed object, ioredis returns string
        const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        console.info(`[Cache HIT] ${cacheKey} (${Date.now() - startTime}ms)`);
        return NextResponse.json(parsed, {
          status: 200,
          headers: { 'X-Cache': 'HIT', 'X-Response-Time': `${Date.now() - startTime}ms` }
        });
      }
    } catch (e) {
      console.warn('[Cache] Read failed:', e);
    }

    console.info('[Cache MISS] Fetching from DB...');

    // Get connection from pool
    const connStart = Date.now();
    client = await pool.connect();
    console.info('[Perf] Connection acquired in', Date.now() - connStart, 'ms');

    // Build WHERE clause
    const whereClauses: string[] = [];
    const whereValues: any[] = [];

    if (!adminView) {
      whereClauses.push("(p.status = 'published' OR p.status IS NULL)");
    }

    if (filterKeyword) {
      whereValues.push(`%${filterKeyword}%`);
      const idx = whereValues.length;
      whereClauses.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx})`);
    }

    if (filterCollection) {
      if (!isNaN(Number(filterCollection))) {
        whereValues.push(Number(filterCollection));
        whereClauses.push(`p.collection_id = $${whereValues.length}`);
      } else {
        whereValues.push(filterCollection);
        whereClauses.push(`bc.name ILIKE $${whereValues.length}`);
      }
    }

    if (filterCategory) {
      if (!isNaN(Number(filterCategory))) {
        whereValues.push(Number(filterCategory));
        whereClauses.push(`EXISTS (SELECT 1 FROM bazaar_product_categories bpc WHERE bpc.product_id = p.product_id AND bpc.category_id = $${whereValues.length})`);
      } else {
        whereValues.push(filterCategory);
        whereClauses.push(`EXISTS (SELECT 1 FROM bazaar_product_categories bpc JOIN bazaar_categories bc_filter ON bpc.category_id = bc_filter.category_id WHERE bpc.product_id = p.product_id AND bc_filter.name ILIKE $${whereValues.length})`);
      }
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // OPTIMIZED: Fetch only essential fields first
    const productsQuery = `
      SELECT
        p.product_id,
        p.title,
        p.slug,
        p.price,
        p.currency,
        p.sku,
        p.featured,
        p.collection_id,
        p.status,
        p.created_at,
        COALESCE(bc.name, 'General') AS collection_name
      FROM bazaar_products p
      LEFT JOIN bazaar_collections bc ON p.collection_id = bc.collection_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${whereValues.length + 1}
      OFFSET $${whereValues.length + 2}
    `;

    const queryStart = Date.now();
    const productsResult = await client.query(productsQuery, [...whereValues, limit, offset]);
    console.info('[Perf] Products query took', Date.now() - queryStart, 'ms');

    const products = productsResult.rows;
    const productIds = products.map(p => p.product_id);

    // Fetch counts
    const countStart = Date.now();
    const countQuery = `
      SELECT COUNT(DISTINCT p.product_id) AS total
      FROM bazaar_products p
      LEFT JOIN bazaar_collections bc ON p.collection_id = bc.collection_id
      ${whereClause}
    `;
    const countResult = await client.query(countQuery, whereValues);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);
    console.info('[Perf] Count query took', Date.now() - countStart, 'ms');

    // Fetch first image per product (much faster than JSON_AGG of all images)
    let imagesMap = new Map();
    if (productIds.length > 0) {
      const imagesStart = Date.now();
      const imagesQuery = `
        SELECT DISTINCT ON (product_id)
          product_id,
          url
        FROM bazaar_product_media
        WHERE product_id = ANY($1)
        ORDER BY product_id, ordering
      `;
      const imagesResult = await client.query(imagesQuery, [productIds]);
      imagesResult.rows.forEach(row => {
        imagesMap.set(row.product_id, row.url);
      });
      console.info('[Perf] Images query took', Date.now() - imagesStart, 'ms');
    }

    // Fetch variants only if requested
    let variantsMap = new Map();
    if (includeVariants && productIds.length > 0) {
      const variantsStart = Date.now();
      const variantsQuery = `
        SELECT
          variant_id,
          product_id,
          title,
          sku,
          price_override,
          stock
        FROM bazaar_product_variants
        WHERE product_id = ANY($1)
        ORDER BY product_id, variant_id
      `;
      const variantsResult = await client.query(variantsQuery, [productIds]);
      variantsResult.rows.forEach(variant => {
        if (!variantsMap.has(variant.product_id)) {
          variantsMap.set(variant.product_id, []);
        }
        variantsMap.get(variant.product_id).push(variant);
      });
      console.info('[Perf] Variants query took', Date.now() - variantsStart, 'ms');
    }

    // Assemble response
    const rows = products.map(p => ({
      ...p,
      image: imagesMap.get(p.product_id) || null,
      variants: includeVariants ? (variantsMap.get(p.product_id) || []) : undefined
    }));

    const out = { rows, meta: { total, page, limit } };

    // Cache response
    const cacheStart = Date.now();
    try {
      const serialized = JSON.stringify(out);
      await safeRedis.set(cacheKey, serialized, 'EX', CACHE_TTL_SEC);
      console.info(`[Cache] Stored ${cacheKey} (${(serialized.length / 1024).toFixed(2)} KB) in ${Date.now() - cacheStart}ms`);
    } catch (e) {
      console.warn('[Cache] Write failed:', e);
    }

    const totalTime = Date.now() - startTime;
    console.info(`[Perf] TOTAL time: ${totalTime}ms`);

    return NextResponse.json(out, {
      status: 200,
      headers: { 'X-Cache': 'MISS', 'X-Response-Time': `${totalTime}ms` }
    });

  } catch (err) {
    console.error('[Error]', err);
    return NextResponse.json(
      { error: "Failed to fetch products", message: (err as Error).message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
