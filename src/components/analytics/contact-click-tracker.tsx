"use client";

import * as React from "react";

import { track, type ContactPlacement } from "@/lib/analytics/events";

/**
 * One listener for every phone, WhatsApp, email and map link on the site, so
 * contact intent is measured without wiring each of the dozen places those
 * links appear. Links can opt out with `data-analytics-skip` (when a more
 * specific event is sent instead) and name their spot with
 * `data-track-placement`.
 */
export function ContactClickTracker() {
  React.useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.hasAttribute("data-analytics-skip")) return;

      const kind = classify(link.href);
      if (!kind) return;
      const link_placement = placementOf(link);

      switch (kind) {
        case "phone":
          track({ name: "contact_phone", link_placement });
          break;
        case "whatsapp":
          track({ name: "contact_whatsapp", link_placement });
          break;
        case "email":
          track({ name: "contact_email", link_placement });
          break;
        case "directions":
          track({ name: "get_directions", link_placement, origin_city: originCity(link.href) });
          break;
      }
    }
    // Capture phase: runs even if a component stops the click from bubbling.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

type ContactKind = "phone" | "whatsapp" | "email" | "directions";

export function classify(href: string): ContactKind | null {
  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  if (url.protocol === "tel:") return "phone";
  if (url.protocol === "mailto:") return "email";
  const host = url.hostname.replace(/^www\./, "");
  if (host === "wa.me" || host === "api.whatsapp.com" || host === "whatsapp.com") return "whatsapp";
  if (
    (host === "google.com" && url.pathname.startsWith("/maps")) ||
    host === "maps.google.com" ||
    host === "maps.app.goo.gl" ||
    host === "goo.gl"
  ) {
    return "directions";
  }
  return null;
}

function placementOf(link: Element): ContactPlacement {
  const explicit = link.closest("[data-track-placement]")?.getAttribute("data-track-placement");
  if (explicit === "header" || explicit === "footer" || explicit === "floating" || explicit === "content") {
    return explicit;
  }
  if (link.closest("footer")) return "footer";
  if (link.closest("header")) return "header";
  // Floating buttons (WhatsApp bubble) sit in a fixed-position container.
  for (let el: Element | null = link; el && el !== document.body; el = el.parentElement) {
    if (getComputedStyle(el).position === "fixed") return "floating";
  }
  return "content";
}

/**
 * The city a "directions from …" link starts in (only the place name, from
 * our own links to Google Maps), e.g. "Benin City".
 */
function originCity(href: string): string | undefined {
  try {
    const origin = new URL(href).searchParams.get("origin");
    return origin ? origin.split(",")[0].trim().slice(0, 40) : undefined;
  } catch {
    return undefined;
  }
}
