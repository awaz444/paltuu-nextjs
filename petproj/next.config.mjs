/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  images: {
    // remotePatterns replaces the deprecated `domains` field (Next.js 13+).
    // This is required for the image optimization pipeline (WebP conversion,
    // resizing, caching) to work for external hosts.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
      { protocol: "https", hostname: "lh6.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "media.istockphoto.com" },
      { protocol: "https", hostname: "qufdjlaxzyarnrsiimfw.supabase.co" },
      { protocol: "https", hostname: "lfiwvlicdkdheqynvjxb.supabase.co" },
      { protocol: "https", hostname: "fjxezewxjsyyfuehnlko.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "djw7hbeqkm7bf.cloudfront.net" },
      { protocol: "https", hostname: "paltuu-main.s3.ap-south-1.amazonaws.com" },
    ],
    // Serve smaller srcset steps for thumbnail grids (128px, 200px, 400px)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 200, 256, 384, 400],
  },

  async redirects() {
    // paltuu.org is the international site: only Home and Adopt (lib/site.ts).
    // Everything Pakistan-only sends .org visitors to /home. Temporary, so pages
    // can open up there one at a time.
    const org = [{ type: 'host', value: '(?:www\\.)?paltuu\\.org' }];
    const pkOnlyPaths = [
      '/', '/pet-care', '/pet-care/:path*', '/blogs', '/blogs/:path*', '/llm',
      '/bazaar', '/bazaar/:path*', '/marketplace', '/marketplace/:path*', '/shops', '/shops/:path*',
      '/karachi', '/lahore', '/islamabad', '/lost-found',
    ];
    return [
      ...pkOnlyPaths.map((source) => ({ source, has: org, destination: '/home', permanent: false })),
      // Community launched under /community, then moved to the top level the same day.
      // Lost & Found is hidden for now (PALTU-110). Temporary, so it can come back.
      { source: '/lost-and-found', destination: '/browse-pets', permanent: false },
      { source: '/lost-and-found/:path*', destination: '/browse-pets', permanent: false },
      { source: '/lost-and-found-create-listing', destination: '/browse-pets', permanent: false },
      { source: '/lost-and-found-images', destination: '/browse-pets', permanent: false },
      { source: '/listing-created-lost-and-found', destination: '/browse-pets', permanent: false },
      // Shelters are hidden from the public for now: /adopt is the one place to
      // find a pet. Temporary, so the pages can come back when shelters work.
      { source: '/shelters', destination: '/adopt', permanent: false },
      { source: '/shelters/:path*', destination: '/adopt', permanent: false },
      { source: '/rescue-pets', destination: '/adopt', permanent: false },
      { source: '/rescue-pets/:path*', destination: '/adopt', permanent: false },
      { source: '/rescue-profile/:path*', destination: '/adopt', permanent: false },
      { source: '/community', destination: '/home', permanent: true },
      { source: '/feed', destination: '/home', permanent: true },
      { source: '/community/p/:post', destination: '/p/:post', permanent: true },
      { source: '/community/:species/:breed', destination: '/:species/:breed', permanent: true },
      { source: '/community/:species', destination: '/:species', permanent: true },
      {
        // This URL was live while the file and its frontmatter slug disagreed.
        // Preserve any equity it picked up now that the post lives at the
        // slug its canonical always pointed to.
        source: '/blogs/what-should-i-feed-my-cat-pakistan-complete-guide',
        destination: '/blogs/what-should-i-feed-my-cat-pakistan',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // Optimized CORS for Mobile and Web
          { key: 'Access-Control-Allow-Origin', value: '*' }, 
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Max-Age', value: '86400' }, // 24 hours preflight cache
        ],
      },
      {
        source: '/(.*)',
        headers: [
          // Security Headers
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          // geolocation=(self): /pet-care "Near me" needs it. `()` disabled it
          // for our own pages too, so every getCurrentPosition() failed with
          // PERMISSION_DENIED regardless of what the visitor chose.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;

