"use client";

import { Flame, Plus } from "lucide-react";
import { useState } from "react";

import { cart, useCart } from "@/components/parkvega/food-order/cart-store";
import { QuantityStepper } from "@/components/parkvega/food-order/quantity-stepper";
import { cn, formatNaira } from "@/lib/utils";
import type { MenuItem } from "@/types/api";

/**
 * Client island for the food menu section.
 *
 * Menu items are fetched in a parent Server Component and passed in via props
 * (matching the props-based data convention used by the other migrated
 * parkvega sections). The category tab selection and the order quantities
 * are interactive, so this island owns them while the rest of the page can
 * stay a Server Component. Items staff switch off (`active: false`) show as
 * "Sold out" and cannot be ordered.
 */
export function FoodMenu({ restaurantId, items = [] }: { restaurantId: string; items?: MenuItem[] }) {
  const cats = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? cats.slice(1) : [cat];
  const { lines } = useCart();
  const quantityOf = (id: string) => lines.find((line) => line.menuItemId === id)?.quantity ?? 0;

  return (
    <section className="bg-ocean-soft px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <span className="text-xs font-extrabold uppercase text-primary-ink">Order for pickup</span>
        <h2 className="mt-3 text-balance text-3xl font-semibold sm:text-4xl">
          What&apos;s cooking today.
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Add items to your order, then pick them up in person at the counter. Prices in Naira.
        </p>
        <div
          className="mt-6 flex gap-2 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Menu categories"
        >
          {cats.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-bold ${
                cat === c ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <p className="mt-8 text-muted-foreground">The menu will be posted soon.</p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {shown.map((c) => (
              <div key={c} className="rounded-3xl bg-card p-5 shadow-sm sm:p-6">
                <h3 className="text-xl font-semibold text-secondary-foreground">{c}</h3>
                <ul className="mt-3 divide-y divide-border">
                  {items
                    .filter((i) => i.category === c)
                    .map((i) => {
                      const quantity = quantityOf(i.id);
                      const lineItem = { menuItemId: i.id, restaurantId, name: i.name, price: i.price };
                      return (
                        <li key={i.id} className={cn("flex items-center justify-between gap-4 py-3", !i.active && "opacity-60")}>
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {i.name}
                              {i.popular && i.active && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                                  <Flame className="size-3" />
                                  Popular
                                </span>
                              )}
                            </p>
                            {i.description && (
                              <p className="text-xs text-muted-foreground">{i.description}</p>
                            )}
                            <p className="mt-1 font-bold text-primary-ink">{formatNaira(i.price)}</p>
                          </div>
                          {!i.active ? (
                            <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                              Sold out
                            </span>
                          ) : quantity > 0 ? (
                            <QuantityStepper
                              name={i.name}
                              quantity={quantity}
                              onChange={(next) => cart.setQuantity(lineItem, next)}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => cart.setQuantity(lineItem, 1)}
                              aria-label={`Add ${i.name} to order`}
                              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-secondary px-4 text-sm font-bold text-secondary-foreground hover:bg-secondary-hover"
                            >
                              <Plus className="size-4" /> Add
                            </button>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
