"use client";

import * as React from "react";

import {
  CONSENT_COOKIE,
  clearWithdrawnCookies,
  consentModeState,
  parseConsent,
  writeConsentCookie,
  type ConsentChoice,
  type StoredConsent,
} from "@/lib/analytics/consent";
import { gtag, pushDataLayer } from "@/lib/analytics/gtag";

type ConsentContextValue = {
  /** The visitor's choice, or null while they have not chosen. */
  consent: StoredConsent | null;
  /** False until the cookie has been read on the client (avoids a flash of the banner). */
  ready: boolean;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  save: (choice: ConsentChoice) => void;
};

const ConsentContext = React.createContext<ConsentContextValue | null>(null);

/** Fired after the consent cookie changes so the store re-reads it. */
const CHANGE_EVENT = "pv-consent-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

/** The raw cookie value ("" when unset); null on the server, so the banner never renders there. */
function readRawCookie(): string {
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  return entry ? entry.slice(CONSENT_COOKIE.length + 1) : "";
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const raw = React.useSyncExternalStore<string | null>(subscribe, readRawCookie, () => null);
  const consent = React.useMemo(() => parseConsent(raw), [raw]);
  const ready = raw !== null;
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const save = React.useCallback(
    (choice: ConsentChoice) => {
      const previous: ConsentChoice = consent ?? { analytics: false, marketing: false };
      writeConsentCookie(choice);
      gtag("consent", "update", consentModeState(choice));
      pushDataLayer({
        event: "pv_consent_update",
        consent_analytics: choice.analytics,
        consent_marketing: choice.marketing,
      });

      const withdrew =
        (previous.analytics && !choice.analytics) || (previous.marketing && !choice.marketing);
      if (withdrew) {
        // Loaded tags cannot be unloaded: clear their cookies and start a
        // clean page so nothing keeps running against the new choice.
        clearWithdrawnCookies(previous, choice);
        window.location.reload();
        return;
      }

      window.dispatchEvent(new Event(CHANGE_EVENT));
      setSettingsOpen(false);
    },
    [consent],
  );

  const value = React.useMemo<ConsentContextValue>(
    () => ({
      consent,
      ready,
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      save,
    }),
    [consent, ready, settingsOpen, save],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const value = React.useContext(ConsentContext);
  if (!value) throw new Error("useConsent must be used inside <ConsentProvider>");
  return value;
}
