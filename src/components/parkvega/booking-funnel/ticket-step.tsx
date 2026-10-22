"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";

import { clientFetch } from "@/lib/api.client";
import { cn, formatNaira } from "@/lib/utils";
import type { TicketProduct } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TicketSelection } from "./types";

/** Minimum / maximum quantity allowed per visitor category (Requirement 6.4). */
const MIN_QTY = 0;
const MAX_QTY = 20;

interface TicketStepProps {
  /** Selected visit date as `YYYY-MM-DD`. */
  visitDate: string;
  /** Current selections from funnel state, keyed by productId. */
  selections: TicketSelection[];
  /** Emits the finalised selections (with prices) and advances to step 3. */
  onNext: (selections: TicketSelection[]) => void;
  /** Returns to step 1. */
  onBack: () => void;
}

/** Shape of the per-category price lookup returned by the REST API. */
interface TicketPrice {
  price: number;
}

/** Local, editable quantity state keyed by productId. */
interface QtyState {
  adultQty: number;
  childQty: number;
}

function clampQty(value: number): number {
  if (Number.isNaN(value)) return MIN_QTY;
  return Math.min(MAX_QTY, Math.max(MIN_QTY, Math.trunc(value)));
}

/**
 * Fetch the unit price for a single product + visitor category + date.
 * Lives in its own component so each price has its own `useQuery`
 * (`['ticket-price', productId, category, date]`) per the design's query-key
 * convention. Returns the resolved price via `onResolved` so the parent can
 * build the final selections on advance.
 */
function useTicketPrice(
  productId: string,
  category: "ADULT" | "CHILD",
  date: string,
) {
  return useQuery({
    queryKey: ["ticket-price", productId, category, date],
    queryFn: () =>
      clientFetch<TicketPrice>(
        `/api/ticket-products/${productId}/price?category=${category}&date=${date}`,
      ),
    staleTime: 60_000,
  });
}

function QtyControl({
  label,
  value,
  price,
  onChange,
}: {
  label: string;
  value: number;
  price: number | undefined;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          {price === undefined ? "—" : formatNaira(price)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Decrease ${label} quantity`}
          disabled={value <= MIN_QTY}
          onClick={() => onChange(clampQty(value - 1))}
        >
          <Minus className="size-4" aria-hidden="true" />
        </Button>
        <span
          className="w-8 text-center text-sm font-semibold tabular-nums"
          aria-live="polite"
        >
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Increase ${label} quantity`}
          disabled={value >= MAX_QTY}
          onClick={() => onChange(clampQty(value + 1))}
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Renders a single product's quantity selectors, fetching adult/child prices
 * for the selected date. Reports its resolved prices to the parent so the
 * parent can assemble the final selections.
 */
function ProductRow({
  product,
  date,
  qty,
  onQtyChange,
  onPricesResolved,
}: {
  product: TicketProduct;
  date: string;
  qty: QtyState;
  onQtyChange: (next: QtyState) => void;
  onPricesResolved: (
    productId: string,
    prices: { adultPrice: number; childPrice: number },
  ) => void;
}) {
  const adultPriceQuery = useTicketPrice(product.id, "ADULT", date);
  const childPriceQuery = useTicketPrice(product.id, "CHILD", date);

  const adultPrice = adultPriceQuery.data?.price;
  const childPrice = childPriceQuery.data?.price;

  // Report resolved prices up to the parent whenever they change.
  React.useEffect(() => {
    if (adultPrice !== undefined && childPrice !== undefined) {
      onPricesResolved(product.id, { adultPrice, childPrice });
    }
  }, [adultPrice, childPrice, product.id, onPricesResolved]);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2">
        <h3 className="font-display text-lg font-semibold">{product.name}</h3>
        {product.description ? (
          <p className="text-sm text-muted-foreground">{product.description}</p>
        ) : null}
      </div>
      <div className="divide-y">
        <QtyControl
          label="Adult"
          value={qty.adultQty}
          price={adultPrice}
          onChange={(adultQty) => onQtyChange({ ...qty, adultQty })}
        />
        <QtyControl
          label="Child"
          value={qty.childQty}
          price={childPrice}
          onChange={(childQty) => onQtyChange({ ...qty, childQty })}
        />
      </div>
    </div>
  );
}

export function TicketStep({
  visitDate,
  selections,
  onNext,
  onBack,
}: TicketStepProps) {
  // Fetch available ticket products for the selected date (Requirement 6.2).
  const productsQuery = useQuery({
    queryKey: ["ticket-products", visitDate],
    queryFn: () =>
      clientFetch<TicketProduct[]>(`/api/ticket-products?date=${visitDate}`),
    staleTime: 60_000,
  });

  // Local quantity state, seeded from any prior funnel selections.
  const [quantities, setQuantities] = React.useState<Record<string, QtyState>>(
    () => {
      const seed: Record<string, QtyState> = {};
      for (const sel of selections) {
        seed[sel.productId] = {
          adultQty: sel.adultQty,
          childQty: sel.childQty,
        };
      }
      return seed;
    },
  );

  // Resolved prices reported by each ProductRow, keyed by productId.
  const [prices, setPrices] = React.useState<
    Record<string, { adultPrice: number; childPrice: number }>
  >({});

  const handlePricesResolved = React.useCallback(
    (productId: string, resolved: { adultPrice: number; childPrice: number }) => {
      setPrices((prev) => {
        const existing = prev[productId];
        if (
          existing &&
          existing.adultPrice === resolved.adultPrice &&
          existing.childPrice === resolved.childPrice
        ) {
          return prev;
        }
        return { ...prev, [productId]: resolved };
      });
    },
    [],
  );

  const products = productsQuery.data ?? [];

  const totalQty = React.useMemo(
    () =>
      Object.values(quantities).reduce(
        (sum, q) => sum + q.adultQty + q.childQty,
        0,
      ),
    [quantities],
  );

  // Require total qty >= 1 to advance (Requirement 6.4).
  const canAdvance = totalQty >= 1;

  function handleContinue() {
    if (!canAdvance) return;

    const finalSelections: TicketSelection[] = products
      .map((product) => {
        const qty = quantities[product.id] ?? { adultQty: 0, childQty: 0 };
        const resolved = prices[product.id] ?? { adultPrice: 0, childPrice: 0 };
        return {
          productId: product.id,
          name: product.name,
          adultQty: qty.adultQty,
          childQty: qty.childQty,
          adultPrice: resolved.adultPrice,
          childPrice: resolved.childPrice,
        };
      })
      .filter((sel) => sel.adultQty + sel.childQty > 0);

    onNext(finalSelections);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Choose your tickets</CardTitle>
        <CardDescription>
          Select how many visitors are coming. You can book up to {MAX_QTY} per
          category.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {productsQuery.isPending ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading tickets…
          </p>
        ) : productsQuery.isError ? (
          <div className="space-y-4 py-8 text-center">
            <p className="text-sm text-destructive">
              We couldn&apos;t load tickets. Please try again.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => productsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : products.length === 0 ? (
          // Empty product list: block advancement (Requirement 6.3).
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tickets available for this date
          </p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                date={visitDate}
                qty={quantities[product.id] ?? { adultQty: 0, childQty: 0 }}
                onQtyChange={(next) =>
                  setQuantities((prev) => ({ ...prev, [product.id]: next }))
                }
                onPricesResolved={handlePricesResolved}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "text-sm",
                canAdvance ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {totalQty} {totalQty === 1 ? "ticket" : "tickets"} selected
            </span>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!canAdvance}
            >
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
