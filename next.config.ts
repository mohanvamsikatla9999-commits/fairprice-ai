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
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
    localPatterns: [
      { pathname: "/placeholders/**" },
      { pathname: "/uploads/**" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
  async headers() {
    return getSecurityHeadersConfig();
  },
};

export default nextConfig;
