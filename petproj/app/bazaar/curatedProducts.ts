/**
 * CURATED PRODUCTS CONFIGURATION
 *
 * Edit the product IDs below to control which products appear in each section
 * on the bazaar landing page. Products will be displayed in the order listed.
 *
 * To add products:
 * 1. Find the product_id from your database
 * 2. Add it to the appropriate array
 * 3. Save this file - changes will reflect immediately
 *
 * Note: If the array is empty or products don't exist, the section will fall back
 * to automatic filtering based on categories.
 */

// Featured product IDs from database range 20-100
export const featuredProducts = {
  // Trending section - manually selected trending products
  trending: [25, 32, 41, 56, 63, 78, 84, 91] as number[],

  // Most Discounted section - leave empty for automatic discount calculation
  discount: [] as number[], // Keep empty for automatic discount calculation

  // Cat Food section - manually selected cat food products
  catFood: [25, 78, 38, 73, 210, 146, 43, 18, 123] as number[],

  // Dog Food section - manually selected dog food products
  dogFood: [63, 82, 61, 247] as number[],

  // Accessories & Grooming section - manually selected accessories
  accessoriesGrooming: [191, 184, 175, 169, 173, 66, 168, 180] as number[],

  // Healthcare section - manually selected healthcare products
  healthcare: [202, 186, 164, 152, 193, 125, 37, 25, 136] as number[],
};

/**
 * Helper function to get featured product IDs for a section
 */
export function getFeaturedProductIds(sectionKey: keyof typeof featuredProducts): number[] | null {
  const ids = featuredProducts[sectionKey];
  return ids && ids.length > 0 ? ids : null;
}
