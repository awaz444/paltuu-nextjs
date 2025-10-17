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
  dogFood: [234, 63, 82, 61, 247, 251, 244, 62, 241, 242] as number[],

  // Accessories & Grooming section - manually selected accessories
  accessoriesGrooming: [321, 320, 315, 191, 309, 180, 184,66] as number[],

  // Housing section - manually selected housing products
  housing: [310, 311, 313, 312, 314, 319, 318, 308] as number[],
};

/**
 * Helper function to get featured product IDs for a section
 */
export function getFeaturedProductIds(sectionKey: keyof typeof featuredProducts): number[] | null {
  const ids = featuredProducts[sectionKey];
  return ids && ids.length > 0 ? ids : null;
}
