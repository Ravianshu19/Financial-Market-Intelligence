import type { NextConfig } from "next";

const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const backendUrl = rawUrl.endsWith("/api") 
  ? rawUrl.slice(0, -4) 
  : rawUrl.endsWith("/") 
    ? rawUrl.slice(0, -1) 
    : rawUrl;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
