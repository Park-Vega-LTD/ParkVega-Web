"use client";

import { useSyncExternalStore } from "react";

/**
 * Food pre-order cart, kept in localStorage so it survives navigation and a
 * round-trip to the payment page. Implemented as a tiny external store read
 * through `useSyncExternalStore`, so the server render always sees an empty
 * cart and there is no hydration mismatch.
 */

export type CartLine = {
  menuItemId: string;
  restaurantId: string;
  name: string;
  price: number;
  quantity: number;
};

export type PlacedOrder = {
  code: string;
  total: number;
  pickupDate: string;
  pickupTime: string;
  lines: CartLine[];
  payAtPickup: boolean;
  customerId?: string | null;
};

type CartState = { lines: CartLine[]; lastOrder: PlacedOrder | null };

const KEY = "pv-food-cart";
const EMPTY: CartState = { lines: [], lastOrder: null };
/** Most guests order a handful of items; this stops accidental huge orders. */
export const MAX_QUANTITY = 20;

let state: CartState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as CartState | null;
    if (saved && Array.isArray(saved.lines)) state = { lines: saved.lines, lastOrder: saved.lastOrder ?? null };
  } catch {
    /* storage unavailable or corrupt — start empty */
  }
}

function update(next: CartState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep the in-memory cart */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return state;
}

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export const cart = {
  setQuantity(item: Omit<CartLine, "quantity">, quantity: number) {
    const clamped = Math.max(0, Math.min(MAX_QUANTITY, quantity));
    const others = state.lines.filter((line) => line.menuItemId !== item.menuItemId);
    const existing = state.lines.find((line) => line.menuItemId === item.menuItemId);
    const lines =
      clamped === 0
        ? others
        : existing
          ? state.lines.map((line) => (line.menuItemId === item.menuItemId ? { ...line, quantity: clamped } : line))
          : [...state.lines, { ...item, quantity: clamped }];
    update({ ...state, lines });
  },
  placed(order: PlacedOrder) {
    update({ lines: [], lastOrder: order });
  },
  dismissLastOrder() {
    update({ ...state, lastOrder: null });
  },
};

/** Window event FoodOrderSheet listens for, so other parts of the page can open checkout. */
export const OPEN_FOOD_ORDER_EVENT = "pv:open-food-order";

export function openFoodOrder() {
  window.dispatchEvent(new Event(OPEN_FOOD_ORDER_EVENT));
}

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
