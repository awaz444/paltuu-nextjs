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
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;

