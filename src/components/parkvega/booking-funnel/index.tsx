"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { DateStep } from "./date-step";
import { TicketStep } from "./ticket-step";
import { CheckoutStep } from "./checkout-step";
import type { FunnelState, FunnelStep, TicketSelection } from "./types";

/**
 * Booking funnel orchestrator (Requirements 6.1, 6.8).
 *
 * Manages the three-step funnel state via `useReducer`, renders the active
 * step, and enforces the forward-navigation rules from design Section 10:
 *   - Step 1 → 2 requires a visit date and a non-empty product list
 *     (the product check is enforced inside `TicketStep`, which only calls
 *     `onNext` once a date is chosen and products are shown).
 *   - Step 2 → 3 requires total quantity >= 1 with per-category 0–20
 *     (enforced inside `TicketStep`).
 *   - No account is needed: checkout only asks for name, WhatsApp number and
 *     an optional email (client brief §6a), so guests are never sent to login.
 *
 * Back navigation is always allowed.
 */

type FunnelAction =
  | { type: "SET_DATE"; visitDate: string }
  | { type: "SET_SELECTIONS"; selections: TicketSelection[] }
  | { type: "GO_TO"; step: FunnelStep }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "SET_ERROR"; error: string | null };

const initialState: FunnelState = {
  step: 1,
  visitDate: null,
  selections: [],
  guestDetails: null,
  bookingCode: null,
  isSubmitting: false,
  error: null,
};

function funnelReducer(state: FunnelState, action: FunnelAction): FunnelState {
  switch (action.type) {
    case "SET_DATE":
      // Changing the date invalidates any existing product selections.
      return {
        ...state,
        visitDate: action.visitDate,
        selections:
          action.visitDate === state.visitDate ? state.selections : [],
        step: 2,
        error: null,
      };
    case "SET_SELECTIONS":
      return { ...state, selections: action.selections, step: 3, error: null };
    case "GO_TO":
      return { ...state, step: action.step, error: null };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting };
    case "SET_ERROR":
      return { ...state, error: action.error };
    default:
      return state;
  }
}

const STEP_LABELS: Record<FunnelStep, string> = {
  1: "Date",
  2: "Tickets",
  3: "Checkout",
};

function StepIndicator({ current }: { current: FunnelStep }) {
  const steps: FunnelStep[] = [1, 2, 3];
  return (
    <ol className="mb-8 flex items-center justify-center gap-2" aria-label="Booking progress">
      {steps.map((step, index) => {
        const isActive = step === current;
        const isComplete = step < current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-sm font-semibold",
                isActive && "border-primary bg-primary text-primary-foreground",
                isComplete && "border-primary bg-primary/10 text-primary-ink",
                !isActive && !isComplete && "border-border text-muted-foreground",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {step}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {STEP_LABELS[step]}
            </span>
            {index < steps.length - 1 ? (
              <span className="mx-1 h-px w-6 bg-border" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function BookingFunnel({ extraOpenDates }: { extraOpenDates?: string[] }) {
  const [state, dispatch] = React.useReducer(funnelReducer, initialState);

  // Step 1 → 2: a date was chosen.
  const handleDateNext = React.useCallback((visitDate: string) => {
    dispatch({ type: "SET_DATE", visitDate });
  }, []);

  // Step 2 → 3: tickets chosen.
  const handleTicketNext = React.useCallback((selections: TicketSelection[]) => {
    dispatch({ type: "SET_SELECTIONS", selections });
  }, []);

  const goBackTo = React.useCallback((step: FunnelStep) => {
    dispatch({ type: "GO_TO", step });
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <StepIndicator current={state.step} />

      {state.step === 1 ? (
        <DateStep initialDate={state.visitDate} extraOpenDates={extraOpenDates} onNext={handleDateNext} />
      ) : null}

      {state.step === 2 && state.visitDate ? (
        <TicketStep
          visitDate={state.visitDate}
          selections={state.selections}
          onNext={handleTicketNext}
          onBack={() => goBackTo(1)}
        />
      ) : null}

      {state.step === 3 && state.visitDate ? (
        <CheckoutStep
          visitDate={state.visitDate}
          selections={state.selections}
          guestDetails={state.guestDetails}
          onBack={() => goBackTo(2)}
        />
      ) : null}
    </div>
  );
}

export default BookingFunnel;
