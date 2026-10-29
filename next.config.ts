import type { NextConfig } from "next";

// Build-time environment guard: fail fast if the API base URL is missing.
// Every API call goes through server code (src/lib/api-url.ts), which reads
// the server-only PARK_VEGA_API_URL, or NEXT_PUBLIC_API_URL for older
// environments. Without one the app cannot work, so we throw immediately.
if (!process.env.PARK_VEGA_API_URL && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "PARK_VEGA_API_URL is not set. Define it in your environment (e.g. .env.local) before building or running the app.",
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
        hostname: "parkvega.com",
        pathname: "/**",
      },
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
  async redirects() {
    // Staff tools moved to the parkvega-admin app; keep old bookmarks working.
    const adminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.parkvega.com").replace(/\/$/, "");
    return [
      { source: "/admin/:path*", destination: `${adminUrl}/admin/:path*`, permanent: false },
      { source: "/staff/:path*", destination: `${adminUrl}/staff/:path*`, permanent: false },
    ];
  },
};

export default nextConfig;
