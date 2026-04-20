/**
 * @swagger
 * /api/bazaar/products-optimized:
 *   get:
 *     summary: Auto-generated summary for /api/bazaar/products-optimized
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db/index";
import { safeRedis } from "../../../../utils/redis";
import pluralize from "pluralize";

export const revalidate = 0;
export const dynamic = "force-dynamic"; // Ensure fresh data for each request

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
  const pool = db;
  let client;

  try {
    const { searchParams } = new URL(req.url);
    const adminView = searchParams.get("admin") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(8, parseInt(searchParams.get("limit") || "25", 10))
    );
    const offset = (page - 1) * limit;

    // Filters
    const filterCategory = searchParams.get("category") || "";
    const filterCollection = searchParams.get("collection") || "";
    const rawFilterKeyword = searchParams.get("keyword") || "";
    // Normalize keyword: split into words, strip punctuation, singularize and lowercase
    const filterKeyword = (() => {
      const raw = String(rawFilterKeyword || "").trim();
      if (!raw) return "";
      const words = raw
        .split(/\s+/)
        .map((w) => w.replace(/[^\p{L}\p{N}]/gu, "")) // remove punctuation
        .filter(Boolean)
        .map((w) => pluralize.singular(w.toLowerCase()));
      return words.join(" ");
    })();
    const categorySlug = searchParams.get("categorySlug") || ""; // For category-based filtering
    const petType = searchParams.get("petType") || ""; // For pet type filtering (cat, dog, fish, bird)
    const sortBy = searchParams.get("sortBy") || ""; // trending, discount, new
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const filterProductIds = searchParams.get("productIds") || ""; // Comma-separated product IDs
    const featuredIds = searchParams.get("featuredIds") || ""; // Featured products for sections
    const includeVariants = searchParams.get("variants") === "true"; // Only load variants if needed

    // Cache key
    const cacheKey = `products:v9:admin=${adminView}:page=${page}:limit=${limit}:cat=${filterCategory}:slug=${categorySlug}:col=${filterCollection}:kw=${filterKeyword}:pet=${petType}:sort=${sortBy}:minP=${minPrice}:maxP=${maxPrice}:ids=${filterProductIds}:feat=${featuredIds}:var=${includeVariants}`;
    // Determine ORDER BY based on sortBy parameter
    let orderByClause = 'ORDER BY p.created_at DESC'; // Default: newest first
    // Try cache first
    try {
      const cachedData = await safeRedis.get(cacheKey);
      if (cachedData) {
        // Upstash returns already parsed object, ioredis returns string
        const parsed =
          typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
        console.info(`[Cache HIT] ${cacheKey} (${Date.now() - startTime}ms)`);
        return NextResponse.json(parsed, {
          status: 200,
          headers: {
            "X-Cache": "HIT",
            "X-Response-Time": `${Date.now() - startTime}ms`,
          },
        });
      }
    } catch (e) {
      console.warn("[Cache] Read failed:", e);
    }

    console.info("[Cache MISS] Fetching from DB...");

    // Get connection from pool
    const connStart = Date.now();
    client = await pool.connect();
    console.info("[Perf] Connection acquired in", Date.now() - connStart, "ms");

    // Build WHERE clause
    const whereClauses: string[] = [];
    const whereValues: any[] = [];

    if (!adminView) {
      whereClauses.push("(p.status = 'published' OR p.status IS NULL)");
    }

    // Filter by specific product IDs (for curated sections)
    // When filtering by IDs, skip other filters
    if (filterProductIds) {
      const idsArray = filterProductIds
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
      if (idsArray.length > 0) {
        whereValues.push(idsArray);
        whereClauses.push(`p.product_id = ANY($${whereValues.length})`);
        console.info(
          `[Filter] Using curated product IDs: [${idsArray.join(", ")}]`
        );
      }
    } else if (featuredIds) {
      // Use featured IDs for sections (new approach)
      const idsArray = featuredIds
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
      if (idsArray.length > 0) {
        whereValues.push(idsArray);
        whereClauses.push(`p.product_id = ANY($${whereValues.length})`);
        console.info(
          `[Filter] Using featured product IDs: [${idsArray.join(", ")}]`
        );
      }
    } else {
      // Only apply these filters when NOT using curated product IDs
      if (filterKeyword) {
  const SIMILARITY_THRESHOLD = 0.3;

  // Use trigram similarity only for longer keywords
if (filterKeyword) {
  const SIMILARITY_THRESHOLD =
  filterKeyword.length <= 4 ? 0.15 :
  filterKeyword.length <= 7 ? 0.2 :
  0.3;


  whereValues.push(filterKeyword);
  const idx = whereValues.length;
  

  whereClauses.push(`
  (
    LOWER(p.title) LIKE '%' || $${idx} || '%'
    OR word_similarity($${idx}, LOWER(p.title)) > ${SIMILARITY_THRESHOLD}
  )
`);

  // Rank fuzzy matches higher
  orderByClause =
  filterKeyword.length >= 3
    ? `ORDER BY word_similarity($${idx}, LOWER(p.title)) DESC, p.created_at DESC`
    : `ORDER BY p.created_at DESC`;

}



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

      // Pet type filtering (cat, dog, fish, bird, etc.)
      // This filters by collection (pet type) using junction table
      if (petType) {
        whereValues.push(`%${petType.toLowerCase()}%`);
        whereClauses.push(`EXISTS (
          SELECT 1 FROM bazaar_product_collections bpcol
          JOIN bazaar_collections bc_pet ON bpcol.collection_id = bc_pet.collection_id
          WHERE bpcol.product_id = p.product_id
          AND (LOWER(bc_pet.name) LIKE $${whereValues.length} OR LOWER(bc_pet.slug) LIKE $${whereValues.length})
        )`);
      }

      if (filterCollection) {
        if (!isNaN(Number(filterCollection))) {
          whereValues.push(Number(filterCollection));
          whereClauses.push(
            `EXISTS (SELECT 1 FROM bazaar_product_collections bpcol WHERE bpcol.product_id = p.product_id AND bpcol.collection_id = $${whereValues.length})`
          );
        } else {
          whereValues.push(filterCollection);
          whereClauses.push(
            `EXISTS (SELECT 1 FROM bazaar_product_collections bpcol JOIN bazaar_collections bc_filter ON bpcol.collection_id = bc_filter.collection_id WHERE bpcol.product_id = p.product_id AND bc_filter.name ILIKE $${whereValues.length})`
          );
        }
      }

      if (filterCategory) {
        if (!isNaN(Number(filterCategory))) {
          whereValues.push(Number(filterCategory));
          whereClauses.push(
            `EXISTS (SELECT 1 FROM bazaar_product_categories bpc WHERE bpc.product_id = p.product_id AND bpc.category_id = $${whereValues.length})`
          );
        } else {
          whereValues.push(filterCategory);
          whereClauses.push(
            `EXISTS (SELECT 1 FROM bazaar_product_categories bpc JOIN bazaar_categories bc_filter ON bpc.category_id = bc_filter.category_id WHERE bpc.product_id = p.product_id AND bc_filter.name ILIKE $${whereValues.length})`
          );
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

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // If filtering by specific product IDs or featured IDs, order by the order they were provided
    if (filterProductIds) {
      const idsArray = filterProductIds
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
      if (idsArray.length > 0) {
        // Use CASE statement to maintain the order of provided IDs
        const caseStatements = idsArray
          .map((id, idx) => `WHEN ${id} THEN ${idx}`)
          .join(" ");
        orderByClause = `ORDER BY CASE p.product_id ${caseStatements} ELSE ${idsArray.length} END`;
      }
    } else if (featuredIds) {
      const idsArray = featuredIds
        .split(",")
        .map((id: any) => parseInt(id.trim(), 10))
        .filter((id: any) => !isNaN(id));
      if (idsArray.length > 0) {
        // Use CASE statement to maintain the order of provided IDs
        const caseStatements = idsArray
          .map((id, idx) => `WHEN ${id} THEN ${idx}`)
          .join(" ");
        orderByClause = `ORDER BY CASE p.product_id ${caseStatements} ELSE ${idsArray.length} END`;
      }
    } else if (sortBy === "trending") {
      // Filter for featured products first, then sort by newest
      whereClauses.push("p.featured = true");
      orderByClause = "ORDER BY p.created_at DESC";
    } else if (sortBy === "discount") {
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
    } else if (sortBy === "new") {
      orderByClause = "ORDER BY p.created_at DESC";
    } else if (sortBy === "price_asc") {
      orderByClause = "ORDER BY CAST(p.price AS DECIMAL) ASC";
    } else if (sortBy === "price_desc") {
      orderByClause = "ORDER BY CAST(p.price AS DECIMAL) DESC";
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
        p.status,
        p.created_at,
        p.has_variants,
        COALESCE((SELECT json_agg(json_build_object('collection_id', col.collection_id, 'name', col.name)) FROM bazaar_collections col JOIN bazaar_product_collections bpcol ON col.collection_id = bpcol.collection_id WHERE bpcol.product_id = p.product_id), '[]'::json) AS collections
      FROM bazaar_products p
      ${whereClause}
      ${orderByClause}
      LIMIT $${whereValues.length + 1}
      OFFSET $${whereValues.length + 2}
    `;

    const queryStart = Date.now();
    const productsResult = await client.query(productsQuery, [
      ...whereValues,
      limit,
      offset,
    ]);
    console.info("[Perf] Products query took", Date.now() - queryStart, "ms");

    const products = productsResult.rows;
    const productIds = products.map((p: any) => p.product_id);

    // Fetch counts
    const countStart = Date.now();
    const countQuery = `
      SELECT COUNT(DISTINCT p.product_id) AS total
      FROM bazaar_products p
      ${whereClause}
    `;
    const countResult = await client.query(countQuery, whereValues);
    const total = parseInt(countResult.rows[0]?.total || "0", 10);
    console.info("[Perf] Count query took", Date.now() - countStart, "ms");

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
      imagesResult.rows.forEach((row: any) => {
        imagesMap.set(row.product_id, row.url);
      });
      console.info("[Perf] Images query took", Date.now() - imagesStart, "ms");
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
      variantsResult.rows.forEach((variant: any) => {
        if (!variantsMap.has(variant.product_id)) {
          variantsMap.set(variant.product_id, []);
        }
        variantsMap.get(variant.product_id).push(variant);
      });
      console.info(
        "[Perf] Variants query took",
        Date.now() - variantsStart,
        "ms"
      );
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
        ratingsResult.rows.forEach((row: any) => {
          ratingsMap.set(row.product_id, {
            rating: parseFloat(row.avg_rating),
            reviewCount: parseInt(row.review_count, 10),
          });
        });
        console.info(
          "[Perf] Ratings query took",
          Date.now() - ratingsStart,
          "ms"
        );
      } catch (err) {
        console.warn("[Perf] Ratings query failed (non-fatal):", err);
      }
    }

    // Assemble response with compare_at_price from variants
    const rows = products.map((p: any) => {
      const variants = includeVariants
        ? variantsMap.get(p.product_id) || []
        : undefined;
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
      await safeRedis.set(cacheKey, serialized, "EX", CACHE_TTL_SEC);
      console.info(
        `[Cache] Stored ${cacheKey} (${(serialized.length / 1024).toFixed(
          2
        )} KB) in ${Date.now() - cacheStart}ms`
      );
    } catch (e) {
      console.warn("[Cache] Write failed:", e);
    }

    const totalTime = Date.now() - startTime;
    console.info(`[Perf] TOTAL time: ${totalTime}ms`);

    return NextResponse.json(out, {
      status: 200,
      headers: { "X-Cache": "MISS", "X-Response-Time": `${totalTime}ms` },
    });
  } catch (err) {
    console.error("[Error]", err);
    return NextResponse.json(
      { error: "Failed to fetch products", message: (err as Error).message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
