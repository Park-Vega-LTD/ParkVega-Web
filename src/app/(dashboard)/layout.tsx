import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/parkvega/dashboard-nav";

/**
 * Authenticated dashboard layout — Server Component.
 *
 * Reads the `pv_access` cookie; if it is absent, redirects to
 * `/login?next=<current path>`. Edge Middleware already guards these routes,
 * but this server-side check is a defence-in-depth fallback (Requirement 10.6).
 *
 * Server Components cannot read `usePathname()`, so the current path is
 * recovered best-effort from headers that Next.js sets on the request
 * (`x-pathname` / `x-invoke-path` / `referer`), defaulting to `/my-bookings`.
 */
async function resolveCurrentPath(): Promise<string> {
  const headerStore = await headers();

  const direct =
    headerStore.get("x-pathname") ??
    headerStore.get("x-invoke-path") ??
    headerStore.get("next-url");
  if (direct && direct.startsWith("/")) return direct;

  const referer = headerStore.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.pathname.startsWith("/")) return url.pathname;
    } catch {
      /* malformed referer — ignore */
    }
  }

  return "/my-bookings";
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("pv_access")?.value;

  if (!accessToken) {
    const path = await resolveCurrentPath();
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row">
        <DashboardNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
