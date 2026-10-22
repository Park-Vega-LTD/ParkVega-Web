import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Staff dashboard layout — Server Component.
 *
 * Minimal shell with no admin sidebar. The authoritative role guard for
 * `/staff/*` (role `staff` or `admin`) is enforced by Edge Middleware per
 * Requirement 9.1 / Requirement 3. This layout only performs a lightweight
 * presence check on the `pv_access` cookie as defence-in-depth, matching the
 * pattern established by the dashboard and admin layouts; it intentionally
 * does NOT duplicate the heavy JWT role-decoding logic.
 */
export default async function StaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("pv_access")?.value;

  if (!accessToken) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</div>
    </div>
  );
}
