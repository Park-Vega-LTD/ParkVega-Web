import menuFile from "@/data/menu.json";
import type { MenuItem, Restaurant } from "@/types/api";

export type RestaurantWithMenu = Restaurant & { menu: MenuItem[] };

/**
 * The food menu, read from src/data/menu.json while the REST API isn't
 * deployed. Edit that file to change dishes, prices, photos (served from
 * public/restaurant/menu/) or availability (`active: false` shows "Sold out").
 * Changes go live on the next build.
 *
 * Callers only see this function, so switching back to the API means
 * replacing its body with the `/restaurants` and `/restaurants/:id/menu` fetches.
 */
export async function getRestaurantMenus(): Promise<RestaurantWithMenu[]> {
  return (menuFile.restaurants as RestaurantWithMenu[]).filter((restaurant) => restaurant.active);
}
