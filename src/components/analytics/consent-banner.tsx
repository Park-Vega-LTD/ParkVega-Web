"use client";

import * as React from "react";
import { Cookie } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ConsentChoice } from "@/lib/analytics/consent";
import { useConsent } from "./consent-provider";

/**
 * Ad measurement is only offered once an ad platform is configured, so
 * visitors are never asked to allow something the site does not use. When the
 * Meta Pixel is added, raise NEXT_PUBLIC_CONSENT_VERSION so everyone is asked
 * again with the new option.
 */
const MARKETING_IN_USE = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID);

/**
 * Cookie choice panel. Shown until the visitor decides, and again from the
 * footer's "Cookie settings". Accept and Reject are equally easy (NDPA /
 * GAID 2025); the site works fully either way, so it never blocks the page.
 */
export function ConsentBanner() {
  const { consent, ready, settingsOpen } = useConsent();
  if (!ready || (consent !== null && !settingsOpen)) return null;
  // Remount on each opening so the switches start from the saved choice.
  return <ConsentPanel key={settingsOpen ? "settings" : "first-visit"} />;
}

function ConsentPanel() {
  const { consent, settingsOpen, closeSettings, save } = useConsent();
  const [customising, setCustomising] = React.useState(settingsOpen);
  const [draft, setDraft] = React.useState<ConsentChoice>({
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  });

  const all = (value: boolean) => save({ analytics: value, marketing: MARKETING_IN_USE && value });

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-h-[calc(100dvh-1.5rem)] max-w-3xl overflow-y-auto rounded-3xl border border-border bg-background p-5 shadow-2xl sm:p-6"
      data-clarity-mask="true"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="consent-title" className="font-display text-xl font-semibold">
            Your privacy at Park Vega
          </h2>
          <p id="consent-description" className="mt-2 text-sm text-muted-foreground">
            We use essential cookies to run bookings and sign-in. With your permission we also use
            analytics (Google Analytics and Microsoft Clarity) to see which pages help families plan a
            visit, so we can improve the site. We never send your name, phone number, email or booking
            code to these services. You can change your choice any time from &ldquo;Cookie settings&rdquo;
            at the bottom of every page.
          </p>
        </div>
      </div>

      {customising ? (
        <ul className="mt-5 grid gap-3">
          <CategoryRow
            id="consent-essential"
            title="Essential"
            description="Bookings, payments, sign-in and remembering this choice. Always on."
            checked
            disabled
          />
          <CategoryRow
            id="consent-analytics"
            title="Analytics"
            description="Google Analytics and Microsoft Clarity: pages visited, clicks and how the booking steps are used. Clarity hides what you type."
            checked={draft.analytics}
            onChange={(analytics) => setDraft((d) => ({ ...d, analytics }))}
          />
          {MARKETING_IN_USE ? (
            <CategoryRow
              id="consent-marketing"
              title="Advertising"
              description="Lets ad platforms such as Meta measure which adverts lead to bookings."
              checked={draft.marketing}
              onChange={(marketing) => setDraft((d) => ({ ...d, marketing }))}
            />
          ) : null}
        </ul>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {customising ? (
          <>
            {settingsOpen && consent ? (
              <Button variant="outline" size="sm" className="h-11" onClick={closeSettings}>
                Cancel
              </Button>
            ) : null}
            <Button
              size="sm"
              className="h-11"
              onClick={() => save({ analytics: draft.analytics, marketing: MARKETING_IN_USE && draft.marketing })}
            >
              Save choices
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" className="h-11" onClick={() => setCustomising(true)}>
            Customise
          </Button>
        )}
        <Button size="sm" className="h-11" onClick={() => all(false)}>
          Reject all
        </Button>
        <Button size="sm" className="h-11" onClick={() => all(true)}>
          Accept all
        </Button>
      </div>
    </section>
  );
}

function CategoryRow({
  id,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <li className={cn("flex items-start justify-between gap-4 rounded-2xl border border-border p-4", disabled && "opacity-80")}>
      <div>
        <label htmlFor={id} className="font-semibold">
          {title}
        </label>
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-describedby={`${id}-hint`}
        className="mt-1"
      />
    </li>
  );
}

/** Footer link that reopens the panel. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { openSettings } = useConsent();
  return (
    <button type="button" onClick={openSettings} className={className}>
      Cookie settings
    </button>
  );
}
