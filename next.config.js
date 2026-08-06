/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@tanstack/react-query'],
  },
}

module.exports = nextConfig