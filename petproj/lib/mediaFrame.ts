/**
 * Feed media frames follow the media's own shape, the way Threads and X do
 * (PALTU-159): a frame takes the photo/video's aspect ratio, kept between 4:5
 * (tall) and 16:9 (wide), and the media fills it. Only media outside that
 * range is cropped, and nothing is ever letterboxed. The app mirrors these
 * numbers in src/utils/mediaFrame.ts.
 */
export const FEED_MIN_RATIO = 4 / 5;
export const FEED_MAX_RATIO = 16 / 9;

/** Width ÷ height of the frame to draw for this media, or null when its size isn't known. */
export function feedFrameRatio(width?: number | null, height?: number | null): number | null {
    if (!width || !height || width <= 0 || height <= 0) return null;
    return Math.min(FEED_MAX_RATIO, Math.max(FEED_MIN_RATIO, width / height));
}
