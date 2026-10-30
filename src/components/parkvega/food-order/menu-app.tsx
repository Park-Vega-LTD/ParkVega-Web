"use client";

import {
  Baby,
  Beef,
  CheckCircle2,
  CupSoda,
  Drumstick,
  Flame,
  Hamburger,
  Heart,
  IceCreamCone,
  Pizza,
  Plus,
  Popcorn,
  Salad,
  Sandwich,
  Search,
  ShoppingBag,
  Soup,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { createElement, useEffect, useMemo, useRef, useState } from "react";

import { cart, cartCount, cartTotal, openFoodOrder, useCart } from "@/components/parkvega/food-order/cart-store";
import { QuantityStepper } from "@/components/parkvega/food-order/quantity-stepper";
import { BADGE_LABELS, isMenuPhoto, menuDescription } from "@/lib/menu";
import { cn, formatNaira } from "@/lib/utils";
import type { MenuItem, MenuItemBadge, Restaurant } from "@/types/api";

export type RestaurantMenu = { restaurant: Restaurant; items: MenuItem[] };

const BADGE_ICONS: Record<MenuItemBadge, LucideIcon> = {
  KIDS_SPECIAL: Baby,
  BIG_APPETITE: Beef,
  FAMILY_FAVOURITE: Heart,
};

/** Category names are staff-written, so match on keywords. First match wins. */
const CATEGORY_ICONS: [RegExp, LucideIcon][] = [
  [/burger/i, Hamburger],
  [/pizza/i, Pizza],
  [/hot ?dog|wrap|shawarma|sandwich/i, Sandwich],
  [/protein|chicken|wing|grill|meat|fish/i, Drumstick],
  [/rice|jollof|soup|pasta|noodle/i, Soup],
  [/drink|juice|smoothie|soda|bar/i, CupSoda],
  [/snack|chips|popcorn|small chops/i, Popcorn],
  [/dessert|ice cream|sweet/i, IceCreamCone],
  [/salad|veg/i, Salad],
];

/** Soft backgrounds for dishes without a photo, cycled by category. */
const PLACEHOLDER_TONES = [
  "from-orange-100 to-amber-50 text-orange-600",
  "from-sky-100 to-cyan-50 text-sky-600",
  "from-lime-100 to-emerald-50 text-lime-700",
  "from-amber-100 to-yellow-50 text-amber-600",
  "from-rose-100 to-orange-50 text-rose-600",
];

const POPULAR = "Popular";

function categoryIcon(category: string) {
  return CATEGORY_ICONS.find(([pattern]) => pattern.test(category))?.[1] ?? UtensilsCrossed;
}

/** Section icon; "Popular" gets the flame. */
function CategoryIcon({ category, className, strokeWidth }: { category: string; className?: string; strokeWidth?: number }) {
  return createElement(category === POPULAR ? Flame : categoryIcon(category), { className, strokeWidth, "aria-hidden": true });
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function matches(item: MenuItem, query: string) {
  const haystack = [item.name, item.description ?? "", item.category, ...(item.includes ?? [])].join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/**
 * The food ordering app on /restaurants. Restaurants and their menus come from
 * the API (fetched by the page); this island owns search, the category
 * jump-bar, the dish cards and the desktop order panel. Checkout itself stays
 * in FoodOrderSheet, which this opens through `openFoodOrder()`.
 */
export function MenuApp({ menus }: { menus: RestaurantMenu[] }) {
  const [restaurantId, setRestaurantId] = useState(menus[0]?.restaurant.id);
  const [query, setQuery] = useState("");
  const current = menus.find((menu) => menu.restaurant.id === restaurantId) ?? menus[0];
  const items = useMemo(() => current?.items ?? [], [current]);

  const sections = useMemo(() => {
    const categories = Array.from(new Set(items.map((item) => item.category)));
    const popular = items.filter((item) => item.popular && item.active);
    const grouped = categories.map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }));
    return popular.length >= 2 ? [{ category: POPULAR, items: popular }, ...grouped] : grouped;
  }, [items]);

  const results = query.trim() ? items.filter((item) => matches(item, query)) : null;
  const tones = useMemo(
    () => new Map(sections.filter((s) => s.category !== POPULAR).map((s, i) => [s.category, PLACEHOLDER_TONES[i % PLACEHOLDER_TONES.length]])),
    [sections],
  );

  const [activeCategory, setActiveCategory] = useState(sections[0]?.category);
  const chipsRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Highlight the chip for the last section whose heading has scrolled up to the toolbar.
  const searching = results !== null;
  useEffect(() => {
    if (searching) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = (toolbarRef.current?.getBoundingClientRect().bottom ?? 0) + 32;
        let current: string | null = null;
        document.querySelectorAll<HTMLElement>("[data-category]").forEach((section) => {
          if (section.getBoundingClientRect().top <= line) current = section.dataset.category ?? null;
        });
        setActiveCategory(current ?? sections[0]?.category);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, [sections, searching]);

  // Keep the active chip in view as the menu scrolls.
  useEffect(() => {
    const row = chipsRef.current;
    const chip = activeCategory ? row?.querySelector<HTMLElement>(`[data-chip="${slug(activeCategory)}"]`) : null;
    // Scroll the chip row only (scrollIntoView would also move the page), and
    // instantly: a smooth scroll here cancels the page's smooth scroll in Chrome.
    if (row && chip) row.scrollLeft = chip.offsetLeft - row.offsetLeft - (row.clientWidth - chip.clientWidth) / 2;
  }, [activeCategory]);

  function jumpTo(category: string) {
    setQuery("");
    setActiveCategory(category);
    // Land the heading just under the sticky toolbar, whose height differs on phones.
    requestAnimationFrame(() => {
      const section = document.getElementById(`menu-${slug(category)}`);
      if (!section) return;
      const toolbarBottom = toolbarRef.current?.getBoundingClientRect().bottom ?? 0;
      window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - toolbarBottom - 16, behavior: "smooth" });
    });
  }

  if (!current) return null;

  return (
    <section id="menu" className="bg-ocean-soft/60 pb-20">
      {/* Toolbar: restaurant switcher, search and category jump-bar. */}
      <div ref={toolbarRef} className="sticky top-[73px] z-30 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {menus.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pt-3" role="tablist" aria-label="Restaurants">
              {menus.map(({ restaurant }) => (
                <button
                  key={restaurant.id}
                  type="button"
                  role="tab"
                  aria-selected={restaurant.id === current.restaurant.id}
                  onClick={() => { setRestaurantId(restaurant.id); setQuery(""); }}
                  className={cn(
                    "shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors",
                    restaurant.id === current.restaurant.id ? "bg-deep text-hero-foreground" : "bg-muted text-foreground hover:bg-muted/70",
                  )}
                >
                  {restaurant.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2.5 py-2.5 md:flex-row md:items-center md:gap-3 md:py-3">
            <label className="relative block md:w-72 md:shrink-0">
              <span className="sr-only">Search the menu</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search jollof, pizza, drinks…"
                className="h-11 w-full rounded-full border border-input bg-card pl-10 pr-10 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full hover:bg-muted">
                  <X className="size-4" />
                </button>
              )}
            </label>
            <div ref={chipsRef} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 md:pb-0" aria-label="Menu sections">
              {sections.map(({ category }) => {
                const active = !results && activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    data-chip={slug(category)}
                    onClick={() => jumpTo(category)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-colors",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40",
                    )}
                  >
                    <CategoryIcon category={category} className="size-4" />
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {items.length === 0 ? (
            <EmptyState title="The menu will be posted soon." text="Our kitchen is updating today's dishes. Check back shortly." />
          ) : results ? (
            <div>
              <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
                {results.length === 0 ? "No dishes match" : `${results.length} dish${results.length === 1 ? "" : "es"} match`} &ldquo;{query.trim()}&rdquo;
              </p>
              {results.length === 0 ? (
                <EmptyState title="Nothing found." text="Try another word, like rice, chicken or drink." />
              ) : (
                <DishGrid items={results} restaurantId={current.restaurant.id} tones={tones} />
              )}
            </div>
          ) : (
            <div className="grid gap-12">
              {sections.map(({ category, items: sectionItems }) => {
                return (
                  <section key={category} id={`menu-${slug(category)}`} data-category={category}>
                    <h2 className="flex items-center gap-2.5 text-2xl font-bold">
                      <span className={cn("grid size-9 place-items-center rounded-xl", category === POPULAR ? "bg-accent text-accent-foreground" : "bg-card text-primary-ink shadow-sm")}>
                        <CategoryIcon category={category} className="size-5" />
                      </span>
                      {category === POPULAR ? "Popular right now" : category}
                      <span className="text-sm font-semibold text-muted-foreground">{sectionItems.length}</span>
                    </h2>
                    <div className="mt-4">
                      <DishGrid items={sectionItems} restaurantId={current.restaurant.id} tones={tones} />
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
        <OrderPanel />
      </div>
    </section>
  );
}

function DishGrid({ items, restaurantId, tones }: { items: MenuItem[]; restaurantId: string; tones: Map<string, string> }) {
  const { lines } = useCart();
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="flex">
          <DishCard
            item={item}
            restaurantId={restaurantId}
            quantity={lines.find((line) => line.menuItemId === item.id)?.quantity ?? 0}
            tone={tones.get(item.category) ?? PLACEHOLDER_TONES[0]}
          />
        </li>
      ))}
    </ul>
  );
}

function DishCard({ item, restaurantId, quantity, tone }: { item: MenuItem; restaurantId: string; quantity: number; tone: string }) {
  const lineItem = { menuItemId: item.id, restaurantId, name: item.name, price: item.price };
  const description = menuDescription(item);
  const includes = item.includes ?? [];
  const badges = item.badges ?? [];
  const soldOut = !item.active;

  return (
    <article
      className={cn(
        "flex w-full overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow sm:flex-col",
        quantity > 0 ? "border-primary/50 ring-2 ring-primary/20" : "border-border hover:shadow-md",
      )}
    >
      {/* Phones: compact row with a square photo on the left. sm+: photo on top. */}
      <div className="relative w-28 shrink-0 self-stretch overflow-hidden bg-muted sm:aspect-[16/10] sm:w-auto sm:self-auto">
        {isMenuPhoto(item.image_url) ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 112px, (max-width: 1280px) 33vw, 280px"
            className={cn("object-cover", soldOut && "grayscale")}
          />
        ) : (
          <div className={cn("grid h-full place-items-center bg-gradient-to-br", tone, soldOut && "grayscale")} aria-hidden="true">
            <CategoryIcon category={item.category} className="size-10 opacity-80 sm:size-14" strokeWidth={1.5} />
          </div>
        )}
        {item.popular && !soldOut && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground shadow-sm sm:left-3 sm:top-3 sm:px-2.5 sm:py-1">
            <Flame className="size-3" aria-hidden="true" /> Popular
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-deep/45">
            <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-foreground sm:px-4 sm:py-1.5 sm:text-xs">Sold out<span className="hidden sm:inline"> today</span></span>
          </div>
        )}
        {quantity > 0 && (
          <span className="absolute right-3 top-3 hidden sm:inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm">
            <CheckCircle2 className="size-3.5" aria-hidden="true" /> {quantity} in order
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="text-base font-bold leading-snug">{item.name}</h3>
        {badges.length > 0 && (
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {badges.map((badge) => {
              const BadgeIcon = BADGE_ICONS[badge];
              return (
                <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-ocean-soft px-2 py-0.5 text-[11px] font-bold text-primary-ink">
                  {BadgeIcon && <BadgeIcon className="size-3" aria-hidden="true" />}
                  {BADGE_LABELS[badge] ?? badge}
                </span>
              );
            })}
          </p>
        )}
        {description && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{description}</p>}
        {includes.length > 0 && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground sm:line-clamp-none">
            <span className="font-semibold text-foreground">Comes with: </span>
            {includes.join(" · ")}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:gap-3 sm:pt-4">
          <p className={cn("font-display text-lg font-bold sm:text-xl", soldOut ? "text-muted-foreground line-through" : "text-primary-ink")}>{formatNaira(item.price)}</p>
          {soldOut ? null : quantity > 0 ? (
            <QuantityStepper name={item.name} quantity={quantity} onChange={(next) => cart.setQuantity(lineItem, next)} />
          ) : (
            <button
              type="button"
              onClick={() => cart.setQuantity(lineItem, 1)}
              aria-label={`Add ${item.name} to order`}
              className="inline-flex min-h-11 items-center gap-1 rounded-full bg-secondary px-4 text-sm sm:px-5 font-bold text-secondary-foreground transition-colors hover:bg-secondary-hover"
            >
              <Plus className="size-4" aria-hidden="true" /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/** Desktop order summary beside the menu; phones use FoodOrderSheet's floating bar. */
function OrderPanel() {
  const { lines, lastOrder } = useCart();
  const count = cartCount(lines);
  const total = cartTotal(lines);

  return (
    <aside className="hidden lg:block" aria-label="Your order">
      <div className="sticky top-[180px] rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ShoppingBag className="size-5 text-primary-ink" aria-hidden="true" /> Your order
          {count > 0 && <span className="ml-auto rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">{count}</span>}
        </h2>
        {count === 0 ? (
          <div className="py-8 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-ocean-soft text-primary-ink">
              <UtensilsCrossed className="size-6" aria-hidden="true" />
            </span>
            <p className="mt-3 font-semibold">Your tray is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Add dishes and drinks, then pick them up at the counter.</p>
            {lastOrder && (
              <button type="button" onClick={openFoodOrder} className="mt-4 text-sm font-bold text-primary-ink underline-offset-4 hover:underline">
                View order {lastOrder.code}
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className="mt-3 max-h-[45vh] divide-y divide-border overflow-y-auto">
              {lines.map((line) => (
                <li key={line.menuItemId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{line.name}</p>
                    <p className="text-xs text-muted-foreground">{formatNaira(line.price * line.quantity)}</p>
                  </div>
                  <QuantityStepper name={line.name} quantity={line.quantity} onChange={(next) => cart.setQuantity(line, next)} />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-baseline justify-between border-t border-border pt-4">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-bold">{formatNaira(total)}</span>
            </div>
            <button
              type="button"
              onClick={openFoodOrder}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-base font-bold text-secondary-foreground transition-colors hover:bg-secondary-hover"
            >
              Checkout · {formatNaira(total)}
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Pay online, collect at the counter.</p>
          </>
        )}
      </div>
    </aside>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <UtensilsCrossed className="mx-auto size-9 text-primary-ink" aria-hidden="true" />
      <p className="mt-4 text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
