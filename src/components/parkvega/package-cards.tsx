import { Check } from "lucide-react";

import { WhatsAppButton } from "@/components/parkvega/whatsapp-button";
import { formatNaira } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Package } from "@/lib/visit-content";

/** Package / pricing cards. Packages without a price show "Price on request". */
export function PackageCards({
  packages,
  enquiry,
}: {
  packages: Package[];
  /** Pre-filled WhatsApp message; the package name is appended. */
  enquiry: string;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {packages.map((pkg) => (
        <article
          key={pkg.name}
          className={cn(
            "flex flex-col rounded-3xl border bg-card p-6 sm:p-7",
            pkg.highlight ? "border-primary shadow-xl ring-1 ring-primary" : "border-border",
          )}
        >
          {pkg.highlight && (
            <span className="mb-3 w-fit rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold uppercase text-primary-foreground">
              Most popular
            </span>
          )}
          <h3 className="text-2xl font-semibold">{pkg.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{pkg.tagline}</p>
          <p className="mt-5">
            <span className={cn("font-display font-extrabold", pkg.price !== undefined ? "text-3xl" : "text-2xl")}>
              {pkg.price !== undefined ? formatNaira(pkg.price) : "Price on request"}
            </span>
            {pkg.priceNote && <span className="ml-2 text-sm text-muted-foreground">{pkg.priceNote}</span>}
          </p>
          <ul className="mt-5 grid flex-1 gap-2.5 text-sm">
            {pkg.includes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary-ink" /> {item}
              </li>
            ))}
          </ul>
          <WhatsAppButton className="mt-7 w-full" message={`${enquiry} (${pkg.name})`}>
            {pkg.price !== undefined ? "Book on WhatsApp" : "Get a quote"}
          </WhatsAppButton>
        </article>
      ))}
    </div>
  );
}
