/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  images: {
    domains: [
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
      "media.istockphoto.com",
      "qufdjlaxzyarnrsiimfw.supabase.co",
      "lfiwvlicdkdheqynvjxb.supabase.co",
      "fjxezewxjsyyfuehnlko.supabase.co",
      "images.unsplash.com",
      // add more supabase project URLs as needed
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Acceptable for React Native/Expo. Replace with 'https://www.paltuu.pk' if strict CORS is needed.
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;

