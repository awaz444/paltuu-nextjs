/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
      "media.istockphoto.com",
      "qufdjlaxzyarnrsiimfw.supabase.co",
      "lfiwvlicdkdheqynvjxb.supabase.co",
      // add more supabase project URLs as needed
    ],
  },
};

export default nextConfig;

