/**
 * Validate that a media_type: 'gif' URL points at an allowed GIF CDN host
 * (Klipy today; Giphy kept for any already-posted media).
 */
export function isAllowedGifCdnUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== 'https:') return false;
    const host = hostname.toLowerCase();
    return (
      host === 'klipy.com' ||
      host === 'www.klipy.com' ||
      host.endsWith('.klipy.com') ||
      host === 'giphy.com' ||
      host === 'www.giphy.com' ||
      host.endsWith('.giphy.com')
    );
  } catch {
    return false;
  }
}

/** @deprecated Use isAllowedGifCdnUrl */
export const isAllowedGiphyCdnUrl = isAllowedGifCdnUrl;

/**
 * Validate a media array for create-post / create-comment.
 * Returns an error message, or null if OK.
 */
export function validateSocialMediaPayload(media: unknown): string | null {
  if (media == null) return null;
  if (!Array.isArray(media)) return 'media must be an array';
  for (let i = 0; i < media.length; i++) {
    const m = media[i];
    if (!m || typeof m !== 'object') {
      return `media[${i}] is invalid`;
    }
    const mediaType = (m as any).media_type;
    if (mediaType === 'gif') {
      if (!isAllowedGifCdnUrl((m as any).url)) {
        return `media[${i}]: gif url must be a Klipy (or Giphy) CDN https URL`;
      }
    }
  }
  return null;
}
