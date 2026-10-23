import type { NextConfig } from "next";

const apiUrl = (process.env.API_URL || "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: "/recipes", destination: "/protocols", permanent: true },
      { source: "/recipes/:path*", destination: "/protocols/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
