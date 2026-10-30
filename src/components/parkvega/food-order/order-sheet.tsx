"use client";

import { CheckCircle2, Loader2, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import {
  cart,
  cartCount,
  cartTotal,
  OPEN_FOOD_ORDER_EVENT,
  useCart,
  type CartLine,
  type PlacedOrder,
} from "@/components/parkvega/food-order/cart-store";
import { CustomerIdBadge, SignInPrompt } from "@/components/parkvega/account-gate";
import { QuantityStepper } from "@/components/parkvega/food-order/quantity-stepper";
import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { WhatsAppIcon } from "@/components/parkvega/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { fullName, useResetSession, useSession } from "@/hooks/use-session";
import { isOpenDate, normalizeNgPhone, whatsappUrl } from "@/lib/site";
import { formatNaira } from "@/lib/utils";

const PICKUP_TIMES = [
  { value: "asap", label: "As soon as it's ready" },
  ...["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((time) => ({
    value: time,
    label: `${Number(time.slice(0, 2)) > 12 ? Number(time.slice(0, 2)) - 12 : 12}pm`,
  })),
];

function localIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** The next few days the park is open, starting today. */
function upcomingOpenDates(extraOpenDates?: string[], count = 6) {
  const dates: string[] = [];
  const cursor = new Date();
  while (dates.length < count) {
    const iso = localIsoDate(cursor);
    if (isOpenDate(iso, extraOpenDates)) dates.push(iso);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function dayLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = localIsoDate(new Date());
  const label = date.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
  return iso === today ? `Today · ${label}` : label;
}

function timeLabel(value: string) {
  return PICKUP_TIMES.find((time) => time.value === value)?.label ?? value;
}

function orderMessage(lines: CartLine[], details: Record<string, string>) {
  const items = lines.map((line) => `${line.quantity} × ${line.name} (${formatNaira(line.price * line.quantity)})`);
  return [
    "Hi Park Vega! I'd like to order food for pickup.",
    "",
    ...items,
    `Total: ${formatNaira(cartTotal(lines))}`,
    "",
    `Name: ${details.name}`,
    `Pickup: ${dayLabel(details.pickupDate)}, ${timeLabel(details.pickupTime)}`,
    details.notes ? `Notes: ${details.notes}` : "",
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n");
}

type CreatedOrder = { id?: string; code?: string; total?: number; authorization_url?: string; customer_id?: string };

function OrderConfirmation({ order, onNewOrder }: { order: PlacedOrder; onNewOrder: () => void }) {
  return (
    <div className="space-y-5" role="status">
      <div className="rounded-3xl bg-deep p-6 text-hero-foreground">
        <CheckCircle2 className="size-9 text-secondary" />
        <h3 className="mt-3 text-2xl font-semibold">Order placed!</h3>
        <p className="mt-1 text-sm text-hero-foreground/75">
          Pickup {dayLabel(order.pickupDate)}, {timeLabel(order.pickupTime)}
        </p>
        <p className="mt-4 text-xs font-bold uppercase text-hero-foreground/60">Order reference</p>
        <p className="font-mono text-2xl font-bold tracking-wider">{order.code}</p>
      </div>
      <CustomerIdBadge id={order.customerId} />
      <p className="text-sm">
        Show this reference at the restaurant counter to collect your food.
        {order.payAtPickup && " Pay at the counter when you pick up."}
      </p>
      <ul className="divide-y divide-border rounded-2xl border border-border text-sm">
        {order.lines.map((line) => (
          <li key={line.menuItemId} className="flex justify-between gap-3 p-3">
            <span>{line.quantity} × {line.name}</span>
            <span className="font-semibold">{formatNaira(line.price * line.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-3 p-3 font-bold">
          <span>Total</span>
          <span>{formatNaira(order.total)}</span>
        </li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <WhatsAppButton variant="outline" message={`Hi Park Vega! Question about food order ${order.code}.`}>
          Questions?
        </WhatsAppButton>
        <Button variant="ghost" onClick={onNewOrder}>
          Start a new order
        </Button>
      </div>
    </div>
  );
}

export function FoodOrderSheet({ extraOpenDates }: { extraOpenDates?: string[] }) {
  const { lines, lastOrder } = useCart();
  const { user, isLoading: sessionLoading } = useSession();
  const resetSession = useResetSession();
  // Back from logging in or signing up (`?order=resume`): reopen the order.
  const resume = useSearchParams().get("order") === "resume";
  const [open, setOpen] = useState(resume);
  const [sending, setSending] = useState(false);
  const [phoneError, setPhoneError] = useState<string>();
  const [whatsappFallback, setWhatsappFallback] = useState<string | null>(null);
  const [openDates] = useState(() => upcomingOpenDates(extraOpenDates));

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_FOOD_ORDER_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_FOOD_ORDER_EVENT, onOpen);
  }, []);

  const count = cartCount(lines);
  const total = cartTotal(lines);
  const showConfirmation = lines.length === 0 && lastOrder !== null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const details = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const whatsapp = normalizeNgPhone(details.whatsapp ?? "");
    if (!whatsapp) {
      setPhoneError("Enter a valid Nigerian WhatsApp number, e.g. 0802 444 0445");
      return;
    }
    setPhoneError(undefined);
    setSending(true);

    try {
      const res = await fetch("/api/food-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: details.name,
          phone: whatsapp,
          whatsapp,
          ...(details.email ? { email: details.email } : {}),
          pickup_date: details.pickupDate,
          pickup_time: details.pickupTime,
          notes: details.notes || undefined,
          items: lines.map((line) => ({
            menu_item_id: line.menuItemId,
            restaurant_id: line.restaurantId,
            quantity: line.quantity,
          })),
          redirect_url: `${window.location.origin}/restaurants?order=placed`,
        }),
      });
      // Session expired since the drawer opened: show the sign-in prompt again.
      if (res.status === 401) {
        resetSession();
        return;
      }
      if (!res.ok) throw new Error(`Order failed (${res.status})`);
      const body = await res.json();
      const created: CreatedOrder = body?.data ?? body;
      cart.placed({
        code: created.code ?? created.id ?? "—",
        total: created.total ?? total,
        pickupDate: details.pickupDate,
        pickupTime: details.pickupTime,
        lines,
        payAtPickup: !created.authorization_url,
        customerId: created.customer_id ?? user?.customer_id ?? null,
      });
      // When the backend takes payment online it returns a checkout URL.
      if (created.authorization_url) window.location.href = created.authorization_url;
    } catch {
      // Ordering isn't available yet (or failed): hand the order to WhatsApp
      // so it still reaches the restaurant.
      setWhatsappFallback(orderMessage(lines, details));
    } finally {
      setSending(false);
    }
  }

  if (count === 0 && !lastOrder) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={showConfirmation ? `View food order ${lastOrder.code}` : `View food order: ${count} item${count === 1 ? "" : "s"}, ${formatNaira(total)}`}
        className="fixed bottom-20 left-3 right-20 z-40 flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-deep px-5 text-hero-foreground shadow-2xl md:bottom-6 md:left-auto md:right-24 md:w-96 lg:hidden"
      >
        {showConfirmation ? (
          <>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-5 text-secondary" /> Order {lastOrder.code}
            </span>
            <span className="text-sm text-hero-foreground/75">View</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 whitespace-nowrap font-semibold">
              <ShoppingBag className="size-5 shrink-0 text-secondary" />
              {count} · <span className="font-display">{formatNaira(total)}</span>
            </span>
            <span className="whitespace-nowrap text-sm font-bold text-secondary">View order</span>
          </>
        )}
      </button>

      <Sheet open={open} onOpenChange={(next) => { setOpen(next); if (!next) setWhatsappFallback(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 text-2xl">
              <UtensilsCrossed className="size-6 text-primary-ink" /> Your food order
            </SheetTitle>
            <SheetDescription>Order now, pick up in person at the restaurant counter.</SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {showConfirmation ? (
              <OrderConfirmation order={lastOrder} onNewOrder={() => { cart.dismissLastOrder(); setOpen(false); }} />
            ) : whatsappFallback ? (
              <div className="space-y-4 text-center" role="status">
                <WhatsAppIcon className="mx-auto size-12 text-whatsapp" />
                <h3 className="text-xl font-semibold">Send your order on WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  Online ordering is busy right now. Tap below to send your order to the restaurant on WhatsApp – it&apos;s already written for you.
                </p>
                <Button asChild size="lg" className="w-full bg-whatsapp text-white hover:bg-whatsapp/90">
                  <a href={whatsappUrl(whatsappFallback)} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="size-5" /> Send order on WhatsApp
                  </a>
                </Button>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {lines.map((line) => (
                    <li key={line.menuItemId} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{line.name}</p>
                        <p className="text-sm text-muted-foreground">{formatNaira(line.price * line.quantity)}</p>
                      </div>
                      <QuantityStepper
                        name={line.name}
                        quantity={line.quantity}
                        onChange={(next) => cart.setQuantity(line, next)}
                      />
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-border pt-4 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatNaira(total)}</span>
                </div>

                {sessionLoading ? (
                  <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
                    <Loader2 className="size-4 animate-spin" /> Checking your account…
                  </p>
                ) : !user ? (
                  <div className="mt-6">
                    <SignInPrompt
                      title="Sign in to order food"
                      text="Food orders are linked to your Park Vega account so the restaurant can reach you. Your cart is saved."
                      next="/restaurants?order=resume"
                    />
                  </div>
                ) : (
                <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
                    <span>
                      Ordering as <span className="font-semibold">{fullName(user)}</span>
                    </span>
                    <CustomerIdBadge id={user.customer_id} className="bg-card" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="food-name">Your name</Label>
                    <Input id="food-name" name="name" required autoComplete="name" defaultValue={fullName(user)} className="h-12 text-base md:text-base" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="food-whatsapp">WhatsApp number</Label>
                    <Input
                      id="food-whatsapp"
                      name="whatsapp"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      placeholder="0802 444 0445"
                      defaultValue={user.phone_number ?? ""}
                      aria-invalid={phoneError ? true : undefined}
                      className="h-12 text-base md:text-base"
                    />
                    {phoneError && <p className="text-xs font-semibold text-destructive">{phoneError}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="food-email">
                      Email <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input id="food-email" name="email" type="email" autoComplete="email" defaultValue={user.email} className="h-12 text-base md:text-base" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
                    <div className="grid gap-2">
                      <Label htmlFor="food-date">Pickup day</Label>
                      <select id="food-date" name="pickupDate" required className="h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base">
                        {openDates.map((date) => (
                          <option key={date} value={date}>{dayLabel(date)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="food-time">Pickup time</Label>
                      <select id="food-time" name="pickupTime" required className="h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base">
                        {PICKUP_TIMES.map((time) => (
                          <option key={time.value} value={time.value}>{time.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="food-notes">
                      Notes <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea id="food-notes" name="notes" rows={2} placeholder="Allergies, no pepper, extra sauce…" className="text-base md:text-base" />
                  </div>
                  <Button type="submit" variant="ticket" size="lg" disabled={sending || lines.length === 0}>
                    {sending && <Loader2 className="size-5 animate-spin" />}
                    Pay {formatNaira(total)}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    You&apos;ll pay securely online with Flutterwave. Pickup in person only; your order reference is sent to WhatsApp.
                  </p>
                </form>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
