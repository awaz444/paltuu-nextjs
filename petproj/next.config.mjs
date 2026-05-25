/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  images: {
    domains: [
      "res.cloudinary.com",                          // ← keep: existing Cloudinary images
      "lh3.googleusercontent.com",
      "media.istockphoto.com",
      "qufdjlaxzyarnrsiimfw.supabase.co",
      "lfiwvlicdkdheqynvjxb.supabase.co",
      "fjxezewxjsyyfuehnlko.supabase.co",
      "images.unsplash.com",
      "djw7hbeqkm7bf.cloudfront.net",
      "paltuu-main.s3.ap-south-1.amazonaws.com",     // ← new: paltuu-main S3 direct URLs
    ],
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

