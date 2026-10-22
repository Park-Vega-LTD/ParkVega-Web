"use client";

import * as React from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { WhatsAppIcon } from "@/components/parkvega/whatsapp-icon";
import { clientFetch } from "@/lib/api.client";
import { normalizeNgPhone } from "@/lib/site";
import { formatNaira } from "@/lib/utils";
import type { Booking } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { GuestDetails, TicketSelection } from "./types";

/** Fallback shown when the REST API returns no usable error message (Req 6.6). */
const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

// Name + WhatsApp number are all a guest needs; email is optional (brief §6a).
const guestSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  whatsapp: z
    .string()
    .refine((value) => normalizeNgPhone(value) !== null, "Enter a valid Nigerian WhatsApp number, e.g. 0802 444 0445."),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address.")]),
});

type GuestFormValues = z.infer<typeof guestSchema>;

/** Payload sent to POST /bookings via the BFF proxy. */
interface CreateBookingPayload {
  visit_date: string;
  full_name: string;
  /** E.164 WhatsApp number; confirmations are sent here. */
  phone: string;
  whatsapp: string;
  email?: string;
  items: Array<{
    ticket_product_id: string;
    adults: number;
    children: number;
  }>;
}

/** Response from POST /api/payments/initiate. */
interface InitiatePaymentResponse {
  authorization_url: string;
  payment_id: string;
}

interface CheckoutStepProps {
  visitDate: string;
  selections: TicketSelection[];
  /** Previously-entered guest details, restored when navigating back. */
  guestDetails: GuestDetails | null;
  /** Returns to step 2. */
  onBack: () => void;
}

/** Compute the subtotal for a single selection line. */
function lineTotal(sel: TicketSelection): number {
  return sel.adultQty * sel.adultPrice + sel.childQty * sel.childPrice;
}

export function CheckoutStep({
  visitDate,
  selections,
  guestDetails,
  onBack,
}: CheckoutStepProps) {
  const [formError, setFormError] = React.useState<string | null>(null);

  const total = React.useMemo(
    () => selections.reduce((sum, sel) => sum + lineTotal(sel), 0),
    [selections],
  );

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      fullName: guestDetails?.fullName ?? "",
      whatsapp: guestDetails?.whatsapp ?? "",
      email: guestDetails?.email ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: GuestFormValues) => {
      // 1. Create the booking via the BFF data proxy (Requirement 6.5).
      const whatsapp = normalizeNgPhone(values.whatsapp) as string;
      const payload: CreateBookingPayload = {
        visit_date: visitDate,
        full_name: values.fullName,
        phone: whatsapp,
        whatsapp,
        ...(values.email ? { email: values.email } : {}),
        items: selections.map((sel) => ({
          ticket_product_id: sel.productId,
          adults: sel.adultQty,
          children: sel.childQty,
        })),
      };

      const booking = await clientFetch<Booking>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // 2. Initiate payment via the BFF Route Handler (Requirements 7.1, 7.4).
      const payment = await clientFetch<InitiatePaymentResponse>(
        "/api/payments/initiate",
        {
          method: "POST",
          body: JSON.stringify({ bookingId: booking.id }),
        },
      );

      return payment;
    },
    onSuccess: (payment) => {
      // Redirect the browser to the Flutterwave hosted payment page.
      window.location.href = payment.authorization_url;
    },
    onError: (error) => {
      // Display the REST API error message, or a fallback (Requirement 6.6).
      const message =
        error instanceof Error && error.message
          ? error.message
          : GENERIC_ERROR_MESSAGE;
      setFormError(message);
    },
  });

  function onSubmit(values: GuestFormValues) {
    setFormError(null);
    mutation.mutate(values);
  }

  const isSubmitting = mutation.isPending;

  const prettyDate = React.useMemo(() => {
    const [year, month, day] = visitDate.split("-").map(Number);
    if (!year || !month || !day) return visitDate;
    return format(new Date(year, month - 1, day), "EEEE, d MMMM yyyy");
  }, [visitDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Review &amp; checkout</CardTitle>
        <CardDescription>
          No account needed – just your name and WhatsApp number. Your
          tickets are sent to WhatsApp (and email, if you add one).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Booking summary (Requirement 6.5) */}
        <section aria-labelledby="summary-heading" className="space-y-3">
          <h3 id="summary-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your order
          </h3>
          <div className="rounded-lg border p-4 text-sm">
            <div className="flex justify-between pb-3">
              <span className="text-muted-foreground">Visit date</span>
              <span className="font-medium">{prettyDate}</span>
            </div>
            <div className="space-y-2 border-t pt-3">
              {selections.map((sel) => (
                <div key={sel.productId} className="space-y-1">
                  <p className="font-medium">{sel.name}</p>
                  {sel.adultQty > 0 ? (
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        Adult × {sel.adultQty} ({formatNaira(sel.adultPrice)} each)
                      </span>
                      <span>{formatNaira(sel.adultQty * sel.adultPrice)}</span>
                    </div>
                  ) : null}
                  {sel.childQty > 0 ? (
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        Child × {sel.childQty} ({formatNaira(sel.childPrice)} each)
                      </span>
                      <span>{formatNaira(sel.childQty * sel.childPrice)}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{formatNaira(total)}</span>
            </div>
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              Valid for entry on your visit date. Park Vega opens Thursdays,
              Fridays, Saturdays, Sundays and public holidays, 11am – 6pm.
            </p>
          </div>
        </section>

        {/* Guest details form (Requirement 6.5) */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      placeholder="Ada Okafor"
                      disabled={isSubmitting}
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <WhatsAppIcon className="size-4 text-whatsapp" /> WhatsApp number
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="0802 444 0445"
                      disabled={isSubmitting}
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      disabled={isSubmitting}
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {formError}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button type="submit" variant="ticket" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Processing…
                  </>
                ) : (
                  `Pay ${formatNaira(total)}`
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
