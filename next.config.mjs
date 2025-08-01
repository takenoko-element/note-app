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
    ],
  },
};

export default nextConfig;
