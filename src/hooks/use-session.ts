"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { clientFetch } from "@/lib/api.client";
import type { User } from "@/types/api";

export const SESSION_KEY = ["session"];

/**
 * The signed-in customer, or null when signed out. Reads `/api/auth/session`,
 * which answers 401 for visitors without a valid login.
 */
export function useSession() {
  const query = useQuery<User | null>({
    queryKey: SESSION_KEY,
    queryFn: () => clientFetch<User>("/api/auth/session").catch(() => null),
    staleTime: 60_000,
    retry: false,
  });
  return { user: query.data ?? null, isLoading: query.isPending };
}

/** Forget the cached session, e.g. after an API call answers 401. */
export function useResetSession() {
  const queryClient = useQueryClient();
  return () => queryClient.setQueryData(SESSION_KEY, null);
}

export function fullName(user: Pick<User, "first_name" | "last_name">) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ");
}
