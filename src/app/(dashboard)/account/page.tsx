import type { Metadata } from "next";

import { AccountForm } from "@/components/parkvega/account-form";
import { CustomerIdBadge } from "@/components/parkvega/account-gate";
import { serverFetch } from "@/lib/api.server";
import type { User } from "@/types/api";

// SSR: the profile is per-user and must reflect the latest saved values, so
// render on every request (Requirement 10.2).
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    // Title: 31 chars (<= 60)
    title: "Account | Park Vega Waterpark",
    // Description: 97 chars (<= 160)
    description:
      "Manage your Park Vega account—update your name and contact phone number to keep details current.",
  };
}

export default async function AccountPage() {
  const user = await serverFetch<User>("/users/me", { cache: "no-store" });

  return (
    <section className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your profile details. Your email is used for sign-in and
          cannot be changed here.
        </p>
        <CustomerIdBadge id={user.customer_id} className="mt-3" />
        {user.customer_id && (
          <p className="mt-2 text-xs text-muted-foreground">
            Quote your customer ID when you contact us about a booking or order.
          </p>
        )}
      </header>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <AccountForm user={user} />
      </div>
    </section>
  );
}
