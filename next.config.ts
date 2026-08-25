import type { NextConfig } from "next";
import { getSecurityHeadersConfig } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "http", hostname: "localhost", port: "3000", pathname: "/**" },
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
    ],
    localPatterns: [
      { pathname: "/placeholders/**" },
      { pathname: "/uploads/**" },
    ],
    // Always unoptimized for local dev — avoids domain allow-list issues for /uploads
    unoptimized: true,
  },
  async headers() {
    return getSecurityHeadersConfig();
  },
};

export default nextConfig;
