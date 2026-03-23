/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'service.1168lot.com',
      },
    ],
  },
}
module.exports = nextConfig
