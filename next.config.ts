import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/v1/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/backend/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: "/backend/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
