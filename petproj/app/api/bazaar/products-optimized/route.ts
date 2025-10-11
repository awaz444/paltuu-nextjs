import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../../db/ecom";
import { safeRedis } from "../../../../utils/redis";

export const revalidate = 0;
export const dynamic = 'force-dynamic'; // Ensure fresh data for each request

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
    const limit = Math.min(100, Math.max(8, parseInt(searchParams.get("limit") || "25", 10)));
    const offset = (page - 1) * limit;

    // Filters
    const filterCategory = searchParams.get('category') || '';
    const filterCollection = searchParams.get('collection') || '';
    const filterKeyword = searchParams.get('keyword') || '';
    const categorySlug = searchParams.get('categorySlug') || ''; // For category-based filtering
    const sortBy = searchParams.get('sortBy') || ''; // trending, discount, new
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const filterProductIds = searchParams.get('productIds') || ''; // Comma-separated product IDs
    const featuredIds = searchParams.get('featuredIds') || ''; // Featured products for sections
    const includeVariants = searchParams.get('variants') === 'true'; // Only load variants if needed

    // Cache key
    const cacheKey = `products:v5:admin=${adminView}:page=${page}:limit=${limit}:cat=${filterCategory}:slug=${categorySlug}:col=${filterCollection}:kw=${filterKeyword}:sort=${sortBy}:minP=${minPrice}:maxP=${maxPrice}:ids=${filterProductIds}:feat=${featuredIds}:var=${includeVariants}`;

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

    // Filter by specific product IDs (for curated sections)
    // When filtering by IDs, skip other filters
    if (filterProductIds) {
      const idsArray = filterProductIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (idsArray.length > 0) {
        whereValues.push(idsArray);
        whereClauses.push(`p.product_id = ANY($${whereValues.length})`);
        console.info(`[Filter] Using curated product IDs: [${idsArray.join(', ')}]`);
      }
    } else if (featuredIds) {
      // Use featured IDs for sections (new approach)
      const idsArray = featuredIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (idsArray.length > 0) {
        whereValues.push(idsArray);
        whereClauses.push(`p.product_id = ANY($${whereValues.length})`);
        console.info(`[Filter] Using featured product IDs: [${idsArray.join(', ')}]`);
      }
    } else {
      // Only apply these filters when NOT using curated product IDs
      if (filterKeyword) {
        whereValues.push(`%${filterKeyword}%`);
        const idx = whereValues.length;
        whereClauses.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx})`);
      }

      // Category filtering by slug (for landing page categories)
      if (categorySlug) {
        whereValues.push(categorySlug);
        whereClauses.push(`EXISTS (
          SELECT 1 FROM bazaar_product_categories bpc
          JOIN bazaar_categories bc_slug ON bpc.category_id = bc_slug.category_id
          WHERE bpc.product_id = p.product_id AND bc_slug.slug = $${whereValues.length}
        )`);
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

      // Price range filters
      if (minPrice) {
        whereValues.push(Number(minPrice));
        whereClauses.push(`CAST(p.price AS DECIMAL) >= $${whereValues.length}`);
      }

      if (maxPrice) {
        whereValues.push(Number(maxPrice));
        whereClauses.push(`CAST(p.price AS DECIMAL) <= $${whereValues.length}`);
      }
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Determine ORDER BY based on sortBy parameter
    let orderByClause = 'ORDER BY p.created_at DESC'; // Default: newest first

    // If filtering by specific product IDs or featured IDs, order by the order they were provided
    if (filterProductIds) {
      const idsArray = filterProductIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (idsArray.length > 0) {
        // Use CASE statement to maintain the order of provided IDs
        const caseStatements = idsArray.map((id, idx) => `WHEN ${id} THEN ${idx}`).join(' ');
        orderByClause = `ORDER BY CASE p.product_id ${caseStatements} ELSE ${idsArray.length} END`;
      }
    } else if (featuredIds) {
      const idsArray = featuredIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (idsArray.length > 0) {
        // Use CASE statement to maintain the order of provided IDs
        const caseStatements = idsArray.map((id, idx) => `WHEN ${id} THEN ${idx}`).join(' ');
        orderByClause = `ORDER BY CASE p.product_id ${caseStatements} ELSE ${idsArray.length} END`;
      }
    } else if (sortBy === 'trending') {
      // Filter for featured products first, then sort by newest
      whereClauses.push("p.featured = true");
      orderByClause = 'ORDER BY p.created_at DESC';
    } else if (sortBy === 'discount') {
      // Sort by discount percentage - use SQL to calculate from variants table for accuracy
      orderByClause = `ORDER BY (
        SELECT MAX(
          CASE
            WHEN v.compare_at_price IS NOT NULL AND v.compare_at_price > 0 AND v.price_override IS NOT NULL
            THEN ((v.compare_at_price - v.price_override) / v.compare_at_price) * 100
            ELSE 0
          END
        )
        FROM bazaar_product_variants v
        WHERE v.product_id = p.product_id
      ) DESC NULLS LAST, p.featured DESC NULLS LAST, p.created_at DESC`;
    } else if (sortBy === 'new') {
      orderByClause = 'ORDER BY p.created_at DESC';
    } else if (sortBy === 'price_asc') {
      orderByClause = 'ORDER BY CAST(p.price AS DECIMAL) ASC';
    } else if (sortBy === 'price_desc') {
      orderByClause = 'ORDER BY CAST(p.price AS DECIMAL) DESC';
    }

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
        p.has_variants,
        COALESCE(bc.name, 'General') AS collection_name
      FROM bazaar_products p
      LEFT JOIN bazaar_collections bc ON p.collection_id = bc.collection_id
      ${whereClause}
      ${orderByClause}
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
          compare_at_price,
          stock
        FROM bazaar_product_variants
        WHERE product_id = ANY($1)
        ORDER BY product_id, is_default DESC NULLS LAST, variant_id
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

    // Fetch ratings and review counts for products
    let ratingsMap = new Map();
    if (productIds.length > 0) {
      const ratingsStart = Date.now();
      const ratingsQuery = `
        SELECT
          product_id,
          ROUND(AVG(rating)::numeric, 1) as avg_rating,
          COUNT(*) as review_count
        FROM bazaar_product_reviews
        WHERE product_id = ANY($1)
          AND status = 'approved'
        GROUP BY product_id
      `;
      try {
        const ratingsResult = await client.query(ratingsQuery, [productIds]);
        ratingsResult.rows.forEach(row => {
          ratingsMap.set(row.product_id, {
            rating: parseFloat(row.avg_rating),
            reviewCount: parseInt(row.review_count, 10)
          });
        });
        console.info('[Perf] Ratings query took', Date.now() - ratingsStart, 'ms');
      } catch (err) {
        console.warn('[Perf] Ratings query failed (non-fatal):', err);
      }
    }

    // Assemble response with compare_at_price from variants
    const rows = products.map(p => {
      const variants = includeVariants ? (variantsMap.get(p.product_id) || []) : undefined;
      const firstVariant = variants && variants.length > 0 ? variants[0] : null;
      const ratingData = ratingsMap.get(p.product_id);

      return {
        ...p,
        image: imagesMap.get(p.product_id) || null,
        variants,
        // Add compare_at_price from first variant if available
        compare_at_price: firstVariant?.compare_at_price || null,
        // Add rating and review count
        rating: ratingData?.rating || null,
        reviewCount: ratingData?.reviewCount || 0,
      };
    });

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
