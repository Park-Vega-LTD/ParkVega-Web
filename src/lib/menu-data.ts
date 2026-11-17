import menuFile from "@/data/menu.json";
import { publicFetch } from "@/lib/api.server";
import { publicFetchOpts } from "@/lib/public-data";
import type { MenuItem, Restaurant } from "@/types/api";

export type RestaurantWithMenu = Restaurant & { menu: MenuItem[] };

/** The copy in src/data/menu.json, shown only when the API can't supply a menu. */
function fileMenus(): RestaurantWithMenu[] {
  return (menuFile.restaurants as RestaurantWithMenu[]).filter((restaurant) => restaurant.active);
}

/**
 * Active restaurants with their menus, from the API (`/restaurants` and
 * `/restaurants/:id/menu`). Food orders send these dish and restaurant ids
 * back to the API, which only accepts ids from its own database, so the menu
 * must come from there for ordering to work.
 *
 * If the API is unreachable or has no active restaurant yet, the page falls
 * back to src/data/menu.json so it still shows the menu, but orders placed
 * from that copy are rejected. Load the database with
 * `npm run seed:menu -- --yes` in park-vega-services.
 */
export async function getRestaurantMenus(): Promise<RestaurantWithMenu[]> {
  try {
    const restaurants = (await publicFetch<Restaurant[]>("/restaurants", publicFetchOpts)).filter(
      (restaurant) => restaurant.active,
    );
    if (restaurants.length === 0) return fileMenus();
    const menus = await Promise.all(
      restaurants.map((restaurant) =>
        publicFetch<MenuItem[]>(`/restaurants/${restaurant.id}/menu`, publicFetchOpts),
      ),
    );
    return restaurants.map((restaurant, index) => ({ ...restaurant, menu: menus[index] }));
  } catch {
    return fileMenus();
  }
}
