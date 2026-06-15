/**
 * imageOptimizer.ts
 * Transforms raw image URLs into optimized, sized variants.
 * - Cloudinary: injects w_, h_, c_fill, q_auto, f_auto transformations
 * - S3 (paltuu-main): routes through CloudFront CDN (djw7hbeqkm7bf.cloudfront.net)
 * - All others: returns the original URL unchanged
 */

const CLOUDFRONT_DOMAIN = "djw7hbeqkm7bf.cloudfront.net";
const S3_DOMAIN = "paltuu-main.s3.ap-south-1.amazonaws.com";

/**
 * Returns an optimized URL for the given image.
 * @param url    Original image URL from the database
 * @param width  Desired width in pixels (default: 400)
 * @param height Desired height in pixels (default: width)
 */
export function getOptimizedImageUrl(
  url: string,
  width = 400,
  height = width
): string {
  if (!url) return url;

  // ── Cloudinary ────────────────────────────────────────────────────────────
  // Original: https://res.cloudinary.com/<cloud>/image/upload/<public_id>
  // Optimized: .../image/upload/w_400,h_400,c_fill,q_auto,f_auto/<public_id>
  if (url.includes("res.cloudinary.com")) {
    return url.replace(
      "/image/upload/",
      `/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`
    );
  }

  // ── S3 → CloudFront CDN ───────────────────────────────────────────────────
  // Route through CloudFront for CDN edge-caching. No resize (Lambda@Edge
  // would be needed for that), but hits are served from the nearest PoP.
  if (url.includes(S3_DOMAIN)) {
    return url.replace(S3_DOMAIN, CLOUDFRONT_DOMAIN);
  }

  // ── Supabase storage ──────────────────────────────────────────────────────
  // Supabase supports image transformation via query params on storage URLs.
  // Only apply if the URL contains "/storage/v1/object/public/"
  if (
    (url.includes("supabase.co") || url.includes("supabase.in")) &&
    url.includes("/storage/v1/object/public/")
  ) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("width", String(width));
      parsed.searchParams.set("height", String(height));
      parsed.searchParams.set("resize", "cover");
      parsed.searchParams.set("quality", "75");
      parsed.searchParams.set("format", "webp");
      return parsed.toString();
    } catch {
      return url;
    }
  }

  // ── Fallback: return unchanged ────────────────────────────────────────────
  return url;
}

/**
 * Tiny 1×1 transparent WebP as a base64 blur placeholder.
 * Used as `blurDataURL` for next/image placeholder="blur".
 */
export const BLUR_DATA_URL =
  "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAkA4JZQCdAEO/gHOAAA=";
