/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      unoptimized: true,
      domains: ['localhost', 'snapsmirror.com'],
    },
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    },
    swcMinify: true,
    compress: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
  };
  
  module.exports = nextConfig;