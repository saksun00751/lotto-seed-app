/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/:locale/bet/:draw_id(\\d+)/:round_id(\\d+)/:package_id(\\d+)",
        destination: "/:locale/bet?draw_id=:draw_id&package_id=:package_id&round_id=:round_id",
      },
      {
        source: "/:locale/bet/:draw_id(\\d+)/:package_id(\\d+)",
        destination: "/:locale/bet?draw_id=:draw_id&package_id=:package_id",
      },
      {
        source: "/:locale/bet/:draw_id(\\d+)",
        destination: "/:locale/bet?draw_id=:draw_id",
      },
    ];
  },
};
module.exports = nextConfig
