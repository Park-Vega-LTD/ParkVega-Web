import type { MenuItem, MenuItemBadge } from "@/types/api";

/** How each printed label reads on the menu. */
export const BADGE_LABELS: Record<MenuItemBadge, string> = {
  KIDS_SPECIAL: "Kids' special",
  BIG_APPETITE: "Big appetite",
  FAMILY_FAVOURITE: "Family favourite",
};

/**
 * The menu seed writes "Includes: Shawarma, Soda." as a combo's description
 * when staff haven't written one. The menu lists the contents itself, so
 * that description would repeat them.
 */
export function menuDescription(item: Pick<MenuItem, "description" | "includes">): string | null {
  if (!item.description) return null;
  if (item.includes.length > 0 && item.description === `Includes: ${item.includes.join(", ")}.`) {
    return null;
  }
  return item.description;
}

/** Local photos under public/, or hosts next.config's images.remotePatterns allows; anything else is skipped. */
export function isMenuPhoto(url: string | null): url is string {
  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      (hostname === "res.cloudinary.com" || hostname === "parkvega.com" || hostname.endsWith(".parkvega.com"))
    );
  } catch {
    return false;
  }
}
