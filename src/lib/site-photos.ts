import photoMap from "@/data/cloudinary-photos.json";

/**
 * The site's built-in photos, hosted on Cloudinary. Keys are the old
 * `public/` paths the photos were uploaded from, so call sites stay readable.
 * Safe to import from client components.
 */
export type SitePhotoPath = keyof typeof photoMap;

/** Absolute Cloudinary URL of a built-in site photo. */
export function sitePhoto(path: SitePhotoPath): string {
  return photoMap[path].url;
}

/** A photo and its alt text, as shown in a page-image spot. */
export interface Photo {
  src: string;
  alt: string;
}

/** Shown for attractions without their own photo until staff pick one. */
export const ATTRACTION_FALLBACK_IMAGE = sitePhoto("/photos/aqua-tower-aerial.jpg");
