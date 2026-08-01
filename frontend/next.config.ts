import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // Faster package imports via barrel file optimization (tree-shaking)
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  // Fix: Next.js detects the root package-lock.json from Laravel — pin it to the frontend dir
  turbopack: {
    root: __dirname,
  },

  // Disable leaking server info header
  poweredByHeader: false,

  // Compress responses
  compress: true,
};

export default nextConfig;
