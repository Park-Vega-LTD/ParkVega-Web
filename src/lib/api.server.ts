import { cookies } from 'next/headers'
import type { PaginationMeta } from '@/types/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export class AuthError extends Error {
  constructor(message = 'Unauthenticated') {
    super(message)
  }
}

type Envelope<T> = { data: T; meta: PaginationMeta }

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? `API error ${res.status}`)
  }

  const envelope: Envelope<T> = await res.json()
  return envelope.data
}

/**
 * Fetch public, non-personalised data. It never reads cookies, so pages that
 * use it stay statically cached (ISR) instead of hitting the API per request.
 */
export async function publicFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return apiFetch<T>(path, options)
}

// 401 retry with refresh
export async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('pv_access')?.value

  try {
    return await apiFetch<T>(path, options, accessToken)
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const refreshToken = cookieStore.get('pv_refresh')?.value
      if (!refreshToken) throw new AuthError()

      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!refreshRes.ok) throw new AuthError()

      const { data } = await refreshRes.json()
      // Note: cookie update in Route Handler context only — Server Components cannot set cookies
      return await apiFetch<T>(path, options, data.access_token)
    }
    throw err
  }
}
