import type { NextConfig } from "next";

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/issue-sheet",
        destination: "/smoke-sheet",
        permanent: true,
      },
      {
        source: "/test-execution",
        destination: "/test-cycle",
        permanent: true,
      },
      {
        source: "/analytics",
        destination: "/analytics-performance",
        permanent: true,
      },
    ];
  },
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
