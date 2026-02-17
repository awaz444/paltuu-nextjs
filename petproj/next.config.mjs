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
};

export default nextConfig;

