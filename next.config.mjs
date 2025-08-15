/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Googleアカウントでのログインも考慮して残しておく
      },
      // .env.local用supabase設定
      {
        protocol: 'https',
        hostname: 'ybzztnikfywyxuymzlms.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
      // .env.test用supabase設定
      {
        protocol: 'https',
        hostname: 'vfcihxlbeijrsiasaggy.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
