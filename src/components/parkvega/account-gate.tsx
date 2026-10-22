"use client";

import Link from "next/link";
import { IdCard, LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { nextQuery } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

/** A customer's system-generated ID, shown wherever staff may need to look them up. */
export function CustomerIdBadge({ id, className }: { id?: string | null; className?: string }) {
  if (!id) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-ocean-soft px-3 py-1 text-xs font-semibold text-foreground", className)}>
      <IdCard className="size-3.5 text-primary-ink" aria-hidden="true" />
      Customer ID <span className="font-mono tracking-wide">{id}</span>
    </span>
  );
}

/**
 * Shown in place of a form that needs an account (food orders, group
 * bookings). Both buttons bring the visitor back to `next` afterwards.
 */
export function SignInPrompt({ title, text, next }: { title: string; text: string; next: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-center sm:p-8" role="status">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-ocean-soft text-primary-ink">
        <LogIn className="size-7" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button asChild variant="ticket">
          <Link href={`/login${nextQuery(next)}`}>
            <LogIn className="size-4" aria-hidden="true" /> Log in
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/register${nextQuery(next)}`}>
            <UserPlus className="size-4" aria-hidden="true" /> Create account
          </Link>
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">You&apos;ll come straight back here afterwards.</p>
    </div>
  );
}
