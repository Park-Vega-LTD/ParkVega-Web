"use client";

import * as React from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

import { persistAttribution, recordLanding } from "@/lib/analytics/attribution";
import { gtag, pushDataLayer } from "@/lib/analytics/gtag";
import { isPrivatePath, redactPath, redactReferrer, redactUrl } from "@/lib/analytics/privacy";
import { ContactClickTracker } from "./contact-click-tracker";
import { useConsent } from "./consent-provider";

const GTM_ID = /^GTM-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GTM_ID ?? "")
  ? process.env.NEXT_PUBLIC_GTM_ID
  : undefined;
const CLARITY_ID = /^[a-z0-9]+$/i.test(process.env.NEXT_PUBLIC_CLARITY_ID ?? "")
  ? process.env.NEXT_PUBLIC_CLARITY_ID
  : undefined;

/**
 * Third-party measurement, loaded only after the visitor allows it:
 *  - Google Tag Manager (which carries GA4, and later the Meta Pixel) once
 *    analytics or advertising is allowed. Tags inside GTM still obey the
 *    Consent Mode signals per category.
 *  - Microsoft Clarity once analytics is allowed, never on private pages.
 *
 * Page views are pushed to the dataLayer on every route change as
 * `pv_page_view` with a redacted URL; GA4 in GTM must use those values
 * (see docs/analytics-setup.md) rather than its automatic page views.
 */
export function AnalyticsScripts() {
  const { consent } = useConsent();
  const allowGtm = Boolean(GTM_ID && (consent?.analytics || consent?.marketing));
  const allowClarity = Boolean(CLARITY_ID && consent?.analytics);

  // Campaign / referrer of this visit: held in memory, stored once analytics is allowed.
  React.useEffect(() => {
    recordLanding();
  }, []);
  React.useEffect(() => {
    if (consent?.analytics) persistAttribution();
  }, [consent?.analytics]);

  return (
    <>
      <PageViewTracker />
      <ContactClickTracker />
      {allowGtm ? (
        <Script id="pv-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(GTM_ID)});`}
        </Script>
      ) : null}
      {allowClarity ? <ClarityLoader projectId={CLARITY_ID!} /> : null}
    </>
  );
}

/** Pushes one redacted `pv_page_view` per route, including the first. */
function PageViewTracker() {
  const pathname = usePathname();
  const previous = React.useRef<string | null>(null);

  React.useEffect(() => {
    // The new route's <title> can arrive after the URL changes (streamed
    // metadata), so wait briefly for it. `previous` is only updated once the
    // push happens, so a cancelled run (strict mode) simply retries.
    let timer = 0;
    let tries = 0;
    const send = () => {
      if (!document.title && tries++ < 20) {
        timer = window.setTimeout(send, 50);
        return;
      }
      const location = redactUrl(window.location.href);
      if (location === previous.current) return; // same page, e.g. a hash change
      const referrer =
        previous.current ?? redactReferrer(document.referrer, window.location.origin);
      previous.current = location;
      const page = {
        page_location: location,
        page_path: redactPath(window.location.pathname),
        page_referrer: referrer,
        page_title: document.title,
      };
      gtag("set", page);
      pushDataLayer({ event: "pv_page_view", ...page });
    };
    timer = window.setTimeout(send, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}

let clarityLoaded = false;

/**
 * Loads Clarity on a public page. Clarity has no "stop" call, so if a visitor
 * then moves into a private area (account, bookings, tickets) in the same
 * tab, the page is reloaded without Clarity before anything there renders
 * for long.
 */
function ClarityLoader({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (isPrivatePath(pathname)) {
      if (clarityLoaded) window.location.reload();
      return;
    }
    if (clarityLoaded) return;
    clarityLoaded = true;

    // Clarity's own queue shim: it replays the queued `arguments` objects.
    window.clarity =
      window.clarity ||
      (function clarityQueue() {
        const fn = window.clarity!;
        // eslint-disable-next-line prefer-rest-params
        (fn.q = fn.q || []).push(arguments);
      } as NonNullable<Window["clarity"]>);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
    document.head.appendChild(script);
    window.clarity("consent");
  }, [pathname, projectId]);

  return null;
}
