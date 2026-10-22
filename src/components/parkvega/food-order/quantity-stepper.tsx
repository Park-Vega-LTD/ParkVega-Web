"use client";

import { Minus, Plus } from "lucide-react";

import { MAX_QUANTITY } from "@/components/parkvega/food-order/cart-store";

/** Compact − qty + control with 44px touch targets. */
export function QuantityStepper({
  name,
  quantity,
  onChange,
}: {
  name: string;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-background">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={`Remove one ${name}`}
        className="grid size-11 place-items-center rounded-full hover:bg-muted"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-6 text-center font-bold tabular-nums" aria-live="polite" aria-label={`${quantity} ${name} in order`}>
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_QUANTITY}
        aria-label={`Add one more ${name}`}
        className="grid size-11 place-items-center rounded-full hover:bg-muted disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
