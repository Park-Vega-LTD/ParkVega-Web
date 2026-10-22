import type { MetadataRoute } from "next";

// Production base URL used for the sitemap reference.
const BASE_URL = "https://parkvega.com";

/**
 * Generate robots rules (Requirement 5.4). Disallow crawling of the admin,
 * staff, and API path prefixes while allowing every other route, and point
 * crawlers at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/staff", "/api"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
