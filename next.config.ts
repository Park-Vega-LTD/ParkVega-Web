import type { NextConfig } from "next";

// Build-time environment guard: fail fast if the public API base URL is missing.
// NEXT_PUBLIC_API_URL is required for every API call (client + server). Without
// it the build cannot produce a working application, so we throw immediately.
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Define it in your environment (e.g. .env.local) before building or running the app.",
  );
}

const nextConfig: NextConfig = {
  // NOTE: `cacheComponents` (Next.js 16 Cache Components) is intentionally not
  // enabled. It is incompatible with the `export const revalidate = 60` route
  // segment config that every public page uses to implement ISR (Requirement
  // 4.1). The spec's ISR model relies on `revalidate` + per-fetch
  // `{ next: { revalidate: 60 } }`, so Cache Components is left off.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Serve AVIF/WebP automatically from the original JPG/PNG uploads (brief §2).
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.parkvega.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 3600,
  },
};

export default nextConfig;
