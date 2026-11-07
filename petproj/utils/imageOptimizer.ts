/**
 * imageOptimizer.ts
 * Transforms raw image URLs into optimized, sized variants.
 * - Cloudinary: injects w_, h_, c_fill, q_auto, f_auto transformations
 * - Supabase storage: adds width/height/resize query params
 * - All others (incl. S3 paltuu-main): returns the original URL unchanged
 */

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

  // ── S3 (paltuu-main) ──────────────────────────────────────────────────────
  // Returned unchanged. paltuu-main has no CloudFront distribution: the
  // djw7hbeqkm7bf.cloudfront.net domain fronts the *social* bucket, so
  // rewriting main-bucket URLs to it 403s every image (PALTU-93). If a CDN is
  // ever put in front of paltuu-main, set AWS_CLOUDFRONT_DOMAIN_MAIN and let
  // lib/s3.ts emit CDN URLs at upload time instead.

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
