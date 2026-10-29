"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reveals `[data-reveal]` elements as they scroll into view.
 *
 * Content is only hidden once this has run (the `reveal-ready` class on
 * <html>), so it stays visible without JavaScript and for visitors who prefer
 * reduced motion. Stagger siblings with an inline `--i` index.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const observe = (scope: ParentNode) =>
      scope.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => observer.observe(el));

    observe(document);
    // Pick up content that streams in after the first scan (Suspense, client lists).
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches("[data-reveal]:not([data-revealed])")) observer.observe(node);
          observe(node);
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}
