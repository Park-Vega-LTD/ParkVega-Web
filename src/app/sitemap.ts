import type { MetadataRoute } from "next";

import { publicFetch } from "@/lib/api.server";
import { isBlogPost, isPublished } from "@/lib/blog";
import type { Attraction, ContentPage } from "@/types/api";

// Production base URL used for the absolute sitemap entries.
const BASE_URL = "https://parkvega.com";


// ISR fetch options matching the public pages (Requirement 4.1).
const fetchOpts = { next: { revalidate: 60 } } as const;

// All static public routes that should always appear in the sitemap.
const STATIC_ROUTES = [
  "/",
  "/attractions",
  "/plan-your-visit",
  "/birthday-parties",
  "/school-excursions",
  "/directions-from-benin-asaba-warri-onitsha",
  "/tickets",
  "/restaurants",
  "/events",
  "/services",
  "/blog",
] as const;

/**
 * Generate the sitemap (Requirement 5.3). Combines the static public routes
 * with dynamic `/attractions/[id]` and `/blog/[slug]` URLs fetched from the
 * REST API. If the REST API is unavailable, the dynamic data degrades to an
 * empty list so the sitemap still contains every static route and the build
 * never crashes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route === "/" ? "" : route}`,
    lastModified: now,
  }));

  // Active attraction detail pages.
  const attractions = await publicFetch<Attraction[]>(
    "/attractions",
    fetchOpts,
  ).catch(() => [] as Attraction[]);

  const attractionEntries: MetadataRoute.Sitemap = attractions
    .filter((attraction) => attraction.status === "ACTIVE")
    .map((attraction) => ({
      url: `${BASE_URL}/attractions/${attraction.id}`,
      lastModified: now,
    }));

  // Blog post pages (CMS content, excluding structural pages).
  const pages = await publicFetch<ContentPage[]>(
    "/content/pages",
    fetchOpts,
  ).catch(() => [] as ContentPage[]);

  const blogEntries: MetadataRoute.Sitemap = pages
    .filter((page) => isBlogPost(page) && isPublished(page))
    .map((page) => ({
      url: `${BASE_URL}/blog/${page.slug}`,
      lastModified: new Date(page.updated_at),
    }));

  return [...staticEntries, ...attractionEntries, ...blogEntries];
}
