import type { ImageLoaderProps } from "next/image";

const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/(?:[^/]+\/)*?)(v\d+\/.+)$/;

/** Whether a URL is a Cloudinary delivery URL that Cloudinary can resize itself. */
export function isCloudinaryUrl(src: string): boolean {
  return CLOUDINARY.test(src);
}

/**
 * next/image loader for Cloudinary photos: Cloudinary resizes and converts
 * them (AVIF/WebP) at its CDN, so the browser downloads them directly instead
 * of waiting for this server to fetch and re-encode them. The size step is
 * added after any transformation already in the URL (e.g. a video frame).
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const match = src.match(CLOUDINARY);
  if (!match) return src;
  return `${match[1]}f_auto,q_${quality ?? "auto"},c_limit,w_${width}/${match[2]}`;
}
