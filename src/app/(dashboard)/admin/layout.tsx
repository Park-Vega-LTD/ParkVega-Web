import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

import { AdminNav } from "@/components/parkvega/admin-nav";

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Admin dashboard layout — Server Component role guard.
 *
 * Reads the `pv_access` cookie, verifies the JWT with `JWT_SECRET`, and reads
 * the `role` claim. Any request where the token is missing, invalid, or whose
 * role is neither `admin` nor `staff` is redirected to `/` (Requirements 11.1,
 * 11.9). Staff manage the CMS; admin-only sections are guarded in proxy.ts
 * and hidden from staff in the nav.
 *
 * Edge Middleware already enforces this guard, but verifying again here is
 * defence-in-depth consistent with the pattern used in middleware.ts and the
 * parent (dashboard)/layout.tsx.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("pv_access")?.value;

  if (!accessToken) {
    redirect("/");
  }

  let role: string | undefined;
  try {
    const { payload } = await jwtVerify(accessToken, JWT_SECRET_KEY);
    role = payload.role as string | undefined;
    if (role !== "admin" && role !== "staff") {
      redirect("/");
    }
  } catch (error) {
    // `redirect()` throws a special control-flow signal that must propagate.
    if (
      error instanceof Error &&
      error.message.includes("NEXT_REDIRECT")
    ) {
      throw error;
    }
    // JWT invalid or expired — treat as unauthorised.
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <AdminNav isAdmin={role === "admin"} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
